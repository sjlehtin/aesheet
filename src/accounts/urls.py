import django.contrib.auth.views
import accounts.views as views
from django.urls import path

urlpatterns = [
    path('login/', django.contrib.auth.views.LoginView.as_view(),
         name='login'),
    path('logout/', views.logout, name="logout"),

    path('profile/', views.profile, name="profile"),
]