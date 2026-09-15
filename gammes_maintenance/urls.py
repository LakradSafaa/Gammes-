from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    EquipementViewSet,
    GammeOperatoireViewSet,
    GammeVersionViewSet,
    EPIViewSet,
    VersionEPIViewSet,
    RisqueViewSet,
    VersionRisqueViewSet,
    OutillageViewSet,
    VersionOutillageViewSet,
    PieceRechangeViewSet,
    VersionPieceRechangeViewSet,
    EtapeViewSet,
    ActionEtapeViewSet,
    EtapeImageViewSet,
    DocumentLieViewSet,
    RecommandationViewSet,
    QRCodeGammeViewSet,
    FichierGenereViewSet,
    MediaViewSet,
    DashboardAPIView,
    qr_resolve,
    me,
)


router = DefaultRouter()


router.register(
    r"equipements",
    EquipementViewSet,
    basename="equipement",
)

router.register(
    r"gammes",
    GammeOperatoireViewSet,
    basename="gamme",
)

router.register(
    r"versions",
    GammeVersionViewSet,
    basename="version",
)

router.register(
    r"epis",
    EPIViewSet,
    basename="epi",
)

router.register(
    r"version-epis",
    VersionEPIViewSet,
    basename="version-epi",
)

router.register(
    r"risques",
    RisqueViewSet,
    basename="risque",
)

router.register(
    r"version-risques",
    VersionRisqueViewSet,
    basename="version-risque",
)

router.register(
    r"outillages",
    OutillageViewSet,
    basename="outillage",
)

router.register(
    r"version-outillages",
    VersionOutillageViewSet,
    basename="version-outillage",
)

router.register(
    r"pieces",
    PieceRechangeViewSet,
    basename="piece",
)

router.register(
    r"version-pieces",
    VersionPieceRechangeViewSet,
    basename="version-piece",
)

router.register(
    r"etapes",
    EtapeViewSet,
    basename="etape",
)

router.register(
    r"actions",
    ActionEtapeViewSet,
    basename="action",
)

router.register(
    r"images-etapes",
    EtapeImageViewSet,
    basename="image-etape",
)

router.register(
    r"documents",
    DocumentLieViewSet,
    basename="document",
)

router.register(
    r"recommandations",
    RecommandationViewSet,
    basename="recommandation",
)

router.register(
    r"qr-codes",
    QRCodeGammeViewSet,
    basename="qr-code",
)

router.register(
    r"fichiers",
    FichierGenereViewSet,
    basename="fichier",
)

router.register(
    r"medias",
    MediaViewSet,
    basename="media",
)


urlpatterns = [
    path(
        "",
        include(
            router.urls
        ),
    ),

    path(
        "dashboard/",
        DashboardAPIView.as_view(),
        name="dashboard",
    ),

    path(
        "qr/<str:code>/",
        qr_resolve,
        name="qr-resolve",
    ),

    path(
        "me/",
        me,
        name="me",
    ),
]