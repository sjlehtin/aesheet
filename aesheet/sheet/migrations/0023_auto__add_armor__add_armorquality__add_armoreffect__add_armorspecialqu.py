# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Armor'
        db.create_table('sheet_armor', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=256, blank=True)),
            ('description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('base', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['sheet.ArmorTemplate'])),
            ('quality', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['sheet.ArmorQuality'])),
        ))
        db.send_create_signal('sheet', ['Armor'])

        # Adding M2M table for field special_qualities on 'Armor'
        db.create_table('sheet_armor_special_qualities', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('armor', models.ForeignKey(orm['sheet.armor'], null=False)),
            ('armorspecialquality', models.ForeignKey(orm['sheet.armorspecialquality'], null=False))
        ))
        db.create_unique('sheet_armor_special_qualities', ['armor_id', 'armorspecialquality_id'])

        # Adding model 'ArmorQuality'
        db.create_table('sheet_armorquality', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=256)),
            ('short_name', self.gf('django.db.models.fields.CharField')(max_length=5)),
            ('armor_h_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_h_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_h_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_h_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_t_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_t_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_t_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_t_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ll_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ll_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ll_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ll_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_la_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_la_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_la_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_la_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_rl_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_rl_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_rl_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_rl_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ra_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ra_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ra_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ra_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
        ))
        db.send_create_signal('sheet', ['ArmorQuality'])

        # Adding model 'ArmorEffect'
        db.create_table('sheet_armoreffect', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('notes', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('cc_skill_levels', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('fit', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('ref', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('lrn', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('int', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('psy', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('wil', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('cha', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('pos', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('mov', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('dex', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('imm', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('saves_vs_fire', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('saves_vs_cold', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('saves_vs_lightning', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('saves_vs_poison', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('saves_vs_all', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=256)),
            ('description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('armor', self.gf('django.db.models.fields.related.ForeignKey')(related_name='effects', to=orm['sheet.ArmorSpecialQuality'])),
        ))
        db.send_create_signal('sheet', ['ArmorEffect'])

        # Adding model 'ArmorSpecialQuality'
        db.create_table('sheet_armorspecialquality', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('short_description', self.gf('django.db.models.fields.CharField')(max_length=256)),
        ))
        db.send_create_signal('sheet', ['ArmorSpecialQuality'])

        # Adding model 'Helm'
        db.create_table('sheet_helm', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('character', self.gf('django.db.models.fields.related.OneToOneField')(related_name='helm', unique=True, to=orm['sheet.Character'])),
            ('armor', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['sheet.Armor'])),
        ))
        db.send_create_signal('sheet', ['Helm'])

        # Adding model 'ArmorTemplate'
        db.create_table('sheet_armortemplate', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=256)),
            ('description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('armor_h_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_h_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_h_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_h_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_t_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_t_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_t_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_t_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ll_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ll_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ll_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ll_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_la_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_la_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_la_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_la_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_rl_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_rl_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_rl_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_rl_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ra_p', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ra_s', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ra_b', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
            ('armor_ra_r', self.gf('django.db.models.fields.DecimalField')(max_digits=4, decimal_places=1)),
        ))
        db.send_create_signal('sheet', ['ArmorTemplate'])

        # Adding field 'WeaponTemplate.description'
        db.add_column('sheet_weapontemplate', 'description', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

        # Adding M2M table for field armor on 'Sheet'
        db.create_table('sheet_sheet_armor', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('sheet', models.ForeignKey(orm['sheet.sheet'], null=False)),
            ('armor', models.ForeignKey(orm['sheet.armor'], null=False))
        ))
        db.create_unique('sheet_sheet_armor', ['sheet_id', 'armor_id'])


    def backwards(self, orm):
        
        # Deleting model 'Armor'
        db.delete_table('sheet_armor')

        # Removing M2M table for field special_qualities on 'Armor'
        db.delete_table('sheet_armor_special_qualities')

        # Deleting model 'ArmorQuality'
        db.delete_table('sheet_armorquality')

        # Deleting model 'ArmorEffect'
        db.delete_table('sheet_armoreffect')

        # Deleting model 'ArmorSpecialQuality'
        db.delete_table('sheet_armorspecialquality')

        # Deleting model 'Helm'
        db.delete_table('sheet_helm')

        # Deleting model 'ArmorTemplate'
        db.delete_table('sheet_armortemplate')

        # Deleting field 'WeaponTemplate.description'
        db.delete_column('sheet_weapontemplate', 'description')

        # Removing M2M table for field armor on 'Sheet'
        db.delete_table('sheet_sheet_armor')


    models = {
        'sheet.armor': {
            'Meta': {'object_name': 'Armor'},
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.ArmorTemplate']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'quality': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.ArmorQuality']"}),
            'special_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['sheet.ArmorSpecialQuality']", 'symmetrical': 'False'})
        },
        'sheet.armoreffect': {
            'Meta': {'object_name': 'ArmorEffect'},
            'armor': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'effects'", 'to': "orm['sheet.ArmorSpecialQuality']"}),
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'sheet.armorquality': {
            'Meta': {'object_name': 'ArmorQuality'},
            'armor_h_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '5'})
        },
        'sheet.armorspecialquality': {
            'Meta': {'object_name': 'ArmorSpecialQuality'},
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'short_description': ('django.db.models.fields.CharField', [], {'max_length': '256'})
        },
        'sheet.armortemplate': {
            'Meta': {'object_name': 'ArmorTemplate'},
            'armor_h_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_b': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_p': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_r': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_s': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'})
        },
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
        'sheet.characteredge': {
            'Meta': {'object_name': 'CharacterEdge'},
            'character': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'edges'", 'to': "orm['sheet.Character']"}),
            'edge': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.EdgeLevel']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        'sheet.characterskill': {
            'Meta': {'object_name': 'CharacterSkill'},
            'character': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'skills'", 'to': "orm['sheet.Character']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'level': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.Skill']"})
        },
        'sheet.edge': {
            'Meta': {'object_name': 'Edge'},
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'})
        },
        'sheet.edgelevel': {
            'Meta': {'object_name': 'EdgeLevel'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cost': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'edge': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.Edge']"}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'level': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'requires_hero': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'sheet.helm': {
            'Meta': {'object_name': 'Helm'},
            'armor': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.Armor']"}),
            'character': ('django.db.models.fields.related.OneToOneField', [], {'related_name': "'helm'", 'unique': 'True', 'to': "orm['sheet.Character']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        'sheet.sheet': {
            'Meta': {'object_name': 'Sheet'},
            'armor': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['sheet.Armor']", 'symmetrical': 'False', 'blank': 'True'}),
            'character': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sheet.Character']"}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'size': ('django.db.models.fields.CharField', [], {'default': "'M'", 'max_length': '1'}),
            'spell_effects': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['sheet.SpellEffect']", 'symmetrical': 'False', 'blank': 'True'}),
            'weapons': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['sheet.Weapon']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'sheet.skill': {
            'Meta': {'object_name': 'Skill'},
            'can_be_defaulted': ('django.db.models.fields.BooleanField', [], {'default': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_specialization': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'required_edges': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': "orm['sheet.Edge']", 'null': 'True', 'blank': 'True'}),
            'required_skills': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': "orm['sheet.Skill']", 'null': 'True', 'blank': 'True'}),
            'skill_cost_0': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_1': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_2': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_3': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '64'})
        },
        'sheet.spelleffect': {
            'Meta': {'object_name': 'SpellEffect'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
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
        'sheet.weaponeffect': {
            'Meta': {'object_name': 'WeaponEffect'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'weapon': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'effects'", 'to': "orm['sheet.WeaponSpecialQuality']"}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
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
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dice': ('django.db.models.fields.IntegerField', [], {'default': '6'}),
            'dp': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'draw_initiative': ('django.db.models.fields.IntegerField', [], {'default': '-3', 'null': 'True', 'blank': 'True'}),
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
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'primary_for_weapons'", 'to': "orm['sheet.Skill']"}),
            'skill2': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'secondary_for_weapons'", 'null': 'True', 'to': "orm['sheet.Skill']"}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'S'", 'max_length': '5'})
        }
    }

    complete_apps = ['sheet']
