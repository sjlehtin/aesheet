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
    url(r'^characters/add_char/$', 'sheet.views.edit_character',
        name="add_char"),
    url(r'^characters/edit_char/$',
        'sheet.views.edit_character'),
    url(r'^characters/edit_char/(?P<char_id>\d+)/$',
        'sheet.views.edit_character', name="edit_char"),
    url(r'^sheets/edit_sheet/$',
        'sheet.views.edit_sheet'),

    # Specific sheets for the characters.
    url(r'^sheets/$', 'sheet.views.sheets_index'),
    url(r'^sheets/(?P<sheet_id>\d+)/$', 'sheet.views.sheet_detail'),

    url(r'^sheets/import/$', 'sheet.views.import_data'),
    url(r'^sheets/export/(?P<type>\w+)/$', 'sheet.views.export_data'),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),

    url(r'^accounts/login/$', 'django.contrib.auth.views.login'),
    url(r'^accounts/logout/$', 'views.logout'),

    url(r'^accounts/profile/$', 'views.profile'),

    url(r'^%s/' % settings.DAJAXICE_MEDIA_PREFIX, include('dajaxice.urls')),
)
