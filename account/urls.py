from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('register/', views.register, name='account-register'),
    path('login/', auth_views.LoginView.as_view(template_name='account/login.html'), name='account-login'),
    path('logout/', auth_views.LogoutView.as_view(template_name='account/logout.html'), name='account-logout'),
]