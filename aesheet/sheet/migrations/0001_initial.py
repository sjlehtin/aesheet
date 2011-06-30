# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Character'
        db.create_table('sheet_character', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=256)),
            ('occupation', self.gf('django.db.models.fields.CharField')(max_length=256)),
            ('race', self.gf('django.db.models.fields.CharField')(max_length=256)),
            ('description', self.gf('django.db.models.fields.TextField')(max_length=256, blank=True)),
            ('age', self.gf('django.db.models.fields.IntegerField')(default=20)),
            ('unnatural_aging', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('height', self.gf('django.db.models.fields.IntegerField')(default=175)),
            ('weigth', self.gf('django.db.models.fields.IntegerField')(default=75)),
            ('times_wounded', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('size', self.gf('django.db.models.fields.CharField')(default='M', max_length=1)),
            ('deity', self.gf('django.db.models.fields.CharField')(default='Kord', max_length=256)),
            ('adventures', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('gained_sp', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('xp_used_ingame', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('bought_stamina', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('bougth_mana', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('edges_bougth', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('total_xp', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('start_fit', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('start_ref', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('start_lrn', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('start_int', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('start_psy', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('start_wil', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('start_cha', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('start_pos', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('cur_fit', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('cur_ref', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('cur_lrn', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('cur_int', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('cur_psy', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('cur_wil', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('cur_cha', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('cur_pos', self.gf('django.db.models.fields.IntegerField')(default=43)),
            ('mod_fit', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('mod_ref', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('mod_lrn', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('mod_int', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('mod_psy', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('mod_wil', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('mod_cha', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('mod_pos', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('mod_mov', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('mod_dex', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('mod_imm', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal('sheet', ['Character'])

        # Adding model 'Sheet'
        db.create_table('sheet_sheet', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('character', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['sheet.Character'])),
            ('description', self.gf('django.db.models.fields.TextField')()),
            ('size', self.gf('django.db.models.fields.CharField')(default='M', max_length=1)),
        ))
        db.send_create_signal('sheet', ['Sheet'])


    def backwards(self, orm):
        
        # Deleting model 'Character'
        db.delete_table('sheet_character')

        # Deleting model 'Sheet'
        db.delete_table('sheet_sheet')


    models = {
        'sheet.character': {
            'Meta': {'object_name': 'Character'},
            'adventures': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'age': ('django.db.models.fields.IntegerField', [], {'default': '20'}),
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
            'mod_cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_wil': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
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
