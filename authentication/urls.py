from django.urls import path
from .views import (
    RegisterView, CustomTokenObtainPairView, LogoutView,
    ProfileView, ChangePasswordView, ForgotPasswordView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    path('login', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout', LogoutView.as_view(), name='logout'),
    path('profile', ProfileView.as_view(), name='profile'),
    path('change-password', ChangePasswordView.as_view(), name='change_password'),
    path('forgot-password', ForgotPasswordView.as_view(), name='forgot_password'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
]
