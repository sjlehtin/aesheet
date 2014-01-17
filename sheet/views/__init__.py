TODO = """
+ = done
- = not done

Priority list by JW:

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

- weapon maximum damage based on durability.

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

- code simplification; sheet detail form handling mainly.

- save bonuses (M)
- encumbrance breakdown (M)
- sheet styling

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
+ adding weapon with inline form does not allow setting ammo types.

"""

BUGS = """
- Adding skills with multiple prereqs doesn't work.
- Better error messages on importing completely invalid CSV (heading line or
  data type broken)
- crossbows should not have FIT modifiers for damage
- draw I missing
"""

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponseRedirect
import django.http
from django.template import RequestContext
from sheet.models import *
from sheet.forms import *
from django.core.exceptions import ValidationError
from django.conf import settings
from django.core.urlresolvers import reverse, reverse_lazy
from django.views.generic import UpdateView, CreateView, FormView
import sheet.models
import sheet.forms
import os.path
import subprocess
from django.views.generic import TemplateView
import logging
from collections import namedtuple
from django.contrib import messages

logger = logging.getLogger(__name__)


def characters_index(request):
    return render_to_response('sheet/characters_index.html',
                              {'campaigns':
                                   Character.get_by_campaign(request.user)},
                              context_instance=RequestContext(request))


def sheets_index(request):
    return render_to_response('sheet/sheets_index.html',
                              {'campaigns':
                                   Sheet.get_by_campaign(request.user)},
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
                                             initial={'function': 'add'},
                                             prefix="skill-level-modify")

    def dec_level_form(self):
        return CharacterSkillLevelModifyForm(instance=self.item,
                                             initial={'function': 'dec'},
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
            logger.debug(
                "Value for {value}: {current}, Orig: {original}".format(
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

    @property
    def derived_stats(self):
        ll = []
        for st in ["mov", "dex", "imm"]:
            stat = {'name': st,
                    'base': getattr(self.sheet, st),
                    'eff': getattr(self.sheet, "eff_" + st),
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
    args = {'character': character}
    args.update(filter_kwargs)
    positive = CharacterEdge.objects.filter(**args).exclude(
        edge__notes=u'').values_list('edge__edge__name',
                                     'edge__notes')
    return positive


def sheet_detail(request, sheet_id=None):
    sheet = get_object_or_404(Sheet.objects.select_related()
                              .select_related('sheet__armor__base',
                                              'sheet__armor__quality'
                                              'sheet__helm', )
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
    if not sheet.character.access_allowed(request.user):
        raise django.core.exceptions.PermissionDenied

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
        # XXX more complex forms need to be passed back to
        # render_to_response, below.
        if should_change:
            return HttpResponseRedirect(settings.ROOT_URL + 'sheets/%s/' %
                                        sheet.id)

    c = {'char': SheetView(sheet),
         'notes': notes,
         'sweep_fire_available': any([wpn.has_sweep_fire()
                                      for wpn in sheet.firearms.all()]),
    }
    c.update(forms)
    return render_to_response('sheet/sheet_detail.html',
                              RequestContext(request, c))


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
        return modelform_factory(self.model, form=sheet.forms.RequestForm)


class BaseUpdateView(FormSaveMixin, RequestMixin, UpdateView):
    def get_form_class(self):
        if self.form_class:
            return self.form_class
        return modelform_factory(self.model, form=sheet.forms.RequestForm)


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
            raise django.core.exceptions.PermissionDenied
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
            raise django.core.exceptions.PermissionDenied
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
    return render_to_response('sheet/changelog.html',
                              RequestContext(request,
                                             {'log': logiter(proc.stdout)}))


class TODOView(TemplateView):
    template_name = 'sheet/todo.html'

    def get_context_data(self, **kwargs):
        context = dict(**kwargs)
        context['TODO'] = TODO
        context['BUGS'] = BUGS
        return context
