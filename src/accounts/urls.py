import django.contrib.auth.views
import accounts.views as views
from django.conf.urls import url

urlpatterns = [
    url(r'^login/$', django.contrib.auth.views.LoginView.as_view(),
        name='login'),
    url(r'^logout/$', views.logout, name="logout"),

    url(r'^profile/$', views.profile, name="profile"),
]