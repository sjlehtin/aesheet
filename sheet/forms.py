from django import forms
from django.forms import widgets
from sheet.models import *
import sheet.models
import datetime
import re

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

class AddExistingWeapon(forms.ModelForm):
    weapon = forms.ModelChoiceField(queryset=Weapon.objects.all())

    class Meta:
        model = Sheet
        fields = ()

    def save(self):
        self.instance.weapons.add(self.cleaned_data['weapon'])
        return self.instance

class AddWeaponForm(forms.ModelForm):
    item_class = Weapon
    item_manager = Weapon.objects
    template_manager = WeaponTemplate.objects
    quality_manager = WeaponQuality.objects

    def add_item(self, item):
        self.instance.weapons.add(item)

    item_template = forms.ModelChoiceField(
                              queryset=template_manager.all())
    item_quality = forms.ModelChoiceField(
        queryset=quality_manager.all())

    def __init__(self, *args, **kwargs):
        initial = kwargs.setdefault('initial', {})
        if 'item_quality' not in initial:
            quality = self.quality_manager.filter(name="normal")
            if quality:
                initial['item_quality'] = quality[0]
        super(AddWeaponForm, self).__init__(*args, **kwargs)
        def pretty_name(name):
            return ' '.join(filter(None, re.split('([A-Z][a-z]*[^A-Z])',
                                                  name))).lower().capitalize()
        item_name = pretty_name(self.item_class.__name__)
        self.fields['item_template'] = forms.ModelChoiceField(
                                    queryset=self.template_manager.all(),
                                    label=item_name + " template")
        self.fields['item_quality'] = forms.ModelChoiceField(
                                    queryset=self.quality_manager.all(),
                                    label=item_name + " quality")

    class Meta:
        model = Sheet
        fields = ()

    def clean(self):
        base = self.cleaned_data.get('item_template')
        quality = self.cleaned_data.get('item_quality')
        if not base or not quality:
            raise forms.ValidationError("Both template and quality "
                                        "are required.")
        item = self.item_manager.filter(base=base, quality=quality)
        if item:
            item = item[0]
        else:
            item = self.item_class(base=base, quality=quality)
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
    item_class = RangedWeapon
    item_manager = RangedWeapon.objects
    template_manager = RangedWeaponTemplate.objects
    quality_manager = WeaponQuality.objects

    def add_item(self, item):
        self.instance.ranged_weapons.add(item)

class AddExistingRangedWeaponForm(forms.ModelForm):
    weapon = forms.ModelChoiceField(queryset=RangedWeapon.objects.all())

    class Meta:
        model = Sheet
        fields = ()

    def save(self):
        self.instance.ranged_weapons.add(self.cleaned_data['weapon'])
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class AddWeaponFromTemplateForm(forms.Form):
    template = forms.CharField()
    quality = forms.CharField()

class AddArmorForm(forms.ModelForm):
    armor = forms.ModelChoiceField(queryset=Armor.objects.filter(
            base__is_helm=False))

    class Meta:
        model = Sheet
        fields = ()

    def save(self):
        self.instance.armor = self.cleaned_data['armor']
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class AddHelmForm(forms.ModelForm):
    helm = forms.ModelChoiceField(queryset=Armor.objects.filter(
            base__is_helm=True))

    class Meta:
        model = Sheet
        fields = ()

    def save(self):
        self.instance.helm = self.cleaned_data['helm']
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class AddSpellEffectForm(forms.ModelForm):
    effect = forms.ModelChoiceField(queryset=SpellEffect.objects.all())

    class Meta:
        model = Sheet
        fields = ()

    def save(self):
        self.instance.spell_effects.add(self.cleaned_data['effect'])
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class RequestForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super(RequestForm, self).__init__(*args, **kwargs)

class AddSkillForm(RequestForm):
    # XXX Change this to use CharacterSkill as the model.
    skill = forms.ModelChoiceField(
        queryset=Skill.objects.exclude(type="Language"))
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
        # verify skill and level go together.
        cs = CharacterSkill()
        cs.character = self.instance
        cs.skill = skill
        cs.level = level
        cs.full_clean()

        return self.cleaned_data

    class Meta:
        model = Character
        fields = ('skill',)

    def save(self, commit=True):
        cs = CharacterSkill()
        cs.character = self.instance
        cs.skill = self.cleaned_data.get('skill')
        cs.level = self.cleaned_data.get('level')
        cs.save()
        return self.instance

class AddLanguageForm(AddSkillForm):
    skill = forms.ModelChoiceField(
        queryset=Skill.objects.filter(type="Language"))

class AddEdgeForm(forms.ModelForm):
    edge = forms.ModelChoiceField(queryset=EdgeLevel.objects.all())
    choices = range(0,8)
    choices = zip(choices, choices)

    class Meta:
        model = Character
        fields = ()

    def save(self, commit=True):
        cs = CharacterEdge()
        cs.character = self.instance
        cs.edge = self.cleaned_data.get('edge')
        cs.save()
        return self.instance

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
        entry = CharacterLogEntry.objects.filter(
            user=request.user,
            character=character,
            field=field,
            timestamp__gte=since).latest()
    except CharacterLogEntry.DoesNotExist:
        entry = CharacterLogEntry()
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
        model = Character
        fields = ()

    def clean_stat(self):
        if self.cleaned_data['stat'] not in ["cur_" + xx.lower()
                                             for xx in sheet.models.BASE_STATS]:
            raise ValidationError, "Invalid stat type."
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

class CharacterSkillLevelModifyForm(forms.Form):
    function = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    skill_id = forms.IntegerField(widget=widgets.HiddenInput)

    def __init__(self, *args, **kwargs):
        inst = kwargs.pop('instance', None)
        super(CharacterSkillLevelModifyForm, self).__init__(*args, **kwargs)
        if inst:
            self.fields['skill_id'].initial = inst.pk

    def clean_skill_id(self):
        self.instance = CharacterSkill.objects.get(
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

class ArmorForm(forms.ModelForm):
    base = forms.ModelChoiceField(queryset=ArmorTemplate.objects.filter(
            is_helm=False))
    class Meta:
        model = Armor

class HelmForm(forms.ModelForm):
    base = forms.ModelChoiceField(queryset=ArmorTemplate.objects.filter(
            is_helm=True))
    class Meta:
        model = Armor

class CharacterForm(RequestForm):
    class Meta:
        model = Character

    def save(self, commit=True):
        if commit:
            if self.changed_data:
                old_obj = Character.objects.get(pk=self.instance.pk)
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

        return super(CharacterForm, self).save(commit=commit)

class AddXPForm(RequestForm):
    add_xp = forms.IntegerField()
    class Meta:
        model = Character
        fields = ()

    def save(self, commit=True):
        if commit and self.cleaned_data['add_xp']:

            log_stat_change(self.instance, self.request, 'total_xp',
                            self.cleaned_data['add_xp'])
            self.instance.total_xp += self.cleaned_data['add_xp']
            self.instance.save()

        return super(AddXPForm, self).save(commit=commit)
