from django import forms
from django.forms import widgets
from django.forms.models import modelform_factory
from sheet.models import *
import sheet.models
import datetime

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

class AddWeapon(forms.ModelForm):
    weapon = forms.ModelChoiceField(queryset=Weapon.objects.all())

    class Meta:
        model = Sheet
        fields = ()

    def save(self):
        self.instance.weapons.add(self.cleaned_data['weapon'])
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class AddRangedWeapon(forms.ModelForm):
    weapon = forms.ModelChoiceField(queryset=RangedWeapon.objects.all())

    class Meta:
        model = Sheet
        fields = ()

    def save(self):
        self.instance.ranged_weapons.add(self.cleaned_data['weapon'])
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class AddWeaponFromTemplate(forms.Form):
    template = forms.CharField()
    quality = forms.CharField()

class AddArmor(forms.ModelForm):
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

class AddHelm(forms.ModelForm):
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

class AddSpellEffect(forms.ModelForm):
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

class AddSkill(RequestForm):
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

class AddLanguage(AddSkill):
    skill = forms.ModelChoiceField(
        queryset=Skill.objects.filter(type="Language"))

class AddEdge(forms.ModelForm):
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

class RemoveGeneric(forms.Form):
    def __init__(self, *args, **kwargs):
        item = kwargs.pop('item', None)
        item_type = kwargs.pop('item_type', "")
        super(RemoveGeneric, self).__init__(*args, **kwargs)
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

class StatModify(RequestForm):
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

WeaponForm = modelform_factory(Weapon)
RangedWeaponForm = modelform_factory(RangedWeapon)

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
