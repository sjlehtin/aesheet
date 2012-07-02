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
    weapon_cls = Weapon
    weapon = forms.ChoiceField(choices=())
    def __init__(self, *args, **kwargs):
        super(AddWeapon, self).__init__(*args, **kwargs)
        self.fields['weapon'].choices = [
            (wpn.pk, unicode(wpn)) for wpn in self.weapon_cls.objects.all()]

    class Meta:
        model = Sheet
        fields = ()

    def clean_weapon(self):
        weapon = self.cleaned_data['weapon']
        # Raises objectnotfound error if item not found.
        wpn = self.weapon_cls.objects.get(id=weapon)
        return wpn

    def save(self):
        self.instance.weapons.add(self.cleaned_data['weapon'])
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class AddRangedWeapon(AddWeapon):
    weapon_cls = RangedWeapon
    def save(self):
        self.instance.ranged_weapons.add(self.cleaned_data['weapon'])
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class AddWeaponFromTemplate(forms.Form):
    template = forms.CharField()
    quality = forms.CharField()

class AddArmor(forms.ModelForm):
    armor = forms.ChoiceField(choices=())
    def __init__(self, *args, **kwargs):
        super(AddArmor, self).__init__(*args, **kwargs)
        self.fields['armor'].choices =  [
            (armor.name, unicode(armor))
            for armor in filter(lambda xx: not xx.base.is_helm,
                                Armor.objects.all())]

    class Meta:
        model = Sheet
        fields = ()

    def clean_armor(self):
        armor = self.cleaned_data['armor']
        # Raises objectnotfound error if item not found.
        armor = Armor.objects.get(name=armor)
        return armor

    def save(self):
        self.instance.armor = self.cleaned_data['armor']
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class AddHelm(forms.ModelForm):
    helm = forms.ChoiceField(choices=())
    def __init__(self, *args, **kwargs):
        super(AddHelm, self).__init__(*args, **kwargs)
        self.fields['helm'].choices =  [
            (armor.name, unicode(armor))
            for armor in filter(lambda xx: xx.base.is_helm,
                                Armor.objects.all())]

    class Meta:
        model = Sheet
        fields = ()

    def clean_helm(self):
        helm = self.cleaned_data['helm']
        # Raises objectnotfound error if item not found.
        helm = Armor.objects.get(name=helm)
        return helm

    def save(self):
        self.instance.helm = self.cleaned_data['helm']
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class AddSpellEffect(forms.ModelForm):
    effect = forms.ChoiceField(choices=())
    def __init__(self, *args, **kwargs):
        super(AddSpellEffect, self).__init__(*args, **kwargs)
        self.fields['effect'].choices = [(item.name, unicode(item))
                                         for item in SpellEffect.objects.all()]

    class Meta:
        model = Sheet
        fields = ()

    def clean_effect(self):
        effect = self.cleaned_data['effect']
        # Raises objectnotfound error if skill not found.
        eff = SpellEffect.objects.get(name=effect)
        return eff

    def save(self):
        self.instance.spell_effects.add(self.cleaned_data['effect'])
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class AddSkill(forms.ModelForm):
    skill = forms.ChoiceField(choices=())
    choices = range(0,8)
    choices = zip(choices, choices)
    level = forms.ChoiceField(choices=choices)

    def __init__(self, *args, **kwargs):
        super(AddSkill, self).__init__(*args, **kwargs)
        self.fields['skill'].choices = [(item.name, unicode(item))
                                         for item in Skill.objects.all()]

    def clean_skill(self):
        skill = self.cleaned_data['skill']
        # Raises objectnotfound error if skill not found.
        sk = Skill.objects.get(name=skill)
        return sk

    def clean(self):
        super(AddSkill, self).clean()
        skill = self.cleaned_data.get('skill')
        level = self.cleaned_data.get('level')
        if skill and level:
            # verify skill and level go together.
            cs = CharacterSkill()
            cs.character = self.instance
            cs.skill = skill
            cs.level = level
            cs.full_clean()
        return self.cleaned_data

    class Meta:
        model = Character
        fields = ()

    def save(self, commit=True):
        cs = CharacterSkill()
        cs.character = self.instance
        cs.skill = self.cleaned_data.get('skill')
        cs.level = self.cleaned_data.get('level')
        cs.save()
        return self.instance

class AddEdge(forms.ModelForm):
    edge = forms.ChoiceField(choices=())
    choices = range(0,8)
    choices = zip(choices, choices)

    def __init__(self, *args, **kwargs):
        super(AddEdge, self).__init__(*args, **kwargs)
        self.fields['edge'].choices = [(item.pk, unicode(item))
                                       for item in EdgeLevel.objects.all()]

    def clean_edge(self):
        edge = self.cleaned_data['edge']
        # Raises objectnotfound error if edge not found.
        edge = EdgeLevel.objects.get(pk=edge)
        return edge

    def clean(self):
        super(AddEdge, self).clean()
        edge = self.cleaned_data.get('edge')
        if edge:
            # verify edge and level go together.
            cs = CharacterEdge()
            cs.character = self.instance
            cs.edge = edge
            cs.full_clean()
        return self.cleaned_data

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
