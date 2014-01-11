from collections import namedtuple
from django import forms
from django.forms import widgets
import sheet.models
import datetime
import re
from django.forms.models import modelform_factory
import logging

logger = logging.getLogger(__name__)

class ImportForm(forms.Form):
    import_data = forms.CharField(widget=forms.Textarea, required=False)
    file = forms.FileField(required=False)
    def clean(self):
        cd = self.cleaned_data
        if not cd['file'] and not cd['import_data']:
            raise forms.ValidationError("Specify the data or the file to "
                                        "be uploaded")
        if cd['file'] and cd['import_data']:
            raise forms.ValidationError("Specify either the data or the "
                                        "file to be uploaded, not both")
        return cd


EditSheetForm =  modelform_factory(sheet.models.Sheet, exclude=(
    'weapons', 'ranged_weapons', 'armor', 'helm', 'spell_effects',
    'miscellaneous_items', 'firearms'))


def pretty_name(name):
    return ' '.join(filter(None, re.split('([A-Z][a-z]*[^A-Z])',
                                          name))).lower().capitalize()


class RequestFormMixin(object):
    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super(RequestFormMixin, self).__init__(*args, **kwargs)


class RequestForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super(RequestForm, self).__init__(*args, **kwargs)


class AddWeaponForm(RequestForm):
    item_class = sheet.models.Weapon
    item_queryset = sheet.models.Weapon.objects.all()
    template_queryset = sheet.models.WeaponTemplate.objects.all()
    quality_queryset = sheet.models.WeaponQuality.objects.all()
    quality_field_name = 'quality'

    def add_item(self, item):
        self.instance.weapons.add(item)

    item_template = forms.ModelChoiceField(
                              queryset=template_queryset.all())
    item_quality = forms.ModelChoiceField(
        queryset=quality_queryset.all())

    def get_default_quality(self):
        quality = self.quality_queryset.filter(name="normal")
        if quality.exists():
            return quality[0]

    def __init__(self, *args, **kwargs):
        initial = kwargs.setdefault('initial', {})
        template_queryset = self.template_queryset
        quality_queryset = self.quality_queryset
        if 'item_quality' not in initial:
            initial['item_quality'] = self.get_default_quality
        super(AddWeaponForm, self).__init__(*args, **kwargs)
        if self.instance.character.campaign:
            template_queryset = template_queryset.filter(
                      tech_level__in=self.instance.campaign.tech_levels.all())
            quality_queryset = quality_queryset.filter(
                tech_level__in=self.instance.campaign.tech_levels.all())
        item_name = pretty_name(self.item_class.__name__)
        self.fields['item_template'] = forms.ModelChoiceField(
                                    queryset=template_queryset,
                                    label=item_name + " template")
        self.fields['item_quality'] = forms.ModelChoiceField(
                                    queryset=quality_queryset,
                                    label=item_name + " quality")

    class Meta:
        model = sheet.models.Sheet
        fields = ()

    def clean(self):
        base = self.cleaned_data.get('item_template')
        quality = self.cleaned_data.get('item_quality')
        if not base or not quality:
            raise forms.ValidationError("Both template and quality "
                                        "are required.")
        filter_kwargs = {'base': base}
        filter_kwargs[self.quality_field_name] = quality
        item = self.item_queryset.filter(**filter_kwargs)
        if item:
            item = item[0]
        else:
            item = self.item_class(**filter_kwargs)
            if hasattr(item, 'name'):
                if quality.name == "normal":
                    item.name = base.name
                else:
                    item.name = "%s %s" % (base.name, quality.name)
        self.cleaned_data['item'] = item
        return self.cleaned_data


    def save(self):
        item = self.cleaned_data['item']
        if not item.pk:
            item.save()
        self.add_item(item)
        return self.instance


class AddRangedWeaponForm(AddWeaponForm):
    item_class = sheet.models.RangedWeapon
    item_queryset = sheet.models.RangedWeapon.objects.all()
    template_queryset = sheet.models.RangedWeaponTemplate.objects.all()
    quality_queryset = sheet.models.WeaponQuality.objects.all()

    def add_item(self, item):
        self.instance.ranged_weapons.add(item)


class AddArmorForm(AddWeaponForm):
    item_class = sheet.models.Armor
    item_queryset = sheet.models.Armor.objects.filter(base__is_helm=False)
    template_queryset = sheet.models.ArmorTemplate.objects.filter(is_helm=False)
    quality_queryset = sheet.models.ArmorQuality.objects.all()

    def add_item(self, item):
        self.instance.armor = item
        self.instance.save()


class AddHelmForm(AddArmorForm):
    item_queryset = sheet.models.Armor.objects.filter(base__is_helm=True)
    template_queryset = sheet.models.ArmorTemplate.objects.filter(is_helm=True)

    def add_item(self, item):
        self.instance.helm = item
        self.instance.save()


class AddFirearmForm(AddWeaponForm):
    item_class = sheet.models.Firearm
    item_queryset = sheet.models.Firearm.objects.all()
    template_queryset = sheet.models.BaseFirearm.objects.all()
    quality_queryset = sheet.models.Ammunition.objects.all()
    quality_field_name = "ammo"

    def get_default_quality(self):
        pass

    def add_item(self, item):
        self.instance.firearms.add(item)

    def clean(self):
        cleaned_data = super(AddFirearmForm, self).clean()
        item = cleaned_data.get('item', None)
        if item:
            types = item.base.get_ammunition_types()
            ammunition = item.ammo.label
            if ammunition not in types:
                raise forms.ValidationError('Invalid ammo type')
        return cleaned_data


class AddExistingWeaponForm(RequestForm):
    item_queryset = sheet.models.Weapon.objects.all()

    def _filter_tech_level(self, qs):
        return qs.filter(
             base__tech_level__in=self.instance.campaign.tech_levels.all()
             ).filter(
             quality__tech_level__in=self.instance.campaign.tech_levels.all())

    def __init__(self, *args, **kwargs):
        super(AddExistingWeaponForm, self).__init__(*args, **kwargs)
        item_queryset = self.item_queryset
        if self.instance.character.campaign:
            item_queryset = self._filter_tech_level(item_queryset)

        self.fields['item'] = forms.ModelChoiceField(
            queryset=item_queryset,
            label=pretty_name(item_queryset.model.__name__))

    class Meta:
        model = sheet.models.Sheet
        fields = ()

    def add_item(self, item):
        self.instance.weapons.add(item)

    def save(self):
        item = self.cleaned_data['item']
        if not item.pk:
            item.save()
        self.add_item(item)
        return self.instance


class AddExistingRangedWeaponForm(AddExistingWeaponForm):
    item_queryset = sheet.models.RangedWeapon.objects.all()

    def add_item(self, item):
        self.instance.ranged_weapons.add(item)


class AddExistingArmorForm(AddExistingWeaponForm):
    item_queryset = sheet.models.Armor.objects.filter(base__is_helm=False)

    def add_item(self, item):
        self.instance.armor = item
        self.instance.save()


class AddExistingHelmForm(AddExistingWeaponForm):
    item_queryset = sheet.models.Armor.objects.filter(base__is_helm=True)

    def add_item(self, item):
        self.instance.helm = item
        self.instance.save()


class AddExistingMiscellaneousItemForm(AddExistingWeaponForm):
    item_queryset = sheet.models.MiscellaneousItem.objects.all()

    def _filter_tech_level(self, qs):
        return qs.filter(
             tech_level__in=self.instance.campaign.tech_levels.all())

    def add_item(self, item):
        self.instance.miscellaneous_items.add(item)


class AddSpellEffectForm(RequestForm):
    effect = forms.ModelChoiceField(
        queryset=sheet.models.SpellEffect.objects.all())

    class Meta:
        model = sheet.models.Sheet
        fields = ()

    def save(self):
        self.instance.spell_effects.add(self.cleaned_data['effect'])
        self.instance.full_clean()
        self.instance.save()
        return self.instance


class AddSkillForm(RequestForm):
    item_queryset = sheet.models.Skill.objects.exclude(type="Language")
    # XXX Change this to use CharacterSkill as the model.
    def __init__(self, *args, **kwargs):
        super(AddSkillForm, self).__init__(*args, **kwargs)
        queryset = self.item_queryset
        if self.instance.campaign:
            queryset = queryset.filter(
               tech_level__in=self.instance.campaign.tech_levels.all())
        self.fields['skill'] = forms.ModelChoiceField(queryset=queryset)
        self.fields.keyOrder = ['skill', 'level']

    choices = range(0,8)
    choices = zip(choices, choices)
    level = forms.ChoiceField(choices=choices)

    def clean_level(self):
        level = self.cleaned_data.get('level')
        if level is not None:
            return int(level)

    def clean(self):
        skill = self.cleaned_data.get('skill')
        level = self.cleaned_data.get('level')
        if not skill:
            raise forms.ValidationError, "Skill is required"
        if skill.is_specialization:
            if level == 0:
                if not skill.skill_cost_0:
                    level = 1
            if level == 1:
                if not skill.skill_cost_1:
                    level = 2
            if level == 2:
                if not skill.skill_cost_2:
                    level = 3
            if level == 3:
                assert(skill.skill_cost_3)
        self.cleaned_data['level'] = level

        try:
            cost = skill.cost(level)
        except ValueError as e:
            raise forms.ValidationError("Invalid level for skill %s: %s (%s)" %
                                        (self.skill, self.level, e))

        # verify skill and level go together.
        cs = sheet.models.CharacterSkill()
        cs.character = self.instance
        cs.skill = skill
        cs.level = level
        cs.full_clean()

        return self.cleaned_data

    class Meta:
        model = sheet.models.Character
        fields = ()

    def save(self, commit=True):
        cs = sheet.models.CharacterSkill()
        cs.character = self.instance
        cs.skill = self.cleaned_data.get('skill')
        cs.level = self.cleaned_data.get('level')
        cs.save()
        return self.instance


class AddLanguageForm(AddSkillForm):
    item_queryset = sheet.models.Skill.objects.filter(type="Language")


class AddEdgeForm(RequestForm):
    edge = forms.ModelChoiceField(
        queryset=sheet.models.EdgeLevel.objects.all())
    choices = range(0,8)
    choices = zip(choices, choices)

    class Meta:
        model = sheet.models.Character
        fields = ()

    def save(self, commit=True):
        cs = sheet.models.CharacterEdge()
        cs.character = self.instance
        cs.edge = self.cleaned_data.get('edge')
        cs.save()
        return self.instance


class EditEdgeLevelForm(forms.ModelForm):
    class Meta:
        model = sheet.models.EdgeLevel
        exclude = ('skill_bonuses',)


class RemoveGenericForm(forms.Form):
    def __init__(self, *args, **kwargs):
        item = kwargs.pop('item', None)
        item_type = kwargs.pop('item_type', "")
        super(RemoveGenericForm, self).__init__(*args, **kwargs)
        if item:
            self.fields['item'].initial = item.pk
        if item_type:
            self.fields['item_type'].initial = item_type

    item_type = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    item = forms.CharField(max_length=128, widget=widgets.HiddenInput,
                           required=False)


def log_stat_change(character, request, field, change):
    logger.debug("%s: changed %s by %s.", character, field, change)

    # 15 minutes past.
    since = datetime.datetime.now() - datetime.timedelta(minutes=15)

    try:
        entry = sheet.models.CharacterLogEntry.objects.filter(
            user=request.user,
            character=character,
            field=field,
            timestamp__gte=since).latest()
    except sheet.models.CharacterLogEntry.DoesNotExist:
        entry = sheet.models.CharacterLogEntry()
        entry.character = character
        entry.user = request.user
        entry.field = field

    entry.amount += change
    entry.save()

    if entry.amount == 0 and change != 0:
        entry.delete()


class StatModifyForm(RequestForm):
    stat = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    function = forms.CharField(max_length=64, widget=widgets.HiddenInput)

    class Meta:
        model = sheet.models.Character
        fields = ()

    def clean_stat(self):
        if self.cleaned_data['stat'] not in ["cur_" + xx.lower()
                                             for xx in sheet.models.BASE_STATS]:
            raise forms.ValidationError, "Invalid stat type."
        return self.cleaned_data['stat'].lower()

    def save(self, commit=True):
        char = self.instance

        stat = self.cleaned_data['stat']
        orig = getattr(char, stat)
        change = 1 if self.cleaned_data['function'] == "add" else -1
        setattr(char, stat, orig + change)

        if commit:
            char.save()

            log_stat_change(self.instance, self.request, stat, change)

        return char


class CharacterSkillLevelModifyForm(RequestFormMixin, forms.Form):
    function = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    skill_id = forms.IntegerField(widget=widgets.HiddenInput)

    def __init__(self, *args, **kwargs):
        inst = kwargs.pop('instance', None)
        super(CharacterSkillLevelModifyForm, self).__init__(*args, **kwargs)
        if inst:
            self.fields['skill_id'].initial = inst.pk

    def clean_skill_id(self):
        self.instance = sheet.models.CharacterSkill.objects.get(
            pk=self.cleaned_data['skill_id'])
        logger.debug("Skill id: %s", self.cleaned_data['skill_id'])
        logger.debug("Got skill instance %s", self.instance)
        return self.cleaned_data['skill_id']

    def clean(self):
        """
        Keep skill level in defined bounds.  Two level specializations
        '-/2/3/-' should work; the level should not decrease below 1 or
        increase above 2.
        """
        if not self.cleaned_data.get('skill_id'):
            raise forms.ValidationError, "Skill id is required."
        if self.cleaned_data.get('function') == 'add':
            level_modify = 1
        else:
            level_modify = -1
        new_level = self.instance.level + level_modify
        if new_level < 0:
            new_level = 0
        elif new_level == 0:
            if not self.instance.skill.skill_cost_0:
                new_level = self.instance.level
        elif new_level == 1:
            if not self.instance.skill.skill_cost_1:
                new_level = self.instance.level
        elif new_level == 2:
            if not self.instance.skill.skill_cost_2:
                new_level = self.instance.level
        elif new_level > 9:
            new_level = self.instance.level

        if new_level >= 3:
            if not self.instance.skill.skill_cost_3:
                new_level = self.instance.level

        self.new_level = new_level
        return self.cleaned_data

    def save(self, commit=True):
        if self.new_level != self.instance.level:
            self.instance.level = self.new_level
            return self.instance.save()
        return self.instance


class ArmorForm(RequestForm):
    base = forms.ModelChoiceField(
        queryset=sheet.models.ArmorTemplate.objects.filter(is_helm=False))
    class Meta:
        model = sheet.models.Armor


class HelmForm(RequestForm):
    base = forms.ModelChoiceField(
        queryset=sheet.models.ArmorTemplate.objects.filter(is_helm=True))
    class Meta:
        model = sheet.models.Armor


class AddCharacterForm(RequestForm):
    base_stat_field_names = []
    PREFIXES = ["start_", "cur_", "base_mod_"]
    for prefix in PREFIXES:
        for stat in sheet.models.Character.BASE_STATS:
            base_stat_field_names.append(prefix + stat)
    derived_field_names = ["base_mod_mov", "base_mod_dex", "base_mod_imm"]
    stat_field_names = base_stat_field_names + derived_field_names

    def non_stat_fields(self):
        return filter(lambda field:
                      field.name not in self.stat_field_names,
                      self.visible_fields())

    def base_stat_fields(self):
        Stat = namedtuple('Stat', ['stat', 'fields'])

        stat_fields = {}

        for stat in sheet.models.Character.BASE_STATS:
            stat_fields[stat] = [self[prefix + stat]
                                 for prefix in self.PREFIXES]

        return [Stat(stat=stat, fields=stat_fields[stat])
                for stat in sheet.models.Character.BASE_STATS]

    def derived_stat_fields(self):
        return [self[field_name] for field_name in self.derived_field_names]

    class Meta:
        model = sheet.models.Character


class EditCharacterForm(AddCharacterForm):
    def save(self, commit=True):
        if commit:
            if self.changed_data:
                old_obj = sheet.models.Character.objects.get(
                    pk=self.instance.pk)
                for ff in self.changed_data:
                    old_value = getattr(old_obj, ff)
                    if self.cleaned_data[ff] != old_value:
                        logger.debug("New value: %s, initial value: %s",
                                     self.cleaned_data[ff],
                                     old_value)
                        if isinstance(old_value, int):
                            log_stat_change(self.instance, self.request, ff,
                                            self.cleaned_data[ff] - old_value)
                        else:
                            log_stat_change(self.instance, self.request, ff, 0)

        return super(EditCharacterForm, self).save(commit=commit)


class AddXPForm(RequestForm):
    add_xp = forms.IntegerField()
    class Meta:
        model = sheet.models.Character
        fields = ()

    def save(self, commit=True):
        if commit and self.cleaned_data['add_xp']:

            log_stat_change(self.instance, self.request, 'total_xp',
                            self.cleaned_data['add_xp'])
            self.instance.total_xp += self.cleaned_data['add_xp']
            self.instance.save()

        return super(AddXPForm, self).save(commit=commit)


class CreateBaseFirearmForm(forms.ModelForm):
    ammo_types = forms.CharField(help_text="Accepted ammo types, "
                                           "separated by '|'")

    def clean_ammo_types(self):
        ammo_types = self.cleaned_data.get('ammo_types')
        if ammo_types:
            ammo_types = ammo_types.split('|')
            ammo_types = filter(None, [tok.strip() for tok in ammo_types])
            for ammo_type in ammo_types:
                if not re.match('^[.\w+/-]*$', ammo_type):
                    raise forms.ValidationError, (
                           "Invalid ammo type `{ammo_type}'".format(
                               ammo_type=ammo_type))
            return ammo_types

    def save(self, commit=True):
        instance = super(CreateBaseFirearmForm, self).save(commit=True)
        if commit:
            instance.ammunition_types.all().delete()
            for ammo_type in self.cleaned_data.get('ammo_types'):
                sheet.models.FirearmAmmunitionType.objects.create(
                    firearm=instance,
                    short_label=ammo_type)
        return instance

    class Meta:
        model = sheet.models.BaseFirearm
