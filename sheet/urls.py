from django.conf.urls import patterns, url
import sheet.views
from django.views.generic import RedirectView
from django.core.urlresolvers import reverse_lazy

urlpatterns = patterns(
    'sheet.views',

    url(r'^$', RedirectView.as_view(url=reverse_lazy('sheets_index'))),
    url(r'^characters/$', 'characters_index', name='characters_index'),

    url(r'^characters/add_char/$', sheet.views.AddCharacterView.as_view(),
        name="add_char"),

    url(r'^characters/edit_char/(?P<pk>\d+)/$',
        sheet.views.EditCharacterView.as_view(),
        name='edit_character'),

    url(r'^characters/edit_sheet/(?P<pk>\d+)/$',
        sheet.views.EditSheetView.as_view(),
        name='edit_sheet'),

    # Specific sheets for the characters.
    url(r'^sheets/$', 'sheets_index', name='sheets_index'),
    url(r'^sheets/(?P<sheet_id>\d+)/$', 'sheet_detail', name='sheet_detail'),

    url(r'^import-export/import/$', 'import_data', name='import'),
    url(r'^import-export/export/(?P<type>\w+)/$', 'export_data'),
    url(r'^import-export/browse/(?P<type>\w+)/$', 'browse'),
    url(r'^ChangeLog$', 'version_history'),
    url(r'^TODO$', sheet.views.TODOView.as_view(), name="todo"),
)

def class_from_name(name):
    components = name.split('_')
    components = [cc.capitalize() for cc in components]
    return getattr(sheet.views, ''.join(components) + "View")


CREATE_NAMES = ["add_sheet", "add_edge", "add_edge_level",
                "add_edge_skill_bonus", "add_spell_effect", "add_armor",
                "add_armor_template",
                "add_armor_quality", "add_armor_special_quality", "add_weapon",
                "add_weapon_template", "add_weapon_quality",
                "add_weapon_special_quality", "add_ranged_weapon",
                "add_ranged_weapon_template", "add_miscellaneous_item",
                "add_firearm", "add_ammunition"]

CREATE_URLS = ["sheets/{0}/".format(name) for name in CREATE_NAMES]

for name in CREATE_NAMES:
    urlpatterns += patterns('sheet.views',
                            url("^sheets/%s/" % name,
                                class_from_name(name).as_view(),
                                name=name))
