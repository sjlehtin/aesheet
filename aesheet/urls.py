from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'aesheet.views.home', name='home'),
    # url(r'^aesheet/', include('aesheet.foo.urls')),

    # List of all created characters.
    url(r'^characters/$', 'sheet.views.characters_index'),
    url(r'^characters/(?P<char_id>\d+)/$', 'sheet.views.character_detail'),
    # Specific sheets for the characters.
    url(r'^sheets/$', 'sheet.views.sheets_index'),
    url(r'^sheets/(?P<sheet_id>\d+)/$', 'sheet.views.sheet_detail'),
    url(r'^sheets/(?P<sheet_id>\d+)/add_weapon/$', 
        'sheet.views.sheet_add_weapon'),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)
