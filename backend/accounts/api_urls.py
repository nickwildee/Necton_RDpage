from django.urls import path

from . import api_views

app_name = "auth_api"

urlpatterns = [
    path("auth/csrf/", api_views.csrf_token, name="csrf"),
    path("auth/signup/", api_views.signup, name="signup"),
    path("auth/login/", api_views.login, name="login"),
    path("auth/logout/", api_views.logout, name="logout"),
    path("auth/me/", api_views.me, name="me"),
]
