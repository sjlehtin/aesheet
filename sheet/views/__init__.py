from __future__ import division

TODO = """
+ = done
- = not done

Priority list by JW:

+ 0) restrict ammo by chosen weapon dynamically with JS
+ 1) basic skill checks
+ 2) movement rates
- 3) berettas akimbo
+ 4) overland
- 5) spell skill cheks

- inventory
- damage taken
-- stamina
-- lethal
-- incurred to character, with approriate wounds
-- healing damage
-- bleeding damage, retain original wound, but incurs AA etc penalties
   as per bleeding.

- notes changes should not be logged.

- suspended weight
- marking weapons as having no weight; useful for alternate weapons, or
  weapons with larger sizes (Martel enlarged).

- finalize initial robot tests.

- armor modifiers to skill checks.  These should work for the physical skills
  where the check is shown even without the character having the skill.

- show character height, weight in sheet.
- "add xp used ingame" with a possibility to enter description (to log)
-- if a log entry is added, entry should not be coalesced.
- "add xp" with an optional log entry, allowing for in-game notes.
- shield damages
- tiring
- bootstrap data pop-up links for armor, effects in edit area
-- show basic info.
- reordering weapons.  possible to do with ajax, so it would be faster.
-- removing weapons etc to use REST API.  If removed item has repercussions on
   character stats, the character sheet should be refreshed (maybe add a
   notification on top of the page to notify user of this?)

+ possibility to copy characters and sheets (mainly sheets), which will copy
  also the underlying character.
- character addition form layout for easier "intake"
  + group cur, starting stats
  - show raises
+/- adding weapon inplace ("add row" functionality), instead of the large set of
    controls.  Might already be sufficient with the condensed layout, verify with
    JW.
+ access controls
++ marking sheet as only visible to self (SM)
++ marking characters as only visible to self (SM)
+++ these should not show in the lists.


+ character mugshot upload (SM)
- senses (SM)
- movement chart (SM)
- spell skill checks (SM)

+ weapon maximum damage based on durability.
- edge levels from items (toughness, darkvision, etc)
- automatic used edge point calculation

+ Creating a new character should automatically create a sheet for that
  character and redirect to edit the new character.

+ form errors should be highlighted, and if the form element is hidden, it
  should be shown by default (errors in add forms can get hidden)
++ form errorlist class should be highlighted.

- you should be able to leave current stats empty on character creation,
  in which case the stats would be filled in from the initial stats.

-- xl and e range dependent on user FIT (SM)
-- password change (SM)
+ wondrous items
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

- code simplification; sheet detail form handling mainly.

- save bonuses (M)
- encumbrance breakdown (M)
- sheet styling

- short description of spell effect (+50 FIT etc)
- stats, armors etc if the character is larger sized.

+ Basic skill checks:  Adding skills without any points (or reduced amount of
  points) allocated.  For example, Climbing B -> show skill check at half
  ability.  Currently supported are the basic physical skills.

- Partial skills.  This is a larger item than it sounds, as the current design
  assumes whole skill levels.  Investigate if could be done as a skill level
  model field.

- Inserting None as skill cost to the sheet should work to allow resetting
  skill costs from CSV import.

- creating new objects should be ajaxiced and redirects should occur in a
  sensible manner.

- hardened skin + toughness -> natural weapons durability.
-- NaturalWeaponDura=Aleth+HdSkin+ROUNDDOWN(Toughness/2)+SizeModifier
+ size field for weapons (huge cretin with Large bite)

- free edges based on campaign (probably should think about race
  in this context, for FRP at least)

- it should be really easy to bootstrap the sheet system.  There should be
  some initial data, like tech-levels and campaigns.

Minor:

- adding missing skills (helps in just allowing inserting primary skills
  and autofilling rest)

Firearms:

- using two Berettas akimbo.  Check rule situation regarding instinctive fire.
-- fireams are assigned to hands (right, left, both).  Penalties/bonuses should
   be applied based on weapon type.  If both hands are occupied, apply penalty
   for two guns.
- firearms in CC.
+ some weapons with autofire do not have sweep fire enabled.
+ some weapons have restricted burst (restricted to 2 or 3 shots).
+ weapon class modifiers for ROF calculations
+ adding weapon with inline form does not allow setting ammo types.

Edges:

+ run speed multiplier
+ climb speed multiplier
- jump distance multiplier
+ swim speed multiplier
+ overland speed multiplier
- superior balance effect on ref/mov balance checks

Skills:

- jumping/tumbling synergy, see AEN skills and edges.

Spells:
+ fly speed multiplier


"""

BUGS = """
- Adding skills with multiple prereqs doesn't work.
- Better error messages on importing completely invalid CSV (heading line or
  data type broken)
+ crossbows should not have FIT modifiers for damage
- draw I missing
+ Rapid archery affects thrown weapons, crossbows and firearms.
"""

from django.shortcuts import render, get_object_or_404
from django.http import HttpResponseRedirect
from sheet.models import *
from sheet.forms import *
from django.core.exceptions import ValidationError, PermissionDenied
from django.conf import settings
from django.core.urlresolvers import reverse, reverse_lazy
from django.views.generic import UpdateView, CreateView, FormView
import sheet.models
import sheet.forms
import os.path
import subprocess
from django.views.generic import TemplateView
from django.forms.models import modelform_factory
import logging
from collections import namedtuple
from django.contrib import messages

logger = logging.getLogger(__name__)


def characters_index(request):
    return render(request, 'sheet/characters_index.html',
                  {'campaigns': Character.get_by_campaign(request.user)})


def sheets_index(request):
    return render(request, 'sheet/sheets_index.html',
                  {'campaigns': Sheet.get_by_campaign(request.user)})


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
                                             initial={'function': 'add'},
                                             prefix="skill-level-modify")

    def dec_level_form(self):
        return CharacterSkillLevelModifyForm(instance=self.item,
                                             initial={'function': 'dec'},
                                             prefix="skill-level-modify")

    def skill_check(self):
        return self.item.skill_check(self.sheet)

    def __unicode__(self):
        return unicode(self.item.skill)


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
            # The armor values calculation should probably be in the SheetView,
            # which would collate values from Armor, Helm and other sources.
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
            logger.debug(
                "Value for {value}: {current}, Orig: {original}".format(
                    value=v, current=value, original=original_value))
            return value
        else:
            return getattr(self.item, v)


class PhysicalSkill(SkillWrap):
    """
    If character has the skill, use the check directly.

    If character does not have the skill, but the skill level 0
    has cost of 0, use level 0 check.  This should use the normal
    skill check calculation, as the character may have armor
    or edges which modify the skill check.

    If character doesn't have the skill, and the skill level 0 has
    a non-zero cost, calculate check defaulted to half-ability
    (maybe check default-attribute).
    """

    sm = sheet.models
    def __init__(self, skill_name, sheet, stats=None):
        self.skill_name = skill_name
        self.sheet = sheet
        self.char_skill = sheet.character.get_skill(skill_name)
        # for SkillWrap functions.
        self.item = self.char_skill
        self.stats = stats
        try:
            self.base_skill = self.sm.Skill.objects.get(name=skill_name)
        except self.sm.Skill.DoesNotExist:
            self.base_skill = None

        if self.char_skill:
            skill = self.char_skill
        else:
            if self.base_skill is not None and \
                            self.base_skill.skill_cost_0 == 0:
                skill = self.sm.CharacterSkill(
                    character=self.sheet.character,
                    skill=self.base_skill)
            else:
                class BaseCheck(object):
                    def __init__(self, sheet, base_skill):
                        self.sheet = sheet
                        self.base_skill = base_skill

                    def skill_check(self, sheet, stat=None):
                        if not stat:
                            if self.base_skill:
                                stat = self.base_skill.stat.lower()
                            else:
                                stat = "mov"
                        return int(round(getattr(sheet,
                                                 "eff_" + stat)/2))

                    @property
                    def level(self):
                        return None

                skill = BaseCheck(self.sheet, self.base_skill)
        self.skill = skill
        super(PhysicalSkill, self).__init__(self.item, sheet=self.sheet)

    def level(self):
        return self.skill.level

    def skill_check(self):
        if self.stats:
            checks = {}
            for st in self.stats:
                checks[st] = self.skill.skill_check(self.sheet, stat=st)
        else:
            checks = self.skill.skill_check(self.sheet)
        return checks

    def formatted_checks(self):
        check = self.skill_check()
        if isinstance(check, dict):
            return ["{key}: {value}".format(key=key.upper(), value=value)
                    for (key, value) in check.items()]

    def cost(self):
        return self.char_skill.cost() if self.char_skill else 0

    def __unicode__(self):
        return unicode(self.skill_name)


class SheetView(object):
    _base_physical = ["Stealth",
                      "Concealment",
                      "Search",
                      "Climbing",
                      "Swimming",
                      "Jump",
                      "Sleight of hand"]
    _all_physical = ["Endurance / run",
                      "Balance"] + _base_physical

    def __init__(self, char_sheet):
        self.sheet = char_sheet
        self._skills = self.sheet.skills.all()
        self.all_physical_skills = sheet.models.Skill.objects.filter(
            name__in=self._all_physical)

        self._wrapped_physical = dict([(sk,
                                        PhysicalSkill(sk, sheet=self.sheet)) for sk in
                                        self._all_physical])

    def used_sp(self):
        try:
            return sum([cs.cost() for cs in self._skills])
        # Invalid skill level.
        except TypeError:
            return 0

    # TODO: Remove.
    def base_stats(self):
        ll = []
        for st in ["fit", "ref", "lrn", "int", "psy", "wil", "cha", "pos"]:
            stat = {'name': st,
                    'base': getattr(self.sheet, st),
                    'eff': getattr(self.sheet, "eff_" + st),
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

    # TODO: Remove.
    def derived_stats(self):
        ll = []
        for st in ["mov", "dex", "imm"]:
            stat = {'name': st,
                    'base': getattr(self.sheet, st),
                    'eff': getattr(self.sheet, "eff_" + st),
            }
            ll.append(stat)
        return ll

    def weapons(self):
        return [WeaponWrap(xx, self.sheet)
                for xx in self.sheet.weapons.all()]

    def ranged_weapons(self):
        return [RangedWeaponWrap(xx, self.sheet)
                for xx in self.sheet.ranged_weapons.all()]

    def firearms(self):
        return [FirearmWrap(xx, self.sheet)
                for xx in self.sheet.firearms.all()]

    def spell_effects(self):
        return [RemoveWrap(xx) for xx in self.sheet.spell_effects.all()]

    def endurance(self):
        return PhysicalSkill("Endurance / run", stats=["fit", "wil"],
                             sheet=self.sheet)

    def balance(self):
        return PhysicalSkill("Balance", stats=["ref", "mov"],
                             sheet=self.sheet)

    def physical_skills(self):
        return [self._wrapped_physical[sk]
                for sk in self._base_physical]

    def skills(self):
        char_skills = filter(
            lambda cs: cs.skill not in self.all_physical_skills,
            self._skills)

        char_skills = [SkillWrap(xx, self.sheet) for xx in char_skills]
        
        skills = dict()
        skills.update([(sk.skill.name, sk) for sk in char_skills])

        class Node(object):
            def __init__(self):
                self.children = []

        root = Node()

        for sk in char_skills:
            # Assign as child of first required skill.
            reqd = sk.skill.required_skills.all()
            if len(reqd) and reqd[0].name in skills:
                skills[reqd[0].name].children.append(sk)
            else:
                root.children.append(sk)
        logger.debug("Original skill list length: %d", len(char_skills))

        def depthfirst(node, indent):
            yield node, indent
            for cc in node.children:
                for nn in depthfirst(cc, indent + 1):
                    yield nn

        skill_list = []
        for nn, indent in depthfirst(root, 0):
            nn.indent = indent
            skill_list.append(nn)
        logger.debug("New skill list length: %d", len(skill_list))
        return skill_list[1:] # Skip root node.

    def edges(self):
        return [RemoveWrap(xx) for xx in self.sheet.edges.all()]

    def armor(self):
        return ArmorWrap(self.sheet.armor, sheet=self.sheet, type="Armor")

    def helm(self):
        return ArmorWrap(self.sheet.helm, sheet=self.sheet, type="Helm")

    def miscellaneous_items(self):
        return [RemoveWrap(xx) for xx in self.sheet.miscellaneous_items.all()]

    def advancing_initiative_penalties(self):
        distances = [30, 20, 10, 5, 2]
        def initiatives(multiplier):
            return [-roundup((dist*multiplier)/
                             (self.sheet.eff_mov *
                              self.sheet.run_multiplier()))
                    for dist in distances]
        charging = initiatives(20)
        melee = initiatives(30)
        ranged = initiatives(60)
        return dict(distances=distances,
                    charge_initiatives=charging,
                    melee_initiatives=melee,
                    ranged_initiatives=ranged)

    def overland_movement(self):
        overland_mov = self.sheet.eff_mov * self.sheet.run_multiplier()
        fly_mov = self.sheet.eff_mov * self.sheet.enhancement_fly_multiplier()

        terrains = [1, 2, 3, 4, 5, 6, 10, 15]
        miles_per_day = [(overland_mov / (2 * mult)) for mult in terrains]
        miles_per_day.append(fly_mov/2)
        return dict(terrains=["Road", "Clear", "Scrub", "Woods", "Sand",
                              "Forest", "Mtn", "Swamp", "Fly"],
                    miles_per_day=miles_per_day,
                    miles_per_hour=[rate/7.5 for rate in miles_per_day])

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        try:
            return getattr(self.sheet, v)
        except AttributeError:
            raise AttributeError, \
                "'SheetView' object has no attribute '{attr}'".format(attr=v)


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
            sheet.character.add_skill_log_entry(item.skill,
                                                item.level,
                                                request=request,
                                                removed=True)
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
    args = {'character': character}
    args.update(filter_kwargs)
    notes = CharacterEdge.objects.filter(**args).exclude(
        edge__notes=u'').values_list('edge__edge__name',
                                     'edge__notes')
    return notes


def sheet_detail(request, sheet_id=None):
    sheet = get_object_or_404(Sheet.objects.select_related()
                              .select_related('armor__base',
                                              'armor__quality',
                                              'helm', )
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
        'character__edges'),
                              pk=sheet_id)
    if not sheet.character.access_allowed(request.user):
        raise PermissionDenied

    forms = {}

    positive = get_notes(sheet.character, {'edge__cost__gt': 0})
    negative = get_notes(sheet.character, {'edge__cost__lte': 0})
    notes = Notes(positive=positive, negative=negative)

    if request.method == "POST":
        data = request.POST
    else:
        data = None

    def add_form(form_class, prefix, **kwargs):
        key = prefix.replace('-', '_') + "_form"
        if data is not None:
            has_prefix = any([var.startswith(prefix) for var in data.keys()])
            form_data = data if has_prefix else None
        else:
            form_data = None
        forms[key] = form_class(form_data,
                                request=request,
                                prefix=prefix, **kwargs)

    # TODO: Remove.
    add_form(StatModifyForm, "stat-modify", instance=sheet.character)
    add_form(CharacterSkillLevelModifyForm, "skill-level-modify")
    add_form(AddSkillForm, "add-skill", instance=sheet.character)
    add_form(AddLanguageForm, "add-lang", instance=sheet.character)
    add_form(AddEdgeForm, "add-edge", instance=sheet.character)
    add_form(AddSpellEffectForm, "add-spell-effect", instance=sheet)
    add_form(AddExistingHelmForm, "add-existing-helm", instance=sheet)
    add_form(AddHelmForm, "add-helm", instance=sheet)
    add_form(AddExistingArmorForm, "add-existing-armor", instance=sheet)
    add_form(AddArmorForm, "add-armor", instance=sheet)
    add_form(AddExistingWeaponForm, "add-existing-weapon", instance=sheet)
    add_form(AddWeaponForm, "add-weapon", instance=sheet)
    add_form(AddRangedWeaponForm, "add-ranged-weapon", instance=sheet)
    add_form(AddExistingRangedWeaponForm, "add-existing-ranged-weapon",
             instance=sheet)
    add_form(AddExistingMiscellaneousItemForm,
             "add-existing-miscellaneous-item", instance=sheet)
    add_form(HelmForm, "new-helm")

    add_form(AddFirearmForm, "add-firearm", instance=sheet)
    add_form(AddXPForm, "add-xp", instance=sheet.character)

    if request.method == "POST":
        should_change = False

        for kk, ff in forms.items():
            logger.info("handling %s" % kk)
            if ff.is_bound:
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
                else:
                    messages.error(request, 'Errors in processing request '
                                            '({form_slug}).'.format(
                        form_slug=ff.prefix.replace('-', ' ')))
        if not should_change:
            should_change = process_sheet_change_request(request,
                                                         sheet)
        # More complex forms need to be passed back to
        # render(), below.
        if should_change:
            return HttpResponseRedirect(settings.ROOT_URL + 'sheets/%s/' %
                                        sheet.id)

    c = {'sheet': SheetView(sheet),
         'notes': notes,
         'sweep_fire_available': any([wpn.has_sweep_fire()
                                      for wpn in sheet.firearms.all()]),
         }
    c.update(forms)
    return render(request, 'sheet/sheet_detail.html', c)


class FormSaveMixin(object):
    success_message = "Object saved successfully."

    def form_valid(self, form):
        response = super(FormSaveMixin, self).form_valid(form)
        messages.success(self.request, self.success_message.format(
            object=self.object))
        return response

    def form_invalid(self, form):
        messages.error(self.request,
                       "Error trying to modify object: field{plural} {error_fields} "
                       "{poss} errors.".format(
                           plural="s" if len(form.errors.keys()) != 1 else "",
                           poss="have"
                           if len(form.errors.keys()) != 1 else "has",
                           error_fields=', '.join(form.errors.keys())))
        return super(FormSaveMixin, self).form_invalid(form)


class RequestMixin(object):
    def get_form_kwargs(self, **kwargs):
        new_kwargs = dict(request=self.request)
        new_kwargs.update(super(RequestMixin, self).get_form_kwargs(**kwargs))
        return new_kwargs


class BaseCreateView(FormSaveMixin, RequestMixin, CreateView):
    def get_form_class(self):
        if self.form_class:
            return self.form_class
        return modelform_factory(self.model, form=sheet.forms.RequestForm,
                                 fields="__all__")


class BaseUpdateView(FormSaveMixin, RequestMixin, UpdateView):
    def get_form_class(self):
        if self.form_class:
            return self.form_class
        return modelform_factory(self.model, form=sheet.forms.RequestForm,
                                 fields="__all__")


class AddWeaponView(BaseCreateView):
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


class EditCharacterView(BaseUpdateView):
    form_class = EditCharacterForm
    model = Character
    template_name = 'sheet/create_character.html'
    success_url = reverse_lazy(characters_index)
    success_message = "Character edit successful."

    def get_object(self, queryset=None):
        object = super(EditCharacterView, self).get_object(queryset)
        if not object.access_allowed(self.request.user):
            raise PermissionDenied
        return object

    def get_form_kwargs(self):
        dd = super(EditCharacterView, self).get_form_kwargs()
        dd['request'] = self.request
        return dd

    def get_success_url(self):
        return reverse('edit_character', args=(self.object.pk, ))


class AddCharacterView(BaseCreateView):
    model = sheet.models.Character
    form_class = sheet.forms.AddCharacterForm
    template_name = 'sheet/create_character.html'

    def form_valid(self, form):
        self.object = form.save()
        self.sheet = sheet.models.Sheet.objects.create(
            character=self.object,
            owner=self.object.owner)
        messages.success(self.request, "Character added successfully.  "
                                       "Sheet has been created automatically.")
        return HttpResponseRedirect(self.get_success_url())

    def get_success_url(self):
        return reverse('sheet_detail', args=(self.sheet.pk, ))


class AddSpellEffectView(BaseCreateView):
    model = SpellEffect
    template_name = 'sheet/gen_edit.html'
    success_url = reverse_lazy(sheets_index)


class AddEdgeView(AddSpellEffectView):
    model = Edge


class EditSheetView(BaseUpdateView):
    form_class = EditSheetForm
    model = Sheet
    template_name = 'sheet/gen_edit.html'

    def get_object(self, queryset=None):
        object = super(EditSheetView, self).get_object(queryset)
        if not object.character.access_allowed(self.request.user):
            raise PermissionDenied
        return object

    def get_success_url(self):
        return reverse('sheet_detail', args=(self.object.pk, ))


class AddSheetView(BaseCreateView):
    model = Sheet
    form_class = AddSheetForm
    template_name = 'sheet/gen_edit.html'
    success_message = "Sheet added successfully."

    def get_success_url(self):
        return reverse('sheet_detail', args=(self.object.pk, ))


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


class CopySheetView(RequestMixin, FormView):
    form_class = sheet.forms.CopySheetForm
    template_name = "sheet/gen_edit.html"

    def __init__(self, **kwargs):
        super(CopySheetView, self).__init__(**kwargs)
        self.sheet_id = None

    def get_form_kwargs(self, **kwargs):
        form_kwargs = super(CopySheetView, self).get_form_kwargs()
        if self.sheet_id:
            initial = form_kwargs.setdefault('initial', dict())
            initial['sheet'] = self.sheet_id
        return form_kwargs

    def get(self, request, *args, **kwargs):
        self.sheet_id = kwargs.pop('sheet_id', None)
        return super(CopySheetView, self).get(request, *args, **kwargs)

    def form_valid(self, form):
        new_sheet = form.save()
        self.success_url = reverse('edit_sheet', args=(new_sheet.id, ))
        messages.success(self.request, "Successfully copied sheet to "
                                       "{new_char}.".format(
            new_char=new_sheet.character.name
        ))
        return super(CopySheetView, self).form_valid(form)


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
    return render(request, 'sheet/changelog.html',
                  {'log': logiter(proc.stdout)})


class TODOView(TemplateView):
    template_name = 'sheet/todo.html'

    def get_context_data(self, **kwargs):
        context = dict(**kwargs)
        context['TODO'] = TODO
        context['BUGS'] = BUGS
        return context
