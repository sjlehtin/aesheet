from django import forms
from django.forms import widgets
from sheet.models import *
import sheet.models

class EditCharacter(forms.ModelForm):

    class Meta:
        model = Character

class EditSheet(forms.ModelForm):

    class Meta:
        model = Sheet

class SheetForm(forms.Form):
    def __init__(self, *args, **kwargs):
        if kwargs.has_key('form_id'):
            form_id = kwargs.pop('form_id')
        super(SheetForm, self).__init__(*args, **kwargs)
        self.fields['form_id'].initial = self.__class__.__name__

    form_id = forms.CharField(max_length=64, widget=widgets.HiddenInput)

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

class AddForm(SheetForm):
    sheet = None
    """
    The sheet object.  Can be used by subclasses.
    """

    def __init__(self, *args, **kwargs):
        self.sheet = kwargs.pop('sheet')
        super(AddForm, self).__init__(*args, **kwargs)
        self.fields['item'].choices = self.get_choices()

    def get_choices(self):
        """
        Override this.  Return a choices iterable for adding various
        things for the sheet.
        """
        pass
    item = forms.ChoiceField(choices=())

class AddWeapon(forms.ModelForm):
    weapon = forms.ChoiceField(choices=())
    def __init__(self, *args, **kwargs):
        super(AddWeapon, self).__init__(*args, **kwargs)
        self.fields['weapon'].choices = [(wpn.name, unicode(wpn))
                                         for wpn in Weapon.objects.all()]

    class Meta:
        model = Sheet
        fields = ()

    def clean_weapon(self):
        weapon = self.cleaned_data['weapon']
        # Raises objectnotfound error if item not found.
        wpn = Weapon.objects.get(name=weapon)
        return wpn

    def save(self):
        self.instance.weapons.add(self.cleaned_data['weapon'])
        self.instance.full_clean()
        self.instance.save()
        return self.instance

class AddWeaponFromTemplate(forms.Form):
    WeaponTemplate.objects.all()
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

class AddEdge(AddForm):
    def get_choices(self):
        return [(item.name, unicode(item)) for item in EdgeLevel.objects.all()]

class RemoveGeneric(SheetForm):
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
