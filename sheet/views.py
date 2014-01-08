TODO = """
+ = done
- = not done

Priority list by JW:

- possibility to copy characters and sheets (mainly sheets), which will copy
  also the underlying character.
- character addition form layout for easier "intake" (group cur, starting
  stats, show raises).
- adding weapon inplace ("add row" functionality), instead of the large set of
  controls.  Might already be sufficient with the condensed layout, verify with
  JW.
-- access controls
--- marking sheet as only visible to self (SM)
--- marking characters as only visible to self (SM)
    these should not show in the lists.


- character mugshot upload (SM)
- senses (SM)
- movement chart (SM)
- spell skill checks (SM)

- Creating a new character should automatically create a sheet for that
  character and redirect to edit the new character.

- form errors should be highlighted, and if the form element is hidden, it
  should be shown by default (errors in add forms can get hidden)
-- form errorlist class should be highlighted.

- you should be able to leave current stats empty on character creation,
  in which case the stats would be filled in from the initial stats.

-- xl and e range dependent on user FIT (SM)
-- password change (SM)
+ wondrous items
- inventory ?
- magic item location (only one item to each location)
+ change log for sheet (stat modifications etc)
-- skills
-- edges
- nicer fast edit of basic stats
+ stamina
-- recovery
+ mana
-- recovery
+ body
-- recovery
- code simplification
- save bonuses (M)
- encumbrance breakdown (M)
- sheet styling

- weapon maximum damage based on durability.

- short description of spell effect (+50 FIT etc)
- suspended weight

- Basic skill checks:  Adding skills without any points (or reduced amount of
  points) allocated.  For example, Climbing B -> show skill check at half
  ability.  This is a larger item than it sounds, as the current design assumes
  whole skill levels.  Investigate if could be done as a skill level model
  field.

- Inserting None as skill cost to the sheet should work to allow resetting
  skill costs from CSV import.

- creating new objects should be ajaxiced and redirects should occur in a
  sensible manner.

- hardened skin + toughness -> natural weapons durability.
-- NaturalWeaponDura=Aleth+HdSkin+ROUNDDOWN(Toughness/2)+SizeModifier
- size field for weapons (huge cretin with Large bite)

- free edges based on campaign (probably should think about race
  in this context, for FRP at least)

Minor:

- adding missing skills (helps in just allowing inserting primary skills
  and autofilling rest)

Firearms:

- using two Berettas akimbo.  Check rule situation regarding instinctive fire.
- firearms in CC.
- some weapons with autofire do not have sweep fire enabled.
- some weapons have restricted burst (restricted to 2 or 3 shots).
- adding weapon with inline form does not allow setting ammo types.

"""

BUGS = """
- Adding skills with multiple prereqs doesn't work.
- Better error messages on importing completely invalid CSV (heading line or
  data type broken)
- crossbows should not have FIT modifiers for damage
- draw I missing
"""

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template import RequestContext
from sheet.models import *
from sheet.forms import *
from django.core.exceptions import ValidationError
import django.forms.util
from django.conf import settings
from django.core.urlresolvers import reverse, reverse_lazy
import django.db.models
from django.views.generic import UpdateView, CreateView
import sheet.models
import sheet.forms
import csv
import StringIO
from django.db.models.fields import FieldDoesNotExist
import os.path
import subprocess
from django.views.generic import TemplateView
import logging
from collections import namedtuple
import django.db

logger = logging.getLogger(__name__)


def characters_index(request):
    return render_to_response('sheet/characters_index.html',
                              { 'campaigns': Character.get_by_campaign()},
                              context_instance=RequestContext(request))


def sheets_index(request):
    return render_to_response('sheet/sheets_index.html',
                              { 'campaigns': Sheet.get_by_campaign()},
                              context_instance=RequestContext(request))


class GenWrapper(object):
    def __init__(self, item, type=None):
        self.item = item

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.item, v)

    def __unicode__(self):
        return unicode(self.item)


class RemoveWrap(object):
    def __init__(self, item, type=None):
        self.item = item
        self.type = type

    @property
    def remove_form(self):
        if self.type:
            type = self.type
        else:
            type = self.item.__class__.__name__
        return RemoveGenericForm(item=self.item,
                             item_type=type,
                             prefix='remove')

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.item, v)

    def __unicode__(self):
        return unicode(self.item)


class SkilledMixin(object):
    def skilled(self):
        return self.sheet.skilled(self.item)


class WeaponWrap(RemoveWrap, SkilledMixin):
    class Stats(object):
        rendered_attack_inits = 4
        rendered_defense_inits = 3
        def __init__(self, item, sheet, use_type):
            self.use_type = use_type
            self.sheet = sheet
            self.item = item

        def roa(self):
            return self.sheet.roa(self.item, use_type=self.use_type)

        def skill_checks(self):
            checks = self.sheet.weapon_skill_checks(self.item,
                                                    use_type=self.use_type)
            if len(checks) < len(self.sheet.actions):
                checks.extend([''] * (len(self.sheet.actions) - len(checks)))
            return checks

        def initiatives(self):
            inits = self.sheet.initiatives(self.item, use_type=self.use_type)
            if len(inits) < self.rendered_attack_inits:
                inits.extend([''] * (self.rendered_attack_inits - len(inits)))
            return inits[0:self.rendered_attack_inits]

        def defense_initiatives(self):
            inits = self.sheet.defense_initiatives(self.item,
                                                   use_type=self.use_type)
            if len(inits) < self.rendered_defense_inits:
                inits.extend([''] * (self.rendered_defense_inits - len(inits)))
            return inits[0:self.rendered_defense_inits]

        def damage(self):
            return self.sheet.damage(self.item, use_type=self.use_type)

        def defense_damage(self):
            return self.sheet.defense_damage(self.item, use_type=self.use_type)

    def __init__(self, item, sheet):
        super(WeaponWrap, self).__init__(item)
        self.item = item
        self.sheet = sheet
        self.special = self.Stats(self.item, self.sheet, use_type=sheet.SPECIAL)
        self.full = self.Stats(self.item, self.sheet, use_type=sheet.FULL)
        self.pri = self.Stats(self.item, self.sheet, use_type=sheet.PRI)
        self.sec = self.Stats(self.item, self.sheet, use_type=sheet.SEC)


Action = namedtuple('Action', ['action', 'check'])


class FirearmWrap(RemoveWrap, SkilledMixin):
    def __init__(self, item, sheet):
        super(FirearmWrap, self).__init__(item)
        self.sheet = sheet
        self.item = item

    def rof(self):
        return self.sheet.rof(self.item)

    def skill_checks(self):
        return self.sheet.firearm_skill_checks(self.item)

    def ranges(self):
        return self.sheet.ranged_ranges(self.item)

    def initiatives(self):
        return self.sheet.initiatives(self.item)

    def level(self):
        return self.sheet.character.skill_level(self.item.base.base_skill)

    def draw_initiative(self):
        return self.item.base.draw_initiative

    def target_initiative(self):
        return self.item.base.target_initiative

    def burst_fire_skill_checks(self):
        return self.sheet.firearm_burst_fire_skill_checks(self.item)

    def sweep_fire_skill_checks(self):
        return self.sheet.firearm_sweep_fire_skill_checks(self.item)


class RangedWeaponWrap(FirearmWrap):
    def skill_checks(self):
        return self.sheet.ranged_skill_checks(self.item)

    def damage(self):
        return self.sheet.damage(self.item, use_type=Sheet.PRI)


class SkillWrap(RemoveWrap):
    def __init__(self, item, sheet):
        super(SkillWrap, self).__init__(item)
        self.sheet = sheet
        self.children = []

    def add_level_form(self):
        return CharacterSkillLevelModifyForm(instance=self.item,
                                             initial={ 'function': 'add' },
                                             prefix="skill-level-modify")

    def dec_level_form(self):
        return CharacterSkillLevelModifyForm(instance=self.item,
                                             initial={ 'function': 'dec' },
                                             prefix="skill-level-modify")

    def check(self):
        return self.item.check(self.sheet)


class ArmorWrap(RemoveWrap):
    def __init__(self, item, sheet, type):
        super(ArmorWrap, self).__init__(item, type)
        self.sheet = sheet

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()

        if v.startswith("armor_"):
            value = 0
            # TODO: Rethink, this is approaching the ludicrous.
            for misc_item in self.sheet.miscellaneous_items.all():
                logger.debug("getting " + v)
                for quality in misc_item.armor_qualities.all():
                    effect_value = getattr(quality, v, 0)
                    logger.debug("got {0}: {1}".format(v, effect_value))
                    value += effect_value

            original_value = 0
            if self.item:
                original_value = getattr(self.item, v)
                value += original_value
            logger.debug("Value for {value}: {current}, Orig: {original}".format(
                value=v, current=value, original=original_value))
            return value
        else:
            return getattr(self.item, v)


class SheetView(object):
    def __init__(self, sheet):
        self.sheet = sheet

    @property
    def base_stats(self):
        ll = []
        for st in ["fit", "ref", "lrn", "int", "psy", "wil", "cha", "pos"]:
            stat = {'name' : st,
                    'base' : getattr(self.sheet, st),
                    'eff' : getattr(self.sheet, "eff_" + st),
                    }
            stat.update({
                'add_form': StatModifyForm(
                    instance=self.sheet.character,
                    initial={'stat': "cur_" + st,
                             'function': "add"},
                    prefix='stat-modify'),
                'dec_form': StatModifyForm(
                    instance=self.sheet.character,
                    initial={'stat': "cur_" + st,
                             'function': "dec"},
                    prefix='stat-modify'),
                'change': getattr(self.sheet, "cur_" + st) -
                          getattr(self.sheet, "start_" + st),
            })
            ll.append(stat)
        return ll

    @property
    def derived_stats(self):
        ll = []
        for st in ["mov", "dex", "imm"]:
            stat = {'name' : st,
                    'base' : getattr(self.sheet, st),
                    'eff' : getattr(self.sheet, "eff_" + st),
                    }
            ll.append(stat)
        return ll

    @property
    def weapons(self):
        return [WeaponWrap(xx, self.sheet)
                for xx in self.sheet.weapons.all()]

    @property
    def ranged_weapons(self):
        return [RangedWeaponWrap(xx, self.sheet)
              for xx in self.sheet.ranged_weapons.all()]

    @property
    def firearms(self):
        return [FirearmWrap(xx, self.sheet)
              for xx in self.sheet.firearms.all()]

    @property
    def spell_effects(self):
        return [RemoveWrap(xx) for xx in self.sheet.spell_effects.all()]

    @property
    def skills(self):
        ll = [SkillWrap(xx, self.sheet)
              for xx in
              self.sheet.skills.all()]
        skills = dict()
        skills.update([(sk.skill.name, sk) for sk in ll])

        class Node(object):
            def __init__(self):
                self.children = []
        root = Node()

        for sk in ll:
            # Assign as child of first required skill.
            reqd = sk.skill.required_skills.all()
            if len(reqd) and reqd[0].name in skills:
                skills[reqd[0].name].children.append(sk)
            else:
                root.children.append(sk)
        logger.debug("Original skill list length: %d", len(ll))
        def depthfirst(node, indent):
            yield node, indent
            for cc in node.children:
                for nn in depthfirst(cc, indent + 1):
                    yield nn
        ll = []
        for nn, indent in depthfirst(root, 0):
            nn.indent = indent
            ll.append(nn)
        logger.debug("New skill list length: %d", len(ll))
        return ll[1:] # Skip root node.

    @property
    def edges(self):
        return [RemoveWrap(xx) for xx in self.sheet.edges.all()]

    @property
    def armor(self):
        return ArmorWrap(self.sheet.armor, sheet=self.sheet, type="Armor")

    @property
    def helm(self):
        return ArmorWrap(self.sheet.helm, sheet=self.sheet, type="Helm")

    @property
    def miscellaneous_items(self):
        return [RemoveWrap(xx) for xx in self.sheet.miscellaneous_items.all()]

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.sheet, v)

def process_sheet_change_request(request, sheet):
    assert request.method == "POST"

    form = RemoveGenericForm(request.POST, prefix='remove')
    if form.is_valid():
        item = form.cleaned_data['item']
        item_type = form.cleaned_data['item_type']
        logger.info("Removing %s" % item_type)
        if item_type == "Weapon":
            item = get_object_or_404(Weapon, pk=item)
            sheet.weapons.remove(item)
        elif item_type == "RangedWeapon":
            item = get_object_or_404(RangedWeapon, pk=item)
            sheet.ranged_weapons.remove(item)
        elif item_type == "Firearm":
            item = get_object_or_404(Firearm, pk=item)
            sheet.firearms.remove(item)
        elif item_type == "Armor":
            sheet.armor = None
        elif item_type == "Helm":
            sheet.helm = None
        elif item_type == "SpellEffect":
            item = get_object_or_404(SpellEffect, pk=item)
            sheet.spell_effects.remove(item)
        elif item_type == "MiscellaneousItem":
            item = get_object_or_404(MiscellaneousItem, pk=item)
            sheet.miscellaneous_items.remove(item)
        elif item_type == "CharacterSkill":
            item = get_object_or_404(CharacterSkill, pk=item)
            item.delete()
        elif item_type == "CharacterEdge":
            item = get_object_or_404(CharacterEdge, pk=item)
            item.delete()
        else:
            raise ValidationError("Invalid item type")
        sheet.full_clean()
        sheet.save()
        return True
    # removal forms are forgotten and not updated on failures.

    return False


Notes = namedtuple("Notes", ["positive", "negative"])


def get_notes(character, filter_kwargs):
    args = { 'character': character }
    args.update(filter_kwargs)
    positive = CharacterEdge.objects.filter(**args).exclude(
                  edge__notes=u'').values_list('edge__edge__name',
                                               'edge__notes')
    return positive


def sheet_detail(request, sheet_id=None):
    sheet = get_object_or_404(Sheet.objects.select_related()
                              .select_related('sheet__armor__base',
                                              'sheet__armor__quality'
                                              'sheet__helm',)
                              .prefetch_related(
            'spell_effects',
            'weapons__base',
            'weapons__quality',
            'ranged_weapons__base',
            'ranged_weapons__quality',
            'miscellaneous_items',
            'character__campaign',
            'character__skills',
            'character__skills__skill',
            'character__skills__skill__required_skills',
            'character__skills__skill__edgeskillbonus_set',
            'character__edges',
            'character__edges__edge__skill_bonuses'),
                              pk=sheet_id)

    forms = {}

    positive = get_notes(sheet.character, { 'edge__cost__gt': 0 })
    negative = get_notes(sheet.character, { 'edge__cost__lte': 0 })
    notes = Notes(positive=positive, negative=negative)

    if request.method == "POST":
        data = request.POST
    else:
        data = None

    forms['_stat_modify'] = StatModifyForm(data,
                                           instance=sheet.character,
                                           request=request,
                                           prefix="stat-modify")
    forms['_skill_modify'] = CharacterSkillLevelModifyForm(
        data,
        prefix="skill-level-modify")
    forms['add_skill_form'] = AddSkillForm(data,
                                           instance=sheet.character,
                                           request=request,
                                           prefix="add-skill")
    forms['add_lang_form'] = AddLanguageForm(data,
                                             instance=sheet.character,
                                             prefix="add-language")
    forms['add_edge_form'] = AddEdgeForm(data,
                                         instance=sheet.character,
                                         prefix="add-edge")
    forms['add_spell_effect_form'] = AddSpellEffectForm(
        data, instance=sheet, prefix="add-spell-effect")
    forms['add_existing_helm_form'] = AddExistingHelmForm(
        data, instance=sheet, prefix="add-existing-helm")
    forms['add_helm_form'] = AddHelmForm(
        data, instance=sheet, prefix="add-helm")
    forms['add_existing_armor_form'] = AddExistingArmorForm(
        data, instance=sheet, prefix="add-existing-armor")
    forms['add_armor_form'] = AddArmorForm(
        data, instance=sheet, prefix="add-armor")
    forms['add_existing_weapon_form'] = AddExistingWeaponForm(
        data, instance=sheet, prefix="add-existing-weapon")
    forms['add_existing_miscellaneous_item_form'] = (
        AddExistingMiscellaneousItemForm(
        data, instance=sheet, prefix="add-existing-weapon"))
    forms['add_weapon_form'] = AddWeaponForm(data, instance=sheet,
                                             prefix="add-weapon")
    forms['new_helm_form'] = HelmForm(data, prefix="new-helm")
    forms['add_ranged_weapon_form'] = AddRangedWeaponForm(
        data, instance=sheet,
        prefix="add-ranged-weapon")
    forms['add_existing_ranged_weapon_form'] = \
        AddExistingRangedWeaponForm(data,
                                    instance=sheet,
                                    prefix="add-existing-ranged-weapon")
    forms['add_firearm_form'] = AddFirearmForm(
        data, instance=sheet,
        prefix="add-firearm")
    forms['add_xp_form'] = \
        AddXPForm(data,
                  request=request,
                  instance=sheet.character,
                  prefix="add-xp")

    if request.method == "POST":
        should_change = False

        for kk, ff in forms.items():
            logger.info("handling %s" % kk)
            if ff.is_valid():
                logger.info("saved %s" % kk)
                oo = ff.save()
                should_change = True
                if kk == 'new_weapon_form':
                    sheet.weapons.add(oo)
                elif kk == 'new_ranged_weapon_form':
                    sheet.ranged_weapons.add(oo)
                elif kk == 'new_armor_form':
                    sheet.armor = oo
                    sheet.save()
                elif kk == 'new_helm_form':
                    sheet.helm = oo
                    sheet.save()

        if not should_change:
            should_change = process_sheet_change_request(request,
                                                         sheet)
        # XXX more complex forms need to be passed back to
        # render_to_response, below.
        if should_change:
            return HttpResponseRedirect(settings.ROOT_URL + 'sheets/%s/' %
                                        sheet.id)

    c = { 'char': SheetView(sheet),
          'notes': notes,
          'sweep_fire_available': any([wpn.has_sweep_fire()
                                       for wpn in sheet.firearms.all()]),
          }
    c.update(forms)
    return render_to_response('sheet/sheet_detail.html',
                              RequestContext(request, c))


class AddWeaponView(CreateView):
    model = Weapon
    template_name = 'sheet/add_weapon.html'
    success_url = reverse_lazy(sheets_index)


class AddWeaponTemplateView(AddWeaponView):
    model = WeaponTemplate


class AddWeaponQualityView(AddWeaponView):
    model = WeaponQuality


class AddWeaponSpecialQualityView(AddWeaponView):
    model = WeaponSpecialQuality


class AddMiscellaneousItemView(AddWeaponView):
    model = MiscellaneousItem
    template_name = 'sheet/add_miscellaneous_item.html'


class EditCharacterView(UpdateView):
    form_class = CharacterForm
    model = Character
    template_name = 'sheet/gen_edit.html'
    success_url = reverse_lazy(characters_index)

    def get_form_kwargs(self):
        dd = super(EditCharacterView, self).get_form_kwargs()
        dd['request'] = self.request
        return dd


class AddCharacterView(CreateView):
    model = Character
    template_name = 'sheet/gen_edit.html'
    success_url = reverse_lazy(characters_index)


class AddSpellEffectView(CreateView):
    model = SpellEffect
    template_name = 'sheet/gen_edit.html'
    success_url = reverse_lazy(sheets_index)


class AddEdgeView(AddSpellEffectView):
    model = Edge


class EditSheetView(UpdateView):
    form_class = EditSheetForm
    model = Sheet
    template_name = 'sheet/gen_edit.html'
    success_url = reverse_lazy(sheets_index)


class AddSheetView(CreateView):
    model = Sheet
    form_class = EditSheetForm
    template_name = 'sheet/gen_edit.html'
    success_url = reverse_lazy(sheets_index)


class AddEdgeLevelView(AddSpellEffectView):
    form_class = EditEdgeLevelForm
    model = EdgeLevel


class AddEdgeSkillBonusView(AddSpellEffectView):
    model = EdgeSkillBonus


class AddRangedWeaponView(AddWeaponView):
    model = RangedWeapon


class AddFirearmView(AddWeaponView):
    model = sheet.models.BaseFirearm
    form_class = sheet.forms.CreateBaseFirearmForm

class AddAmmunitionView(AddWeaponView):
    model = Ammunition


class AddRangedWeaponTemplateView(AddRangedWeaponView):
    model = RangedWeaponTemplate


class AddArmorView(AddSpellEffectView):
    model = Armor
    template_name = 'sheet/add_armor.html'


class AddArmorTemplateView(AddSpellEffectView):
    model = ArmorTemplate


class AddArmorQualityView(AddSpellEffectView):
    model = ArmorQuality


class AddArmorSpecialQualityView(AddSpellEffectView):
    model = ArmorSpecialQuality
    template_name = 'sheet/add_armor_special_quality.html'


def get_data_rows(results, fields):
    """
    Return queryset data columns in order given with the fields
    parameters, one row at a time.
    """
    for obj in results:
        def get_field_value(field):
            try:
                value = getattr(obj, field)
            except AttributeError:
                return ""
            tag = "{model}.{field}".format(model=obj.__class__.__name__,
                                           field=field)
            if tag == "BaseFirearm.ammunition_types":
                return '|'.join([ammo.short_label
                                 for ammo in obj.ammunition_types.all()])
            else:
                def get_descr(mdl):
                    if hasattr(mdl, 'name'):
                        return mdl.name
                    return str(mdl.pk)
                if isinstance(value, django.db.models.Model):
                    value = get_descr(value)
                elif isinstance(value, django.db.models.Manager):
                    value = "|".join([get_descr(val) for val in value.all()])
                return value
        yield [get_field_value(field) for field in fields]


def browse(request, type):
    try:
        cls = getattr(sheet.models, type)
    except AttributeError, e:
        raise Http404, "%s is not a supported type." % type
    results = cls.objects.all()
    fields = cls.get_exported_fields()
    rows = get_data_rows(results, fields)
    fields = [" ".join(ff.split('_')) for ff in fields]
    return render_to_response('sheet/browse.html',
                              RequestContext(request, { 'type' : type,
                                                        'header' : fields,
                                                        'rows' : rows }))


def update_id_sequence(model_class):
    """
    When importing data from a database to another database, if the item ids
    exceed the sequence in postgres, the sequence generator can get
    out-of-sync.  This will lead to duplicate id errors, as the sequence
    will generate key values, which are already present in the table.

    This remedies the situation by assigning the sequence to the start from
    the next value.
    """
    # Only with postgres.
    if (settings.DATABASES['default']['ENGINE'] ==
            "django.db.backends.postgresql_psycopg2"):
        # The operation should only be performed for models with a serial id
        # as the primary key.
        cc = django.db.connection.cursor()
        # String replace ok here, as the table name is not coming from an
        # external source, and generating the query with execute is not
        # trivial with a dynamic table name.
        cc.execute("""
        SELECT pg_catalog.setval(pg_get_serial_sequence('{table}', 'id'),
                                 (SELECT MAX(id) FROM {table}));
                                 """.format(
            table=model_class._meta.db_table))


def sort_by_dependencies(header, rows):
    """
    Sort the list of rows, so that dependencies are satisfied as well as
    possible.
    """
    logger.debug("Sorting skill rows rows by dependencies")
    name_index = header.index("name")
    if name_index < 0:
        raise ValueError, "No name column"
    required_index = header.index("required_skills")
    if required_index < 0:
        raise ValueError, "No required_skills column"

    ordered = []
    unsatisfied = {}
    satisfied = {}

    def all_satisfied(required_skills):
        for ss in required_skills:
            logger.debug("Checking for '{skill}'".format(skill=ss))
            if not satisfied.has_key(ss):
                return False
        logger.debug("all satisfied for {0}".format(required_skills))
        return True

    def get_required(required_skills):
        required_skills = required_skills.strip()
        if required_skills:
            required_skills = [req.strip()
                               for req in required_skills.split('|')]
        else:
            required_skills = []
        return required_skills

    def satisfy(row):
        logger.debug("all satisfied for {0}".format(row))
        ordered.append(row)
        skill_name = row[1][name_index]
        satisfied[skill_name] = True
        for sk in unsatisfied.pop(skill_name, []):
            if all_satisfied(get_required(sk[1][required_index])):
                satisfy(sk)

    for row in rows:
        required_skills = get_required(row[1][required_index])

        if all_satisfied(required_skills):
            satisfy(row)
        else:
            for required in required_skills:
                unsat = unsatisfied.setdefault(
                    required, [])
                unsat.append(row)

    # If still unsatisfied, just append them.
    unsatisfied_values = unsatisfied.values()
    if unsatisfied_values:
        logger.debug("Unsatisfied values left")
        ordered.extend([row for ll in unsatisfied_values for row in ll])

    return ordered


def import_text(data):
    reader = csv.reader(StringIO.StringIO(data))
    data_type = reader.next()
    if not len(data_type) or not data_type[0]:
        raise TypeError, "CSV is in invalid format, first row is the data type"
    data_type = data_type[0]
    try:
        modelcls = getattr(sheet.models, data_type)
    except AttributeError, e:
        raise TypeError, "Invalid data type %s" % data_type

    header = reader.next()

    header = [yy.lower() for yy in ['_'.join(xx.split(' ')) for xx in header]]

    changed_models = set()
    rows = enumerate(reader)
    if modelcls == sheet.models.Skill:
        rows = sort_by_dependencies(header, rows)

    for (line, row) in rows:
        logger.debug('columns: {0}'.format(len(row)))
        if len(row) < len(header):
            logger.info("Ignoring too short row: {0}".format(row))
            continue
        tag = line
        mdl = None
        fields = {}
        for (hh, index) in zip(header, range(len(header))):
            fields[hh] = row[index]
        try:
            if 'id' in fields and fields['id']:
                mdl = modelcls.objects.get(id=fields['id'])
            elif 'name' in fields and fields['name']:
                mdl = modelcls.objects.get(name=fields['name'])
        except modelcls.DoesNotExist:
            pass
        if not mdl:
            mdl = modelcls()
        m2m_values = {}
        ammunition_types = []
        for (field_name, value) in fields.items():
            logger.debug(("importing field %s for %s.") % (field_name,
                                                modelcls._meta.object_name))

            if field_name not in modelcls.get_exported_fields():
                logger.info(("ignoring field %s for %s, not in "
                             "exported fields.") % (field_name,
                                                    modelcls.__class__
                                                    .__name__))
                continue
            try:
                (field, _, direct, m2m) = \
                    modelcls._meta.get_field_by_name(field_name)
            except FieldDoesNotExist, e:
                raise ValueError, str(e)

            if field_name == "tech_level":
                try:
                    value = TechLevel.objects.get(name=value)
                except TechLevel.DoesNotExist:
                    raise ValueError, "No matching TechLevel with name %s." % (
                                                value)
            elif field_name == "ammunition_types":
                if modelcls != sheet.models.BaseFirearm:
                    raise ValueError, "Invalid model for ammunition_types"
                ammunition_types = value.split('|')
                continue
            # If the field is a reference to another object, try to find
            # the matching instance.
            elif isinstance(field, django.db.models.ForeignKey):
                if value:
                    try:
                        value = \
                            field.related.parent_model.objects.get(pk=value)
                    except field.related.parent_model.DoesNotExist:
                        raise ValueError, "No matching %s with name %s." % (
                            field.related.parent_model._meta.object_name, value)
                else:
                    value = None
            else:
                if not value:
                    if field.has_default():
                        value = field.default
                    elif not field.empty_strings_allowed:
                        continue # Try to get away without setting the value.
                if isinstance(field,
                              django.db.models.fields.related.ManyToManyField):
                    # Make sure the field will at least be cleared.
                    m2m_values[field_name] = []
                    if not value:
                        continue
                    ll = []

                    def is_self_loop(cls, field):
                        if cls == field.rel.to and fields['name'] == name:
                            return True
                        else:
                            return False

                    for name in value.split('|'):
                        name = name.strip()
                        # Useless, and broken, to add a requirement to self.
                        if is_self_loop(modelcls, field):
                            continue

                        try:
                            obj = field.rel.to.objects.get(name=name)
                        except field.rel.to.DoesNotExist:
                            raise ValueError, (
                                "Requirement `{req}' for line {line} "
                                "does not exist.".format(req=name, line=tag))
                        ll.append(obj)
                    value = ll
                    m2m_values[field_name] = value
                    # These need to be added only after the object is saved.
                    continue
                else:
                    # XXX Something a little more intelligent would
                    # probably be nice, for other types of data.
                    if value == "FALSE":
                        value = False
                    elif value == "TRUE":
                        value = True
                    try:
                        value = field.to_python(value)
                    except Exception, e:
                        raise type(e), ("Failed to import field \"%s\", "
                                        "value \"%s\" (%s)" % (field_name, value,
                                                               str(e)))
            setattr(mdl, field_name, value)
        try:
            mdl.full_clean()
            mdl.save()
        except Exception, e:
            raise type(e), ("Line %d: Failed to import field \"%s\", "
                            "value \"%s\" (%s)" % (line, field_name, value,
                            str(e)))
        for kk, vv in m2m_values.items():
            logger.info("Setting m2m values for %s(%s) %s to %s" %
                        (mdl, mdl.__class__.__name__, kk, vv))
            rel = getattr(mdl, kk)
            rel.clear()
            rel.add(*vv)

        if ammunition_types:
            # clear old ammunition types out.
            mdl.ammunition_types.all().delete()

            sheet.models.FirearmAmmunitionType.objects.filter()
            for ammo_type in ammunition_types:
                sheet.models.FirearmAmmunitionType.objects\
                    .get_or_create(firearm=mdl,
                                   short_label=ammo_type)

        mdl.full_clean()
        mdl.save()
        changed_models.add(mdl.__class__)

    for mdl in changed_models:
        update_id_sequence(mdl)


def import_data(request, success=False):
    """
    XXX Create tests and refactor.
    """
    if request.method == 'POST':
        form = ImportForm(request.POST, request.FILES)
        if form.is_valid():
            import_data = form.cleaned_data['import_data']
            if 'file' in request.FILES:
                file = request.FILES['file']
                import_data = file.read()
            try:
                import_text(import_data)
                return HttpResponseRedirect(
                    reverse('import-success'))
            except (TypeError, ValueError, ValidationError), e:
                logger.exception("failed.")
                el = form._errors.setdefault('__all__',
                                             django.forms.util.ErrorList())
                el.append(str(e))
            except Exception, e:
                logger.exception("failed.")
                raise
    else:
        form = ImportForm()
    types = []
    for choice in sheet.models.EXPORTABLE_MODELS:
        cls = getattr(sheet.models, choice)
        item = {}
        item['name'] = cls._meta.object_name
        item['doc'] = cls.__doc__
        item['fields'] = cls.get_exported_fields()
        types.append(item)

    message = ""
    if success:
        message = "Import successful."
    return render_to_response('sheet/import_data.html',
                              RequestContext(request,
                                             { 'message' : message,
                                               'types' : types,
                                               'import_form' : form }))


def csv_export(exported_type):
    results = exported_type.objects.all()
    f = StringIO.StringIO()
    w = csv.writer(f)
    w.writerow([exported_type.__name__])
    fields = exported_type.get_exported_fields()
    w.writerow(fields)

    def to_utf8(data):
        if isinstance(data, basestring):
            return data.encode('utf-8')
        else:
            return data

    for row in get_data_rows(results, fields):
        w.writerow([to_utf8(col) for col in row])
    return f.getvalue()


def export_data(request, type):
    try:
        cls = getattr(sheet.models, type)
    except AttributeError, e:
        raise Http404, "%s is not a supported type." % type
    csv_data = csv_export(cls)

    response = HttpResponse(csv_data, mimetype="text/csv")
    response['Content-Disposition'] = 'attachment; filename=%s.csv' % type
    return response


def version_history(request):
    def logiter(output):
        acc = ""
        for ll in output:
            if ll.startswith("commit ") and acc:
                yield acc
                acc = ""
            acc += ll
        yield acc
    proc = subprocess.Popen(['git', 'log'], stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT,
                            cwd=os.path.dirname(__file__))
    return render_to_response('sheet/changelog.html',
                              RequestContext(request,
                                             { 'log' : logiter(proc.stdout) }))


class TODOView(TemplateView):
    template_name = 'sheet/todo.html'

    def get_context_data(self, **kwargs):
        context = dict(**kwargs)
        context['TODO'] = TODO
        context['BUGS'] = BUGS
        return context
