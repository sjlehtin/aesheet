# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding field 'WeaponTemplate.ccv'
        db.add_column('sheet_weapontemplate', 'ccv', self.gf('django.db.models.fields.IntegerField')(default=10), keep_default=False)

        # Adding field 'WeaponTemplate.ccv_unskilled_modifier'
        db.add_column('sheet_weapontemplate', 'ccv_unskilled_modifier', self.gf('django.db.models.fields.IntegerField')(default=-10), keep_default=False)

        # Adding field 'WeaponTemplate.draw_initiative'
        db.add_column('sheet_weapontemplate', 'draw_initiative', self.gf('django.db.models.fields.IntegerField')(default=-3), keep_default=False)

        # Adding field 'WeaponTemplate.roa'
        db.add_column('sheet_weapontemplate', 'roa', self.gf('django.db.models.fields.DecimalField')(default=1.0, max_digits=4, decimal_places=3), keep_default=False)

        # Adding field 'WeaponTemplate.num_dice'
        db.add_column('sheet_weapontemplate', 'num_dice', self.gf('django.db.models.fields.IntegerField')(default=1), keep_default=False)

        # Adding field 'WeaponTemplate.dice'
        db.add_column('sheet_weapontemplate', 'dice', self.gf('django.db.models.fields.IntegerField')(default=6), keep_default=False)

        # Adding field 'WeaponTemplate.extra_damage'
        db.add_column('sheet_weapontemplate', 'extra_damage', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'WeaponTemplate.leth'
        db.add_column('sheet_weapontemplate', 'leth', self.gf('django.db.models.fields.IntegerField')(default=5), keep_default=False)

        # Adding field 'WeaponTemplate.defense_leth'
        db.add_column('sheet_weapontemplate', 'defense_leth', self.gf('django.db.models.fields.IntegerField')(default=5), keep_default=False)

        # Adding field 'WeaponTemplate.type'
        db.add_column('sheet_weapontemplate', 'type', self.gf('django.db.models.fields.CharField')(default='S', max_length=5), keep_default=False)

        # Adding field 'WeaponTemplate.plus_leth'
        db.add_column('sheet_weapontemplate', 'plus_leth', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'WeaponTemplate.durability'
        db.add_column('sheet_weapontemplate', 'durability', self.gf('django.db.models.fields.IntegerField')(default=5), keep_default=False)

        # Adding field 'WeaponTemplate.dp'
        db.add_column('sheet_weapontemplate', 'dp', self.gf('django.db.models.fields.IntegerField')(default=10), keep_default=False)

        # Adding field 'WeaponTemplate.notes'
        db.add_column('sheet_weapontemplate', 'notes', self.gf('django.db.models.fields.CharField')(default='', max_length=64, blank=True), keep_default=False)

        # Adding field 'WeaponTemplate.short_name'
        db.add_column('sheet_weapontemplate', 'short_name', self.gf('django.db.models.fields.CharField')(default='foo', max_length=64), keep_default=False)

        # Adding field 'WeaponTemplate.is_lance'
        db.add_column('sheet_weapontemplate', 'is_lance', self.gf('django.db.models.fields.BooleanField')(default=False, blank=True), keep_default=False)


    def backwards(self, orm):
        
        # Deleting field 'WeaponTemplate.ccv'
        db.delete_column('sheet_weapontemplate', 'ccv')

        # Deleting field 'WeaponTemplate.ccv_unskilled_modifier'
        db.delete_column('sheet_weapontemplate', 'ccv_unskilled_modifier')

        # Deleting field 'WeaponTemplate.draw_initiative'
        db.delete_column('sheet_weapontemplate', 'draw_initiative')

        # Deleting field 'WeaponTemplate.roa'
        db.delete_column('sheet_weapontemplate', 'roa')

        # Deleting field 'WeaponTemplate.num_dice'
        db.delete_column('sheet_weapontemplate', 'num_dice')

        # Deleting field 'WeaponTemplate.dice'
        db.delete_column('sheet_weapontemplate', 'dice')

        # Deleting field 'WeaponTemplate.extra_damage'
        db.delete_column('sheet_weapontemplate', 'extra_damage')

        # Deleting field 'WeaponTemplate.leth'
        db.delete_column('sheet_weapontemplate', 'leth')

        # Deleting field 'WeaponTemplate.defense_leth'
        db.delete_column('sheet_weapontemplate', 'defense_leth')

        # Deleting field 'WeaponTemplate.type'
        db.delete_column('sheet_weapontemplate', 'type')

        # Deleting field 'WeaponTemplate.plus_leth'
        db.delete_column('sheet_weapontemplate', 'plus_leth')

        # Deleting field 'WeaponTemplate.durability'
        db.delete_column('sheet_weapontemplate', 'durability')

        # Deleting field 'WeaponTemplate.dp'
        db.delete_column('sheet_weapontemplate', 'dp')

        # Deleting field 'WeaponTemplate.notes'
        db.delete_column('sheet_weapontemplate', 'notes')

        # Deleting field 'WeaponTemplate.short_name'
        db.delete_column('sheet_weapontemplate', 'short_name')

        # Deleting field 'WeaponTemplate.is_lance'
        db.delete_column('sheet_weapontemplate', 'is_lance')


    models = {
        'sheet.character': {
            'Meta': {'object_name': 'Character'},
            'adventures': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'age': ('django.db.models.fields.IntegerField', [], {'default': '20'}),
            'base_mod_cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'base_mod_wil': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'bought_stamina': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'bougth_mana': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cur_cha': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_fit': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_int': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_lrn': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_pos': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_psy': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_ref': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'cur_wil': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'deity': ('django.db.models.fields.CharField', [], {'default': "'Kord'", 'max_length': '256'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'edges_bougth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'gained_sp': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '175'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'occupation': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'race': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'size': ('django.db.models.fields.CharField', [], {'default': "'M'", 'max_length': '1'}),
            'start_cha': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_fit': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_int': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_lrn': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_pos': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_psy': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_ref': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'start_wil': ('django.db.models.fields.IntegerField', [], {'default': '43'}),
            'times_wounded': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'total_xp': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'unnatural_aging': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'weigth': ('django.db.models.fields.IntegerField', [], {'default': '75'}),
            'xp_used_ingame': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'sheet.sheet': {
            'Meta': {'object_name': 'Sheet'},
            'character': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.Character']"}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'size': ('django.db.models.fields.CharField', [], {'default': "'M'", 'max_length': '1'})
        },
        'sheet.weapon': {
            'Meta': {'object_name': 'Weapon'},
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.WeaponTemplate']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'quality': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.WeaponQuality']"}),
            'special_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['sheet.WeaponSpecialQuality']", 'symmetrical': 'False'})
        },
        'sheet.weaponquality': {
            'Meta': {'object_name': 'WeaponQuality'},
            'ccv': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'damage': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'defense_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'dp_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1', 'max_digits': '6', 'decimal_places': '4'}),
            'durability': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'plus_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'roa': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '6', 'decimal_places': '4'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '5'}),
            'versus_area_save_modifier': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'versus_missile_modifier': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'weight_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1', 'max_digits': '6', 'decimal_places': '4'})
        },
        'sheet.weaponspecialquality': {
            'Meta': {'object_name': 'WeaponSpecialQuality'},
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'short_description': ('django.db.models.fields.CharField', [], {'max_length': '256'})
        },
        'sheet.weapontemplate': {
            'Meta': {'object_name': 'WeaponTemplate'},
            'ccv': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'ccv_unskilled_modifier': ('django.db.models.fields.IntegerField', [], {'default': '-10'}),
            'defense_leth': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'dice': ('django.db.models.fields.IntegerField', [], {'default': '6'}),
            'dp': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'draw_initiative': ('django.db.models.fields.IntegerField', [], {'default': '-3'}),
            'durability': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'extra_damage': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_lance': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'leth': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'num_dice': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'plus_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'roa': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '3'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '64'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'S'", 'max_length': '5'})
        }
    }

    complete_apps = ['sheet']
