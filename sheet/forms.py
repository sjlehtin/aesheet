from django import forms
from django.forms import widgets
from django.forms.models import modelform_factory
from sheet.models import *
import sheet.models

class CharacterForm(forms.ModelForm):

    class Meta:
        model = Character

class SheetForm(forms.ModelForm):

    class Meta:
        model = Sheet

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

class AddSkill(forms.ModelForm):
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
        if level == 0 and skill.is_specialization:
            level = 1
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

class StatModify(forms.ModelForm):
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
        if self.cleaned_data['function'] == "add":
            setattr(char, stat, orig + 1)
        else:
            setattr(char, stat, orig - 1)

        if commit:
            char.save()
        return char

SpellEffectForm = modelform_factory(SpellEffect)
EdgeForm = modelform_factory(Edge)
EdgeLevelForm = modelform_factory(EdgeLevel)
WeaponForm = modelform_factory(Weapon)
RangedWeaponForm = modelform_factory(RangedWeapon)
RangedWeaponTemplateForm = modelform_factory(RangedWeaponTemplate)
ArmorTemplateForm = modelform_factory(ArmorTemplate)
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
