from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

from django.conf import settings

urlpatterns = patterns(
    '',
    # Examples:
    # url(r'^$', 'aesheet.views.home', name='home'),
    # url(r'^aesheet/', include('aesheet.foo.urls')),

    url(r'^', include('sheet.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),

    url(r'^accounts/login/$', 'django.contrib.auth.views.login'),
    url(r'^accounts/logout/$', 'views.logout', name="logout"),

    url(r'^accounts/profile/$', 'views.profile', name="profile"),
)
