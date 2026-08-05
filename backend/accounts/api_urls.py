from django.urls import path

from . import (
    api_views,
    feature_api_views,
    image_reference_api_views,
    research_api_views,
)

app_name = "auth_api"

urlpatterns = [
    path("auth/csrf/", api_views.csrf_token, name="csrf"),
    path("auth/signup/", api_views.signup, name="signup"),
    path("auth/login/", api_views.login, name="login"),
    path("auth/logout/", api_views.logout, name="logout"),
    path("auth/me/", api_views.me, name="me"),
    path("auth/profile/", api_views.profile, name="profile"),
    path("auth/password/", api_views.password, name="password"),
    path(
        "settings/feature-groups/",
        feature_api_views.feature_groups,
        name="feature-groups",
    ),
    path(
        "settings/feature-groups/<int:group_id>/",
        feature_api_views.feature_group_detail,
        name="feature-group-detail",
    ),
    path(
        "settings/feature-types/",
        feature_api_views.feature_types,
        name="feature-types",
    ),
    path(
        "settings/feature-types/<int:type_id>/",
        feature_api_views.feature_type_detail,
        name="feature-type-detail",
    ),
    path(
        "settings/feature-values/",
        feature_api_views.feature_values,
        name="feature-values",
    ),
    path(
        "settings/feature-values/<int:value_id>/",
        feature_api_views.feature_value_detail,
        name="feature-value-detail",
    ),
    path(
        "settings/image-references/",
        image_reference_api_views.image_references,
        name="image-references",
    ),
    path(
        "settings/image-references/<int:image_id>/",
        image_reference_api_views.image_reference_detail,
        name="image-reference-detail",
    ),
    path(
        "settings/image-references/<int:image_id>/file/",
        image_reference_api_views.image_reference_file,
        name="image-reference-file",
    ),
    path(
        "research/documents/summary/",
        research_api_views.document_summary,
        name="research-document-summary",
    ),
    path(
        "research/documents/",
        research_api_views.documents,
        name="research-documents",
    ),
    path(
        "research/documents/<int:document_id>/files/body/",
        research_api_views.document_body_file,
        name="research-document-body-file",
    ),
    path(
        "research/documents/<int:document_id>/files/other/<int:file_index>/",
        research_api_views.document_other_file,
        name="research-document-other-file",
    ),
]
