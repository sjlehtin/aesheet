# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'MiscellaneousItem'
        db.create_table(u'sheet_miscellaneousitem', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=256)),
            ('tech_level', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['sheet.TechLevel'])),
            ('description', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('notes', self.gf('django.db.models.fields.TextField')(blank=True)),
        ))
        db.send_create_signal(u'sheet', ['MiscellaneousItem'])

        # Adding M2M table for field armor_qualities on 'MiscellaneousItem'
        m2m_table_name = db.shorten_name(u'sheet_miscellaneousitem_armor_qualities')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('miscellaneousitem', models.ForeignKey(orm[u'sheet.miscellaneousitem'], null=False)),
            ('armorspecialquality', models.ForeignKey(orm[u'sheet.armorspecialquality'], null=False))
        ))
        db.create_unique(m2m_table_name, ['miscellaneousitem_id', 'armorspecialquality_id'])

        # Adding M2M table for field weapon_qualities on 'MiscellaneousItem'
        m2m_table_name = db.shorten_name(u'sheet_miscellaneousitem_weapon_qualities')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('miscellaneousitem', models.ForeignKey(orm[u'sheet.miscellaneousitem'], null=False)),
            ('weaponspecialquality', models.ForeignKey(orm[u'sheet.weaponspecialquality'], null=False))
        ))
        db.create_unique(m2m_table_name, ['miscellaneousitem_id', 'weaponspecialquality_id'])

        # Adding M2M table for field miscellaneous_items on 'Sheet'
        m2m_table_name = db.shorten_name(u'sheet_sheet_miscellaneous_items')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('sheet', models.ForeignKey(orm[u'sheet.sheet'], null=False)),
            ('miscellaneousitem', models.ForeignKey(orm[u'sheet.miscellaneousitem'], null=False))
        ))
        db.create_unique(m2m_table_name, ['sheet_id', 'miscellaneousitem_id'])

        # Adding field 'ArmorEffect.armor_h_p'
        db.add_column(u'sheet_armoreffect', 'armor_h_p',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_h_s'
        db.add_column(u'sheet_armoreffect', 'armor_h_s',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_h_b'
        db.add_column(u'sheet_armoreffect', 'armor_h_b',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_h_r'
        db.add_column(u'sheet_armoreffect', 'armor_h_r',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_h_dr'
        db.add_column(u'sheet_armoreffect', 'armor_h_dr',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_t_p'
        db.add_column(u'sheet_armoreffect', 'armor_t_p',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_t_s'
        db.add_column(u'sheet_armoreffect', 'armor_t_s',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_t_b'
        db.add_column(u'sheet_armoreffect', 'armor_t_b',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_t_r'
        db.add_column(u'sheet_armoreffect', 'armor_t_r',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_t_dr'
        db.add_column(u'sheet_armoreffect', 'armor_t_dr',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_ll_p'
        db.add_column(u'sheet_armoreffect', 'armor_ll_p',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_ll_s'
        db.add_column(u'sheet_armoreffect', 'armor_ll_s',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_ll_b'
        db.add_column(u'sheet_armoreffect', 'armor_ll_b',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_ll_r'
        db.add_column(u'sheet_armoreffect', 'armor_ll_r',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_ll_dr'
        db.add_column(u'sheet_armoreffect', 'armor_ll_dr',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_la_p'
        db.add_column(u'sheet_armoreffect', 'armor_la_p',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_la_s'
        db.add_column(u'sheet_armoreffect', 'armor_la_s',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_la_b'
        db.add_column(u'sheet_armoreffect', 'armor_la_b',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_la_r'
        db.add_column(u'sheet_armoreffect', 'armor_la_r',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_la_dr'
        db.add_column(u'sheet_armoreffect', 'armor_la_dr',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_rl_p'
        db.add_column(u'sheet_armoreffect', 'armor_rl_p',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_rl_s'
        db.add_column(u'sheet_armoreffect', 'armor_rl_s',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_rl_b'
        db.add_column(u'sheet_armoreffect', 'armor_rl_b',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_rl_r'
        db.add_column(u'sheet_armoreffect', 'armor_rl_r',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_rl_dr'
        db.add_column(u'sheet_armoreffect', 'armor_rl_dr',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_ra_p'
        db.add_column(u'sheet_armoreffect', 'armor_ra_p',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_ra_s'
        db.add_column(u'sheet_armoreffect', 'armor_ra_s',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_ra_b'
        db.add_column(u'sheet_armoreffect', 'armor_ra_b',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_ra_r'
        db.add_column(u'sheet_armoreffect', 'armor_ra_r',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)

        # Adding field 'ArmorEffect.armor_ra_dr'
        db.add_column(u'sheet_armoreffect', 'armor_ra_dr',
                      self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=4, decimal_places=1),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting model 'MiscellaneousItem'
        db.delete_table(u'sheet_miscellaneousitem')

        # Removing M2M table for field armor_qualities on 'MiscellaneousItem'
        db.delete_table(db.shorten_name(u'sheet_miscellaneousitem_armor_qualities'))

        # Removing M2M table for field weapon_qualities on 'MiscellaneousItem'
        db.delete_table(db.shorten_name(u'sheet_miscellaneousitem_weapon_qualities'))

        # Removing M2M table for field miscellaneous_items on 'Sheet'
        db.delete_table(db.shorten_name(u'sheet_sheet_miscellaneous_items'))

        # Deleting field 'ArmorEffect.armor_h_p'
        db.delete_column(u'sheet_armoreffect', 'armor_h_p')

        # Deleting field 'ArmorEffect.armor_h_s'
        db.delete_column(u'sheet_armoreffect', 'armor_h_s')

        # Deleting field 'ArmorEffect.armor_h_b'
        db.delete_column(u'sheet_armoreffect', 'armor_h_b')

        # Deleting field 'ArmorEffect.armor_h_r'
        db.delete_column(u'sheet_armoreffect', 'armor_h_r')

        # Deleting field 'ArmorEffect.armor_h_dr'
        db.delete_column(u'sheet_armoreffect', 'armor_h_dr')

        # Deleting field 'ArmorEffect.armor_t_p'
        db.delete_column(u'sheet_armoreffect', 'armor_t_p')

        # Deleting field 'ArmorEffect.armor_t_s'
        db.delete_column(u'sheet_armoreffect', 'armor_t_s')

        # Deleting field 'ArmorEffect.armor_t_b'
        db.delete_column(u'sheet_armoreffect', 'armor_t_b')

        # Deleting field 'ArmorEffect.armor_t_r'
        db.delete_column(u'sheet_armoreffect', 'armor_t_r')

        # Deleting field 'ArmorEffect.armor_t_dr'
        db.delete_column(u'sheet_armoreffect', 'armor_t_dr')

        # Deleting field 'ArmorEffect.armor_ll_p'
        db.delete_column(u'sheet_armoreffect', 'armor_ll_p')

        # Deleting field 'ArmorEffect.armor_ll_s'
        db.delete_column(u'sheet_armoreffect', 'armor_ll_s')

        # Deleting field 'ArmorEffect.armor_ll_b'
        db.delete_column(u'sheet_armoreffect', 'armor_ll_b')

        # Deleting field 'ArmorEffect.armor_ll_r'
        db.delete_column(u'sheet_armoreffect', 'armor_ll_r')

        # Deleting field 'ArmorEffect.armor_ll_dr'
        db.delete_column(u'sheet_armoreffect', 'armor_ll_dr')

        # Deleting field 'ArmorEffect.armor_la_p'
        db.delete_column(u'sheet_armoreffect', 'armor_la_p')

        # Deleting field 'ArmorEffect.armor_la_s'
        db.delete_column(u'sheet_armoreffect', 'armor_la_s')

        # Deleting field 'ArmorEffect.armor_la_b'
        db.delete_column(u'sheet_armoreffect', 'armor_la_b')

        # Deleting field 'ArmorEffect.armor_la_r'
        db.delete_column(u'sheet_armoreffect', 'armor_la_r')

        # Deleting field 'ArmorEffect.armor_la_dr'
        db.delete_column(u'sheet_armoreffect', 'armor_la_dr')

        # Deleting field 'ArmorEffect.armor_rl_p'
        db.delete_column(u'sheet_armoreffect', 'armor_rl_p')

        # Deleting field 'ArmorEffect.armor_rl_s'
        db.delete_column(u'sheet_armoreffect', 'armor_rl_s')

        # Deleting field 'ArmorEffect.armor_rl_b'
        db.delete_column(u'sheet_armoreffect', 'armor_rl_b')

        # Deleting field 'ArmorEffect.armor_rl_r'
        db.delete_column(u'sheet_armoreffect', 'armor_rl_r')

        # Deleting field 'ArmorEffect.armor_rl_dr'
        db.delete_column(u'sheet_armoreffect', 'armor_rl_dr')

        # Deleting field 'ArmorEffect.armor_ra_p'
        db.delete_column(u'sheet_armoreffect', 'armor_ra_p')

        # Deleting field 'ArmorEffect.armor_ra_s'
        db.delete_column(u'sheet_armoreffect', 'armor_ra_s')

        # Deleting field 'ArmorEffect.armor_ra_b'
        db.delete_column(u'sheet_armoreffect', 'armor_ra_b')

        # Deleting field 'ArmorEffect.armor_ra_r'
        db.delete_column(u'sheet_armoreffect', 'armor_ra_r')

        # Deleting field 'ArmorEffect.armor_ra_dr'
        db.delete_column(u'sheet_armoreffect', 'armor_ra_dr')


    models = {
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'sheet.armor': {
            'Meta': {'object_name': 'Armor'},
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.ArmorTemplate']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'quality': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.ArmorQuality']"}),
            'special_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.ArmorSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'sheet.armoreffect': {
            'Meta': {'object_name': 'ArmorEffect'},
            'armor': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'effects'", 'to': u"orm['sheet.ArmorSpecialQuality']"}),
            'armor_h_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'enhancement'", 'max_length': '256'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'sheet.armorquality': {
            'Meta': {'object_name': 'ArmorQuality'},
            'armor_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'dp_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'}),
            'mod_climb': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_conceal': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_encumbrance_class': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_fit_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'}),
            'mod_psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_sensory': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_stealth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_weight_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '5', 'blank': 'True'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"})
        },
        u'sheet.armorspecialquality': {
            'Meta': {'object_name': 'ArmorSpecialQuality'},
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '32', 'primary_key': 'True'})
        },
        u'sheet.armortemplate': {
            'Meta': {'object_name': 'ArmorTemplate'},
            'armor_h_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'armor_h_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_h_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'armor_la_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_la_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'armor_ll_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ll_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'armor_ra_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_ra_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'armor_rl_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_rl_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_b': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_dp': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_dr': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_p': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_pl': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'armor_t_r': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'armor_t_s': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '4', 'decimal_places': '1'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'encumbrance_class': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'is_helm': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'mod_climb': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_conceal': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_hear': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_smell': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_stealth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_surprise': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_tumble': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mod_vision': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'weight': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'})
        },
        u'sheet.campaign': {
            'Meta': {'object_name': 'Campaign'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '10'}),
            'tech_levels': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.TechLevel']", 'symmetrical': 'False'})
        },
        u'sheet.character': {
            'Meta': {'ordering': "['last_update_at']", 'object_name': 'Character'},
            'adventures': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'age': ('django.db.models.fields.PositiveIntegerField', [], {'default': '20'}),
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
            'bought_mana': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'bought_stamina': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'campaign': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Campaign']"}),
            'cur_cha': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_fit': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_int': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_lrn': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_pos': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_psy': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_ref': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'cur_wil': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'deity': ('django.db.models.fields.CharField', [], {'default': "'Kord'", 'max_length': '256'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'edges_bought': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'free_edges': ('django.db.models.fields.IntegerField', [], {'default': '2'}),
            'gained_sp': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '175'}),
            'hero': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_update_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'occupation': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'characters'", 'to': u"orm['auth.User']"}),
            'race': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'size': ('django.db.models.fields.CharField', [], {'default': "'M'", 'max_length': '1'}),
            'start_cha': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_fit': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_int': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_lrn': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_pos': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_psy': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_ref': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'start_wil': ('django.db.models.fields.PositiveIntegerField', [], {'default': '43'}),
            'times_wounded': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'total_xp': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'unnatural_aging': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'weigth': ('django.db.models.fields.IntegerField', [], {'default': '75'}),
            'xp_used_ingame': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'})
        },
        u'sheet.characteredge': {
            'Meta': {'object_name': 'CharacterEdge'},
            'character': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'edges'", 'to': u"orm['sheet.Character']"}),
            'edge': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.EdgeLevel']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        u'sheet.characterlogentry': {
            'Meta': {'ordering': "['-timestamp']", 'object_name': 'CharacterLogEntry'},
            'amount': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'character': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Character']"}),
            'edge': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.EdgeLevel']", 'null': 'True', 'blank': 'True'}),
            'edge_level': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'entry': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'entry_type': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'field': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'removed': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Skill']", 'null': 'True', 'blank': 'True'}),
            'skill_level': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"})
        },
        u'sheet.characterskill': {
            'Meta': {'ordering': "('skill__name',)", 'object_name': 'CharacterSkill'},
            'character': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'skills'", 'to': u"orm['sheet.Character']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'level': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Skill']"})
        },
        u'sheet.edge': {
            'Meta': {'object_name': 'Edge'},
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'})
        },
        u'sheet.edgelevel': {
            'Meta': {'object_name': 'EdgeLevel'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cost': ('django.db.models.fields.DecimalField', [], {'max_digits': '4', 'decimal_places': '1'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'edge': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Edge']"}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'level': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'requires_hero': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'skill_bonuses': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['sheet.Skill']", 'null': 'True', 'through': u"orm['sheet.EdgeSkillBonus']", 'blank': 'True'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'sheet.edgeskillbonus': {
            'Meta': {'object_name': 'EdgeSkillBonus'},
            'bonus': ('django.db.models.fields.IntegerField', [], {'default': '15'}),
            'edge_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.EdgeLevel']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Skill']"})
        },
        u'sheet.miscellaneousitem': {
            'Meta': {'object_name': 'MiscellaneousItem'},
            'armor_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.ArmorSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '256'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'weapon_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.WeaponSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'sheet.rangedweapon': {
            'Meta': {'ordering': "['name']", 'object_name': 'RangedWeapon'},
            'ammo_quality': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'rangedweaponammo_set'", 'null': 'True', 'to': u"orm['sheet.WeaponQuality']"}),
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.RangedWeaponTemplate']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'quality': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.WeaponQuality']"}),
            'special_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.WeaponSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'sheet.rangedweapontemplate': {
            'Meta': {'ordering': "['name']", 'object_name': 'RangedWeaponTemplate'},
            'ammo_weight': ('django.db.models.fields.DecimalField', [], {'default': '0.1', 'max_digits': '4', 'decimal_places': '1'}),
            'base_skill': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'base_skill_for_rangedweapontemplate'", 'to': u"orm['sheet.Skill']"}),
            'bypass': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dice': ('django.db.models.fields.IntegerField', [], {'default': '6'}),
            'dp': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'draw_initiative': ('django.db.models.fields.IntegerField', [], {'default': '-3', 'null': 'True', 'blank': 'True'}),
            'durability': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'extra_damage': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'leth': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'num_dice': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'plus_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'range_e': ('django.db.models.fields.IntegerField', [], {}),
            'range_l': ('django.db.models.fields.IntegerField', [], {}),
            'range_m': ('django.db.models.fields.IntegerField', [], {}),
            'range_pb': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'range_s': ('django.db.models.fields.IntegerField', [], {}),
            'range_vs': ('django.db.models.fields.IntegerField', [], {}),
            'range_xl': ('django.db.models.fields.IntegerField', [], {}),
            'range_xs': ('django.db.models.fields.IntegerField', [], {}),
            'roa': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '3'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '64'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'primary_for_rangedweapontemplate'", 'null': 'True', 'to': u"orm['sheet.Skill']"}),
            'skill2': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'secondary_for_rangedweapontemplate'", 'null': 'True', 'to': u"orm['sheet.Skill']"}),
            'target_initiative': ('django.db.models.fields.IntegerField', [], {'default': '-2'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'S'", 'max_length': '5'}),
            'weight': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'})
        },
        u'sheet.sheet': {
            'Meta': {'ordering': "['last_update_at']", 'object_name': 'Sheet'},
            'armor': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Armor']", 'null': 'True', 'on_delete': 'models.SET_NULL', 'blank': 'True'}),
            'character': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.Character']"}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'extra_weight_carried': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'helm': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'helm_for'", 'null': 'True', 'on_delete': 'models.SET_NULL', 'to': u"orm['sheet.Armor']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_update_at': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'miscellaneous_items': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.MiscellaneousItem']", 'symmetrical': 'False', 'blank': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'sheets'", 'to': u"orm['auth.User']"}),
            'ranged_weapons': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.RangedWeapon']", 'symmetrical': 'False', 'blank': 'True'}),
            'size': ('django.db.models.fields.CharField', [], {'default': "'M'", 'max_length': '1'}),
            'spell_effects': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.SpellEffect']", 'symmetrical': 'False', 'blank': 'True'}),
            'weapons': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.Weapon']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'sheet.skill': {
            'Meta': {'ordering': "['name']", 'object_name': 'Skill'},
            'can_be_defaulted': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'is_specialization': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'required_edges': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['sheet.Edge']", 'null': 'True', 'blank': 'True'}),
            'required_skills': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['sheet.Skill']", 'null': 'True', 'blank': 'True'}),
            'skill_cost_0': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_1': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_2': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'skill_cost_3': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'stat': ('django.db.models.fields.CharField', [], {'max_length': '64'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '64'})
        },
        u'sheet.spelleffect': {
            'Meta': {'object_name': 'SpellEffect'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'enhancement'", 'max_length': '256'}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'sheet.techlevel': {
            'Meta': {'object_name': 'TechLevel'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '10'})
        },
        u'sheet.weapon': {
            'Meta': {'ordering': "['name']", 'object_name': 'Weapon'},
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.WeaponTemplate']"}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'quality': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.WeaponQuality']"}),
            'special_qualities': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['sheet.WeaponSpecialQuality']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'sheet.weaponeffect': {
            'Meta': {'object_name': 'WeaponEffect'},
            'cc_skill_levels': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cha': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dex': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'fit': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'imm': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'int': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'lrn': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'mov': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'pos': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'psy': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ref': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_all': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_cold': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_fire': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_lightning': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'saves_vs_poison': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'enhancement'", 'max_length': '256'}),
            'weapon': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'effects'", 'to': u"orm['sheet.WeaponSpecialQuality']"}),
            'wil': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'sheet.weaponquality': {
            'Meta': {'ordering': "['roa', 'ccv']", 'object_name': 'WeaponQuality'},
            'bypass': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ccv': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'damage': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'defense_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'dp_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1', 'max_digits': '6', 'decimal_places': '4'}),
            'durability': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '256', 'blank': 'True'}),
            'plus_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'roa': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '6', 'decimal_places': '4'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '5', 'blank': 'True'}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'versus_area_save_modifier': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'versus_missile_modifier': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'weight_multiplier': ('django.db.models.fields.DecimalField', [], {'default': '1', 'max_digits': '6', 'decimal_places': '4'})
        },
        u'sheet.weaponspecialquality': {
            'Meta': {'object_name': 'WeaponSpecialQuality'},
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '32', 'primary_key': 'True'})
        },
        u'sheet.weapontemplate': {
            'Meta': {'ordering': "['name']", 'object_name': 'WeaponTemplate'},
            'base_skill': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'base_skill_for_weapontemplate'", 'to': u"orm['sheet.Skill']"}),
            'bypass': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'ccv': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'ccv_unskilled_modifier': ('django.db.models.fields.IntegerField', [], {'default': '-10'}),
            'defense_leth': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'dice': ('django.db.models.fields.IntegerField', [], {'default': '6'}),
            'dp': ('django.db.models.fields.IntegerField', [], {'default': '10'}),
            'draw_initiative': ('django.db.models.fields.IntegerField', [], {'default': '-3', 'null': 'True', 'blank': 'True'}),
            'durability': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'extra_damage': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'is_lance': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_shield': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'leth': ('django.db.models.fields.IntegerField', [], {'default': '5'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'primary_key': 'True'}),
            'notes': ('django.db.models.fields.CharField', [], {'max_length': '64', 'blank': 'True'}),
            'num_dice': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'plus_leth': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'roa': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '3'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '64'}),
            'skill': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'primary_for_weapontemplate'", 'null': 'True', 'to': u"orm['sheet.Skill']"}),
            'skill2': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'secondary_for_weapontemplate'", 'null': 'True', 'to': u"orm['sheet.Skill']"}),
            'tech_level': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['sheet.TechLevel']"}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'S'", 'max_length': '5'}),
            'weight': ('django.db.models.fields.DecimalField', [], {'default': '1.0', 'max_digits': '4', 'decimal_places': '1'})
        }
    }

    complete_apps = ['sheet']