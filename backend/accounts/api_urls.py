from django.urls import path

from . import api_views, feature_api_views

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
]
