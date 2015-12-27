from django.conf.urls import patterns, include, url
from django.conf import settings
from django.conf.urls.static import static
import django.contrib.auth.views
import views

from django.contrib import admin
admin.autodiscover()

urlpatterns = [
    url(r'^', include('sheet.urls')),

    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    url(r'^admin/', include(admin.site.urls)),

    url(r'^accounts/login/$', django.contrib.auth.views.login),
    url(r'^accounts/logout/$', views.logout, name="logout"),

    url(r'^accounts/profile/$', views.profile, name="profile"),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
