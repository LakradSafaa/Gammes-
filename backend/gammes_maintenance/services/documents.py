from io import BytesIO

import qrcode

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.template.loader import render_to_string

from docx import Document
from docx.shared import Inches

from gammes_maintenance.models import FichierGenere


# ============================================================
# WEASYPRINT
# ============================================================

try:
    from weasyprint import HTML
except (ImportError, OSError):
    HTML = None


# ============================================================
# LIBELLES
# ============================================================

STATUT_LABELS = {
    "brouillon": "Brouillon",
    "en_validation": "En validation",
    "validee": "Validée",
    "archivee": "Archivée",
}


TYPE_MAINTENANCE_LABELS = {
    "preventif": "Préventive",
    "correctif": "Corrective",
    "amelioratif": "Améliorative",
}


# ============================================================
# FONCTIONS UTILITAIRES
# ============================================================

def get_statut_label(version):
    """
    Retourne le libellé du statut.
    """

    statut = getattr(version, "statut", None)

    if not statut:
        return "-"

    return STATUT_LABELS.get(
        statut,
        str(statut).replace("_", " ").capitalize(),
    )


def get_type_maintenance_label(version):
    """
    Retourne le libellé du type de maintenance.
    """

    type_maintenance = getattr(
        version,
        "type_maintenance",
        None,
    )

    if not type_maintenance:
        return "-"

    return TYPE_MAINTENANCE_LABELS.get(
        type_maintenance,
        str(type_maintenance)
        .replace("_", " ")
        .capitalize(),
    )


def save_generated_file(
    version,
    file_type,
    filename,
    data,
):
    """
    Enregistre le fichier généré avec le storage Django
    puis crée l'enregistrement dans fichiers_generes.
    """

    storage_path = (
        f"generated/"
        f"{version.gamme.code}/"
        f"{version.code_version}/"
        f"{filename}"
    )

    if default_storage.exists(storage_path):
        default_storage.delete(storage_path)

    saved_path = default_storage.save(
        storage_path,
        ContentFile(data),
    )

    try:
        file_url = default_storage.url(saved_path)
    except Exception:
        file_url = saved_path

    fichier = FichierGenere.objects.create(
        version=version,
        type_fichier=file_type,
        fichier_url=file_url,
        nom_fichier=filename,
    )

    return fichier


# ============================================================
# QR CODE
# ============================================================

def qr_png_bytes(version):
    """
    Génère le QR Code dynamique de la gamme.
    """

    app_base_url = getattr(
        settings,
        "APP_BASE_URL",
        "http://localhost:5173",
    ).rstrip("/")

    url = (
        f"{app_base_url}/qr/"
        f"{version.gamme.code}"
    )

    image = qrcode.make(url)

    buffer = BytesIO()

    image.save(
        buffer,
        format="PNG",
    )

    buffer.seek(0)

    return buffer.getvalue()


# ============================================================
# PDF
# ============================================================

def generate_pdf(version):
    """
    Génère le PDF d'une version.
    """

    if HTML is None:
        raise RuntimeError(
            "WeasyPrint n'est pas disponible sur cette machine. "
            "Sous Windows, les dépendances système GTK/Pango "
            "doivent être installées avant la génération PDF."
        )

    html = render_to_string(
        "gammes/version_pdf.html",
        {
            "version": version,
            "statut_label": get_statut_label(version),
            "type_maintenance_label":
                get_type_maintenance_label(version),
        },
    )

    pdf_data = HTML(
        string=html,
        base_url=str(settings.BASE_DIR),
    ).write_pdf()

    filename = (
        f"{version.gamme.code}_"
        f"{version.code_version}.pdf"
    )

    return save_generated_file(
        version=version,
        file_type="pdf",
        filename=filename,
        data=pdf_data,
    )


# ============================================================
# WORD
# ============================================================

def generate_docx(version):
    """
    Génère le document Word d'une version de gamme opératoire.
    """

    document = Document()

    # ========================================================
    # TITRE
    # ========================================================

    document.add_heading(
        f"Gamme opératoire - {version.gamme.code}",
        level=0,
    )

    document.add_paragraph(
        f"Désignation : "
        f"{version.gamme.designation or '-'}"
    )

    document.add_paragraph(
        f"Version : {version.code_version} "
        f"| Statut : {get_statut_label(version)}"
    )

    if getattr(version, "date_version", None):
        document.add_paragraph(
            f"Date de version : {version.date_version}"
        )

    # ========================================================
    # INFORMATIONS GÉNÉRALES
    # ========================================================

    document.add_heading(
        "Informations générales",
        level=1,
    )

    document.add_paragraph(
        "Type de maintenance : "
        f"{get_type_maintenance_label(version)}"
    )

    document.add_paragraph(
        f"Périodicité : "
        f"{version.periodicite or '-'}"
    )

    document.add_paragraph(
        f"Main-d'œuvre : "
        f"{version.main_oeuvre or 0}"
    )

    document.add_paragraph(
        f"Durée totale : "
        f"{version.duree_minutes or 0} minutes"
    )

    document.add_paragraph(
        f"Rédacteur : "
        f"{version.redacteur or '-'}"
    )

    document.add_paragraph(
        f"Valideur : "
        f"{version.valideur or '-'}"
    )

    if version.modifications:
        document.add_paragraph(
            f"Modifications : "
            f"{version.modifications}"
        )

    # ========================================================
    # PARAMÈTRES
    # ========================================================

    document.add_heading(
        "Paramètres d'intervention",
        level=1,
    )

    document.add_paragraph(
        f"Référentiel : "
        f"{'Oui' if version.referentiel else 'Non'}"
    )

    document.add_paragraph(
        f"Rapport : "
        f"{'Oui' if version.rapport else 'Non'}"
    )

    document.add_paragraph(
        f"Production : "
        f"{'Oui' if version.production else 'Non'}"
    )

    document.add_paragraph(
        f"Arrêt : "
        f"{'Oui' if version.arret else 'Non'}"
    )

    document.add_paragraph(
        f"Mode dégradé : "
        f"{'Oui' if version.degrade else 'Non'}"
    )

    # ========================================================
    # RISQUES
    # ========================================================

    document.add_heading(
        "Risques",
        level=1,
    )

    risques = (
        version.version_risques
        .select_related("risque")
        .all()
    )

    if risques.exists():

        for association in risques:

            document.add_paragraph(
                association.risque.nom,
                style="List Bullet",
            )

    else:

        document.add_paragraph(
            "Aucun risque renseigné."
        )

    # ========================================================
    # EPI
    # ========================================================

    document.add_heading(
        "Équipements de protection individuelle",
        level=1,
    )

    epis = (
        version.version_epis
        .select_related("epi")
        .all()
    )

    if epis.exists():

        for association in epis:

            document.add_paragraph(
                association.epi.nom,
                style="List Bullet",
            )

    else:

        document.add_paragraph(
            "Aucun EPI renseigné."
        )

    # ========================================================
    # OUTILLAGES
    # ========================================================

    document.add_heading(
        "Outillages",
        level=1,
    )

    outillages = (
        version.version_outillages
        .select_related("outillage")
        .all()
    )

    if outillages.exists():

        for association in outillages:

            quantite = (
                association.quantite
                if association.quantite is not None
                else 1
            )

            document.add_paragraph(
                f"{association.outillage.nom} "
                f"× {quantite}",
                style="List Bullet",
            )

    else:

        document.add_paragraph(
            "Aucun outillage renseigné."
        )

    # ========================================================
    # PIÈCES DE RECHANGE
    # ========================================================

    document.add_heading(
        "Pièces de rechange",
        level=1,
    )

    # IMPORTANT :
    # le related_name réel du modèle est
    # version_pieces_rechange

    pieces = (
        version.version_pieces_rechange
        .select_related("piece")
        .all()
    )

    if pieces.exists():

        for association in pieces:

            quantite = (
                association.quantite
                if association.quantite is not None
                else 1
            )

            code_piece = (
                association.piece.code or ""
            )

            if code_piece:

                texte = (
                    f"{code_piece} - "
                    f"{association.piece.nom} "
                    f"× {quantite}"
                )

            else:

                texte = (
                    f"{association.piece.nom} "
                    f"× {quantite}"
                )

            document.add_paragraph(
                texte,
                style="List Bullet",
            )

    else:

        document.add_paragraph(
            "Aucune pièce de rechange renseignée."
        )

    # ========================================================
    # ÉTAPES ET ACTIONS
    # ========================================================

    document.add_heading(
        "Étapes et actions",
        level=1,
    )

    etapes = (
        version.etapes
        .prefetch_related(
            "actions",
            "images",
        )
        .order_by(
            "ordre",
            "numero",
        )
    )

    if etapes.exists():

        for etape in etapes:

            document.add_heading(
                f"{etape.numero}. "
                f"{etape.titre}",
                level=2,
            )

            document.add_paragraph(
                f"Durée : "
                f"{etape.duree_minutes or 0} minutes"
            )

            if etape.description:

                document.add_paragraph(
                    etape.description
                )

            # ------------------------------------------------
            # ACTIONS
            # ------------------------------------------------

            actions = (
                etape.actions
                .all()
                .order_by("ordre")
            )

            if actions.exists():

                document.add_paragraph(
                    "Actions :"
                )

                for action in actions:

                    document.add_paragraph(
                        f"{action.ordre}. "
                        f"{action.contenu}",
                        style="List Bullet",
                    )

            else:

                document.add_paragraph(
                    "Aucune action renseignée."
                )

            # ------------------------------------------------
            # IMAGES
            # ------------------------------------------------

            images = (
                etape.images
                .all()
                .order_by("ordre")
            )

            if images.exists():

                document.add_paragraph(
                    "Images associées :"
                )

                for image in images:

                    texte_image = (
                        image.description
                        or image.image_url
                        or "Image"
                    )

                    document.add_paragraph(
                        texte_image,
                        style="List Bullet",
                    )

    else:

        document.add_paragraph(
            "Aucune étape renseignée."
        )

    # ========================================================
    # RECOMMANDATIONS
    # ========================================================

    document.add_heading(
        "Recommandations",
        level=1,
    )

    recommandations = (
        version.recommandations.all()
    )

    if recommandations.exists():

        for recommandation in recommandations:

            if recommandation.titre:

                document.add_heading(
                    recommandation.titre,
                    level=2,
                )

            document.add_paragraph(
                recommandation.contenu
            )

    else:

        document.add_paragraph(
            "Aucune recommandation renseignée."
        )

    # ========================================================
    # DOCUMENTS LIÉS
    # ========================================================

    document.add_heading(
        "Documents liés",
        level=1,
    )

    documents_lies = (
        version.documents.all()
    )

    if documents_lies.exists():

        for document_lie in documents_lies:

            texte = document_lie.titre

            if document_lie.reference:

                texte += (
                    f" - Référence : "
                    f"{document_lie.reference}"
                )

            document.add_paragraph(
                texte,
                style="List Bullet",
            )

            if document_lie.description:

                document.add_paragraph(
                    document_lie.description
                )

            if document_lie.fichier_url:

                document.add_paragraph(
                    f"Fichier : "
                    f"{document_lie.fichier_url}"
                )

    else:

        document.add_paragraph(
            "Aucun document lié."
        )

    # ========================================================
    # DURÉE TOTALE
    # ========================================================

    document.add_heading(
        "Durée totale",
        level=1,
    )

    document.add_paragraph(
        f"{version.duree_minutes or 0} minutes"
    )

    # ========================================================
    # QR CODE
    # ========================================================

    document.add_heading(
        "QR Code",
        level=1,
    )

    try:

        qr_data = qr_png_bytes(version)

        qr_buffer = BytesIO(qr_data)

        document.add_picture(
            qr_buffer,
            width=Inches(1.8),
        )

        app_base_url = getattr(
            settings,
            "APP_BASE_URL",
            "http://localhost:5173",
        ).rstrip("/")

        document.add_paragraph(
            f"{app_base_url}/qr/"
            f"{version.gamme.code}"
        )

    except Exception:

        document.add_paragraph(
            "QR Code indisponible."
        )

    # ========================================================
    # CRÉATION DU FICHIER WORD
    # ========================================================

    buffer = BytesIO()

    document.save(buffer)

    buffer.seek(0)

    filename = (
        f"{version.gamme.code}_"
        f"{version.code_version}.docx"
    )

    return save_generated_file(
        version=version,
        file_type="word",
        filename=filename,
        data=buffer.getvalue(),
    )