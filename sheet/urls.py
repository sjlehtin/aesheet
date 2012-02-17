from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns(
    'sheet.views',

    url(r'^characters/$', 'characters_index'),
    url(r'^characters/(?P<char_id>\d+)/$', 'character_detail'),
    url(r'^characters/add_char/$', 'edit_character',
        name="add_char"),
    url(r'^characters/edit_char/$', 'edit_character'),
    url(r'^characters/edit_char/(?P<char_id>\d+)/$',
        'edit_character', name="edit_char"),

    url(r'^sheets/edit_sheet/(?P<sheet_id>\d+)?/?$', 'edit_sheet'),

    # Specific sheets for the characters.
    url(r'^sheets/$', 'sheets_index'),
    url(r'^sheets/(?P<sheet_id>\d+)/$', 'sheet_detail'),

    url(r'^sheets/import/$', 'import_data', name='import'),
    url(r'^sheets/import/success/$', 'import_data',
        name='import-success', kwargs={'success' : True }),
    url(r'^sheets/export/(?P<type>\w+)/$', 'export_data'),
    url(r'^sheets/browse/(?P<type>\w+)/$', 'browse'),
)
