from django.conf.urls import patterns, url
from sheet.views import (AddSpellEffectView, AddEdgeView, EditCharacterView,
                         AddCharacterView, AddSheetView, EditSheetView,
                         AddEdgeLevelView, AddRangedWeaponTemplateView,
                         AddArmorTemplateView, AddEdgeSkillBonusView)
import sheet.views

urlpatterns = patterns(
    'sheet.views',

    url(r'^characters/$', 'characters_index'),

    url(r'^characters/add_char/$', AddCharacterView.as_view(),
        name="add_char"),

    url(r'^characters/edit_char/(?P<pk>\d+)/$',
        EditCharacterView.as_view(),
        name='edit_character'),

    url(r'^characters/add_sheet/$', AddSheetView.as_view(),
        name="add_sheet"),
    url(r'^characters/edit_sheet/(?P<pk>\d+)/$',
        EditSheetView.as_view(),
        name='edit_sheet'),

    url(r'^sheets/add_spell_effect/$', AddSpellEffectView.as_view(),
        name='add_spell_effect'),

    url(r'^sheets/add_edge/$', AddEdgeView.as_view(), name='add_edge'),

    url(r'^sheets/add_edge_level/$',
        AddEdgeLevelView.as_view(),
        name='add_edge_level'),
    url(r'^sheets/add_edge_skill_bonus/$',
        AddEdgeSkillBonusView.as_view(),
        name='add_edge_skill_bonus'),
    url(r'^sheets/add_ranged_weapon_template/$',
        AddRangedWeaponTemplateView.as_view(),
        name='add_ranged_weapon_template'),
    url(r'^sheets/add_armor_template/$',
        AddArmorTemplateView.as_view(), name='add_armor_template'),

    # Specific sheets for the characters.
    url(r'^sheets/$', 'sheets_index'),
    url(r'^sheets/(?P<sheet_id>\d+)/$', 'sheet_detail'),

    url(r'^sheets/import/$', 'import_data', name='import'),
    url(r'^sheets/import/success/$', 'import_data',
        name='import-success', kwargs={'success' : True }),
    url(r'^sheets/export/(?P<type>\w+)/$', 'export_data'),
    url(r'^sheets/browse/(?P<type>\w+)/$', 'browse'),
    url(r'^sheets/ChangeLog$', 'version_history'),
)

def class_from_name(name):
    components = name.split('_')
    components = [cc.capitalize() for cc in components]
    return getattr(sheet.views, ''.join(components) + "View")

for name in ["add_weapon", "add_weapon_template","add_weapon_quality",
             "add_weapon_special_quality", ]:
    urlpatterns += patterns('sheet.views',
                            url("^sheets/%s/" % name,
                                class_from_name(name).as_view(),
                                name=name))
