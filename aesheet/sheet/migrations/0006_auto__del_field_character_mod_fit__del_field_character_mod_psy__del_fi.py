# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Deleting field 'Character.mod_fit'
        db.delete_column('sheet_character', 'mod_fit')

        # Deleting field 'Character.mod_psy'
        db.delete_column('sheet_character', 'mod_psy')

        # Deleting field 'Character.mod_imm'
        db.delete_column('sheet_character', 'mod_imm')

        # Deleting field 'Character.mod_dex'
        db.delete_column('sheet_character', 'mod_dex')

        # Deleting field 'Character.mod_int'
        db.delete_column('sheet_character', 'mod_int')

        # Deleting field 'Character.mod_wil'
        db.delete_column('sheet_character', 'mod_wil')

        # Deleting field 'Character.mod_ref'
        db.delete_column('sheet_character', 'mod_ref')

        # Deleting field 'Character.mod_mov'
        db.delete_column('sheet_character', 'mod_mov')

        # Deleting field 'Character.mod_lrn'
        db.delete_column('sheet_character', 'mod_lrn')

        # Deleting field 'Character.mod_pos'
        db.delete_column('sheet_character', 'mod_pos')

        # Deleting field 'Character.mod_cha'
        db.delete_column('sheet_character', 'mod_cha')


    def backwards(self, orm):
        
        # Adding field 'Character.mod_fit'
        db.add_column('sheet_character', 'mod_fit', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'Character.mod_psy'
        db.add_column('sheet_character', 'mod_psy', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'Character.mod_imm'
        db.add_column('sheet_character', 'mod_imm', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'Character.mod_dex'
        db.add_column('sheet_character', 'mod_dex', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'Character.mod_int'
        db.add_column('sheet_character', 'mod_int', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'Character.mod_wil'
        db.add_column('sheet_character', 'mod_wil', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'Character.mod_ref'
        db.add_column('sheet_character', 'mod_ref', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'Character.mod_mov'
        db.add_column('sheet_character', 'mod_mov', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'Character.mod_lrn'
        db.add_column('sheet_character', 'mod_lrn', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'Character.mod_pos'
        db.add_column('sheet_character', 'mod_pos', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)

        # Adding field 'Character.mod_cha'
        db.add_column('sheet_character', 'mod_cha', self.gf('django.db.models.fields.IntegerField')(default=0), keep_default=False)


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
            'description': ('django.db.models.fields.TextField', [], {'max_length': '256', 'blank': 'True'}),
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
        }
    }

    complete_apps = ['sheet']
