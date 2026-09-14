from uuid import UUID

from django.db import connection, transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


def dictfetchall(cursor):
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


class ReferentielValeursAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categorie = (request.query_params.get("categorie") or "").strip()
        if not categorie:
            return Response({"detail": "La catégorie est obligatoire."}, status=400)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, categorie, code, libelle, ordre
                FROM referentiel_valeurs
                WHERE categorie = %s AND actif = true
                ORDER BY ordre, libelle
                """,
                [categorie],
            )
            return Response(dictfetchall(cursor))


class EPCListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, nom, description, image_url, actif FROM epcs WHERE actif=true ORDER BY nom"
            )
            return Response(dictfetchall(cursor))

    def post(self, request):
        nom = (request.data.get("nom") or "").strip()
        if not nom:
            return Response({"detail": "Le nom est obligatoire."}, status=400)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO epcs(nom, description, image_url)
                VALUES(%s, %s, %s)
                ON CONFLICT(nom) DO UPDATE SET
                    description=EXCLUDED.description,
                    image_url=EXCLUDED.image_url,
                    actif=true
                RETURNING id, nom, description, image_url, actif
                """,
                [nom, request.data.get("description"), request.data.get("image_url")],
            )
            row = dictfetchall(cursor)[0]
        return Response(row, status=status.HTTP_201_CREATED)


class VersionEPCListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        version = request.data.get("version")
        epc = request.data.get("epc")
        if not version or not epc:
            return Response({"detail": "version et epc sont obligatoires."}, status=400)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO version_epcs(version_id, epc_id)
                VALUES(%s, %s)
                ON CONFLICT DO NOTHING
                """,
                [version, epc],
            )
        return Response({"version": version, "epc": epc}, status=201)


class ProfileListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, nom, prenom, poste, metier, domaine, actif
                FROM profils_maintenance
                WHERE actif=true
                ORDER BY nom, prenom
                """
            )
            return Response(dictfetchall(cursor))

    def post(self, request):
        nom = (request.data.get("nom") or "").strip()
        if not nom:
            return Response({"detail": "Le nom est obligatoire."}, status=400)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO profils_maintenance(nom, prenom, poste, metier, domaine)
                VALUES(%s,%s,%s,%s,%s)
                RETURNING id, nom, prenom, poste, metier, domaine, actif
                """,
                [
                    nom,
                    request.data.get("prenom"),
                    request.data.get("poste"),
                    request.data.get("metier"),
                    request.data.get("domaine"),
                ],
            )
            row = dictfetchall(cursor)[0]
        return Response(row, status=201)


class VersionMetadataAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, version_id):
        type_arret = request.data.get("type_arret")
        redacteur = request.data.get("redacteur")
        valideur = request.data.get("valideur")

        with connection.cursor() as cursor:
            cursor.execute("SELECT statut FROM gamme_versions WHERE id=%s", [version_id])
            row = cursor.fetchone()
            if not row:
                return Response({"detail": "Version introuvable."}, status=404)
            if row[0] in {"validee", "archivee"}:
                return Response(
                    {"detail": "Une version validée ou archivée est non modifiable."},
                    status=409,
                )

            cursor.execute(
                """
                UPDATE gamme_versions
                SET type_arret = COALESCE(%s, type_arret),
                    arret = CASE
                        WHEN %s IS NULL THEN arret
                        WHEN %s = 'aucun' THEN false
                        ELSE true
                    END,
                    redacteur = COALESCE(NULLIF(%s,''), redacteur),
                    valideur = COALESCE(NULLIF(%s,''), valideur),
                    updated_at = now()
                WHERE id = %s
                RETURNING id, type_arret, redacteur, valideur, arret
                """,
                [type_arret, type_arret, type_arret, redacteur, valideur, version_id],
            )
            result = dictfetchall(cursor)[0]
        return Response(result)
