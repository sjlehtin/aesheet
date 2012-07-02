from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns(
    'sheet.views',

    url(r'^characters/$', 'characters_index'),
    url(r'^characters/(?P<char_id>\d+)/$', 'edit_character'),
    url(r'^characters/add_char/$', 'edit_character',
        name="add_char"),

    url(r'^characters/edit_char/(?P<char_id>\d+)?/?$', 'edit_character'),

    url(r'^sheets/edit_sheet/(?P<sheet_id>\d+)?/?$', 'edit_sheet'),

    url(r'^sheets/add_spell_effect/$', 'edit_spell_effect'),
    url(r'^sheets/add_edge/$', 'edit_edge'),
    url(r'^sheets/add_edge_level/$', 'edit_edge_level'),
    url(r'^sheets/add_ranged_weapon_template/$', 'edit_ranged_weapon_template'),
    url(r'^sheets/add_armor_template/$', 'edit_armor_template'),

    # Specific sheets for the characters.
    url(r'^sheets/$', 'sheets_index'),
    url(r'^sheets/(?P<sheet_id>\d+)/$', 'sheet_detail'),

    url(r'^sheets/import/$', 'import_data', name='import'),
    url(r'^sheets/import/success/$', 'import_data',
        name='import-success', kwargs={'success' : True }),
    url(r'^sheets/export/(?P<type>\w+)/$', 'export_data'),
    url(r'^sheets/browse/(?P<type>\w+)/$', 'browse'),
)
