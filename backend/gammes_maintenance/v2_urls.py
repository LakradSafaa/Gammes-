from django.urls import path

from .v2_api import (
    EPCListCreateAPIView,
    ProfileListCreateAPIView,
    ReferentielValeursAPIView,
    VersionEPCListCreateAPIView,
    VersionMetadataAPIView,
)

urlpatterns = [
    path("referentiels/", ReferentielValeursAPIView.as_view(), name="v2-referentiels"),
    path("epcs/", EPCListCreateAPIView.as_view(), name="v2-epcs"),
    path("version-epcs/", VersionEPCListCreateAPIView.as_view(), name="v2-version-epcs"),
    path("profils-maintenance/", ProfileListCreateAPIView.as_view(), name="v2-profils-maintenance"),
    path("versions/<uuid:version_id>/metadata/", VersionMetadataAPIView.as_view(), name="v2-version-metadata"),
]
