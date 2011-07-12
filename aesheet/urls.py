from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

from dajaxice.core import dajaxice_autodiscover
dajaxice_autodiscover()

from django.conf import settings

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'aesheet.views.home', name='home'),
    # url(r'^aesheet/', include('aesheet.foo.urls')),

    # List of all created characters.
    url(r'^characters/$', 'sheet.views.characters_index'),
    url(r'^characters/(?P<char_id>\d+)/$', 'sheet.views.character_detail'),
    url(r'^characters/add_char/$', 'sheet.views.add_character'),

    # Specific sheets for the characters.
    url(r'^sheets/$', 'sheet.views.sheets_index'),
    url(r'^sheets/(?P<sheet_id>\d+)/$', 'sheet.views.sheet_detail'),


    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
    
    url(r'^%s/' % settings.DAJAXICE_MEDIA_PREFIX, include('dajaxice.urls')),
)
