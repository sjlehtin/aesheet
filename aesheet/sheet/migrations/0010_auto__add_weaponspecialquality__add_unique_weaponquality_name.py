# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'WeaponSpecialQuality'
        db.create_table('sheet_weaponspecialquality', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('short_description', self.gf('django.db.models.fields.CharField')(max_length=256)),
        ))
        db.send_create_signal('sheet', ['WeaponSpecialQuality'])

        # Adding M2M table for field special_qualities on 'Weapon'
        db.create_table('sheet_weapon_special_qualities', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('weapon', models.ForeignKey(orm['sheet.weapon'], null=False)),
            ('weaponspecialquality', models.ForeignKey(orm['sheet.weaponspecialquality'], null=False))
        ))
        db.create_unique('sheet_weapon_special_qualities', ['weapon_id', 'weaponspecialquality_id'])

        # Adding unique constraint on 'WeaponQuality', fields ['name']
        db.create_unique('sheet_weaponquality', ['name'])


    def backwards(self, orm):
        
        # Deleting model 'WeaponSpecialQuality'
        db.delete_table('sheet_weaponspecialquality')

        # Removing M2M table for field special_qualities on 'Weapon'
        db.delete_table('sheet_weapon_special_qualities')

        # Removing unique constraint on 'WeaponQuality', fields ['name']
        db.delete_unique('sheet_weaponquality', ['name'])


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
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'})
        }
    }

    complete_apps = ['sheet']
