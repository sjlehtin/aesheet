from django import forms
from django.forms import widgets
from sheet.models import *
import unittest

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


class SheetFormTestCase(unittest.TestCase):
    def test_create_form(self):
        f = SheetForm()
        self.assertTrue(f)

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

class AddWeapon(AddForm):
    def get_choices(self):
        return [(wpn.name, unicode(wpn)) for wpn in Weapon.objects.all()]

class AddWeaponFromTemplate(forms.Form):
    WeaponTemplate.objects.all()
    template = forms.CharField()
    quality = forms.CharField()

class AddArmor(AddForm):
    def get_choices(self):
        return [(item.name, unicode(item)) for item in Armor.objects.all()]

class AddHelm(AddForm):
    def get_choices(self):
        return [(armor.name, unicode(armor)) for armor in
                filter(lambda xx: xx.base.is_helm, Armor.objects.all())]

class AddSpellEffect(AddForm):
    def get_choices(self):
        return [(item.name, unicode(item))
                for item in SpellEffect.objects.all()]

class AddSkill(AddForm):
    def get_choices(self):
        return [(item.name, unicode(item)) for item in Skill.objects.all()]

    # XXX Ajax update based on the chosen skill.
    choices = range(0,8)
    choices = zip(choices, choices)
    level = forms.ChoiceField(choices=choices)

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
    item = forms.IntegerField(widget=widgets.HiddenInput)

class StatModify(SheetForm):
    stat = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    function = forms.CharField(max_length=64, widget=widgets.HiddenInput)
