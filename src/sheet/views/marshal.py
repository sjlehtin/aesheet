import csv
import codecs
import chardet
from io import StringIO
from django.shortcuts import render
from django.core.exceptions import FieldDoesNotExist
import django.db.models
import django.db.models.fields.related
from django.contrib import messages
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.urls import reverse
from django.forms import ValidationError
from django.forms.utils import ErrorList
import sheet.models
import sheet.forms
from django.conf import settings

import logging

logger = logging.getLogger(__name__)


def get_data_rows(results, fields):
    """
    Return queryset data columns in order given with the fields
    parameters, one row at a time.
    """
    for obj in results:

        def get_field_value(field):
            try:
                value = getattr(obj, field)
            except AttributeError:
                return ""

            def get_descr(mdl):
                if hasattr(mdl, "name"):
                    return mdl.name
                return str(mdl.pk)

            if isinstance(value, django.db.models.Model):
                value = get_descr(value)
            elif isinstance(value, django.db.models.Manager):
                value = "|".join([get_descr(val) for val in value.all()])
            return value

        yield [get_field_value(field) for field in fields]


def browse(request, data_type):
    try:
        cls = getattr(sheet.models, data_type)
    except AttributeError as e:
        raise Http404("%s is not a supported type." % data_type)
    results = cls.objects.all()
    fields = cls.get_exported_fields()
    rows = get_data_rows(results, fields)
    fields = [" ".join(ff.split('_')) for ff in fields]
    return render(request, 'sheet/browse.html',
                  {'type': data_type,
                   'header': fields,
                   'rows': rows})


def update_id_sequence(model_class):
    """
    When importing data from a database to another database, if the item ids
    exceed the sequence in postgres, the sequence generator can get
    out-of-sync.  This will lead to duplicate id errors, as the sequence
    will generate key values, which are already present in the table.

    This remedies the situation by assigning the sequence to the start from
    the next value.
    """
    # Only with postgres.

    # TODO: this is broken with Django >= 2.2
    if (settings.DATABASES['default']['ENGINE'] ==
            "django.db.backends.postgresql"):
        try:
            if model_class._meta.get_field('id'):
                # The operation should only be performed for models with a
                # serial id as the primary key.
                cc = django.db.connection.cursor()
                # String replace ok here, as the table name is not coming
                # from an external source, and generating the query with
                # execute is not trivial with a dynamic table name.
                cc.execute("""
                SELECT pg_catalog.setval(pg_get_serial_sequence('{table}',
                                         'id'),
                                         (SELECT MAX(id) FROM {table}));
                                         """.format(
                    table=model_class._meta.db_table))
        except django.core.exceptions.FieldDoesNotExist:
            pass


def sort_by_dependencies(header, rows):
    """
    Sort the list of rows, so that dependencies are satisfied as well as
    possible.
    """
    logger.debug("Sorting skill rows rows by dependencies")
    name_index = header.index("name")
    if name_index < 0:
        raise ValueError("No name column")
    required_index = header.index("required_skills")
    if required_index < 0:
        raise ValueError("No required_skills column")

    ordered = []
    unsatisfied = {}
    satisfied = {}

    def all_satisfied(required_skills):
        for ss in required_skills:
            logger.debug("Checking for '{skill}'".format(skill=ss))
            if ss not in satisfied:
                return False
        logger.debug("all satisfied for {0}".format(required_skills))
        return True

    def get_required(required_skills):
        required_skills = required_skills.strip()
        if required_skills:
            required_skills = [req.strip()
                               for req in required_skills.split('|')]
        else:
            required_skills = []
        return required_skills

    def satisfy(row):
        logger.debug("all satisfied for {0}".format(row))
        ordered.append(row)
        skill_name = row[1][name_index]
        satisfied[skill_name] = True
        for sk in unsatisfied.pop(skill_name, []):
            if all_satisfied(get_required(sk[1][required_index])):
                satisfy(sk)

    for row in rows:
        required_skills = get_required(row[1][required_index])
        # Omit useless self loops.
        try:
            required_skills.remove(row[1][name_index])
        except ValueError:
            pass # We do not care if the value was not in the list.
        if all_satisfied(required_skills):
            satisfy(row)
        else:
            for required in required_skills:
                unsat = unsatisfied.setdefault(
                    required, [])
                unsat.append(row)

    # If still unsatisfied, just append them.
    unsatisfied_values = unsatisfied.values()
    if unsatisfied_values:
        logger.debug("Unsatisfied values left")
        ordered.extend([row for ll in unsatisfied_values for row in ll])

    return ordered


def import_text(data):
    def detect_delim(data):
        """
        Try to guess file delimiter based on the first line of the data.

        European version of Excel often saves with semi-colon format.
        :param data: the input import data.
        :return: The guessed delimiter, default is comma ','
        """
        lines = data.split('\n')
        if ';' in lines[0]:
            return ';'
        else:
            return ','

    if isinstance(data, bytes):
        if data[0:3] == codecs.BOM_UTF8:
            data = data[3:]
            encoding = 'utf-8'
        else:
            result = chardet.detect(data)
            encoding = result['encoding']

        data = data.decode(encoding)
    delim = detect_delim(data)

    reader = enumerate(csv.reader(StringIO(data), delimiter=delim), start=1)
    _, data_type = next(reader)
    if not len(data_type) or not data_type[0]:
        raise TypeError("CSV is in invalid format, first row "
                        "is the data type")
    data_type = data_type[0]
    try:
        modelcls = getattr(sheet.models, data_type)
    except AttributeError:
        raise TypeError("Invalid data type %s" % data_type)

    _, header = next(reader)

    header = [yy.lower() for yy in ['_'.join(xx.split(' ')) for xx in header]]

    changed_models = set()
    rows = reader
    if modelcls == sheet.models.Skill:
        rows = sort_by_dependencies(header, rows)

    for (line, row) in rows:
        logger.debug('columns: {0}'.format(len(row)))
        if len(row) < len(header):
            logger.info("Ignoring too short row: {0}".format(row))
            continue
        if sum([len(col) for col in row]) == 0:
            # spacer row.
            continue

        tag = line
        mdl = None
        fields = {}
        for (hh, index) in zip(header, range(len(header))):
            fields[hh] = row[index]
        try:
            if 'id' in fields and fields['id']:
                mdl = modelcls.objects.get(id=fields['id'])
            elif 'name' in fields and fields['name']:
                mdl = modelcls.objects.get(name=fields['name'])
        except modelcls.DoesNotExist:
            pass
        if not mdl:
            mdl = modelcls()
        m2m_values = {}
        ammunition_types = []
        for (field_name, value) in fields.items():
            logger.debug(("importing field %s for %s.") % (field_name,
                                                           modelcls._meta.object_name))

            if field_name not in modelcls.get_exported_fields():
                logger.info(("ignoring field %s for %s, not in "
                             "exported fields.") % (
                    field_name, modelcls.__class__.__name__))
                continue
            try:
                field = modelcls._meta.get_field(field_name)
            except FieldDoesNotExist as e:
                raise ValueError(str(e))

            if field_name == "tech_level":
                try:
                    value = sheet.models.TechLevel.objects.get(name=value)
                except sheet.models.TechLevel.DoesNotExist:
                    raise ValueError("Line %d: No matching TechLevel with name %s. (\"%s\")" % (
                        tag, value, row))
            elif field_name == "ammunition_types":
                if modelcls != sheet.models.BaseFirearm:
                    raise ValueError("Invalid model for ammunition_types")
                ammunition_types = value.split('|')
                continue
            # If the field is a reference to another object, try to find
            # the matching instance.
            elif isinstance(field, django.db.models.ForeignKey):
                if value:
                    try:
                        if isinstance(value, int):
                            value = field.remote_field.model.objects.get(id=value)
                        else:
                            value = field.remote_field.model.objects.get(
                                name=value)
                    except field.remote_field.model.DoesNotExist:
                        raise ValueError("No matching %s with name %s." % (
                            field.remote_field.model._meta.object_name,
                            value))
                else:
                    value = None
            else:
                if not value:
                    if field.has_default():
                        value = field.default
                    elif not field.empty_strings_allowed:
                        continue # Try to get away without setting the value.
                if isinstance(field,
                              django.db.models.fields.related.ManyToManyField):
                    # Make sure the field will at least be cleared.
                    m2m_values[field_name] = []
                    if not value:
                        continue
                    ll = []

                    def is_self_loop(cls, field):
                        if cls == field.remote_field.model and fields['name'] == name:
                            return True
                        else:
                            return False

                    for name in value.split('|'):
                        name = name.strip()
                        # Useless, and broken, to add a requirement to self.
                        if is_self_loop(modelcls, field):
                            continue

                        try:
                            if 'name' in field.remote_field.model._meta.fields:
                                obj = field.remote_field.model.objects.get(name=name)
                            else:
                                obj = field.remote_field.model.objects.get(pk=name)
                        except field.remote_field.model.DoesNotExist:
                            raise ValueError(
                                "Requirement `{req}' for line {line} "
                                "does not exist.".format(req=name, line=tag))
                        ll.append(obj)
                    value = ll
                    m2m_values[field_name] = value
                    # These need to be added only after the object is saved.
                    continue
                else:
                    # XXX Something a little more intelligent would
                    # probably be nice, for other types of data.
                    if value == "FALSE":
                        value = False
                    elif value == "TRUE":
                        value = True
                    # elif isinstance(field,
                    #                 django.db.models.fields.DecimalField):
                    #     value = ','.join(value.split('.'))
                    try:
                        value = field.to_python(value)
                    except Exception as e:
                        raise ValueError("Failed to import field \"%s\", "
                                        "value \"%s\" (error: %s)" % (
                            field_name, value, str(e))) from e
            setattr(mdl, field_name, value)
        try:
            mdl.full_clean()
            mdl.save()
        except Exception as e:
            raise ValueError("Line %d: Failed to import row \"%s\" (error: %s)" % (
                line, row, str(e))) from e
        for kk, vv in m2m_values.items():
            logger.info("Setting m2m values for %s(%s) %s to %s" %
                        (mdl, mdl.__class__.__name__, kk, vv))
            rel = getattr(mdl, kk)
            rel.clear()
            rel.add(*vv)

        if ammunition_types:
            # clear old ammunition types out.
            mdl.ammunition_types.clear()

            for ammo_type in ammunition_types:
                calibre, _ = sheet.models.Calibre.objects.get_or_create(
                    name=ammo_type
                )
                mdl.ammunition_types.add(calibre)

        mdl.full_clean()
        mdl.save()
        changed_models.add(mdl.__class__)

    for mdl in changed_models:
        update_id_sequence(mdl)


def import_data(request):
    """
    """
    if request.method == 'POST':
        form = sheet.forms.ImportForm(request.POST, request.FILES)
        if form.is_valid():
            import_data = form.cleaned_data['import_data']
            if 'file' in request.FILES:
                file = request.FILES['file']
                import_data = file.read()
            try:
                import_text(import_data)
                messages.success(request, "Import successful.")
                return HttpResponseRedirect(reverse('import'))
            except (TypeError, ValueError, ValidationError) as e:
                logger.exception("failed.")
                el = form._errors.setdefault('__all__',
                                             ErrorList())
                el.append(str(e))
    else:
        form = sheet.forms.ImportForm()
    types = []
    for choice in sheet.models.EXPORTABLE_MODELS:
        cls = getattr(sheet.models, choice)
        item = {}
        item['name'] = cls._meta.object_name
        item['doc'] = cls.__doc__
        item['fields'] = cls.get_exported_fields()
        types.append(item)

    return render(request, 'sheet/import_data.html',
                  {'types': types,
                   'import_form': form})


def csv_export(exported_type):
    results = exported_type.objects.all()

    f = StringIO()

    w = csv.writer(f)
    w.writerow([exported_type.__name__])
    fields = exported_type.get_exported_fields()
    w.writerow(fields)

    for row in get_data_rows(results, fields):
        w.writerow([col for col in row])
    return f.getvalue()


def export_data(request, data_type):
    try:
        cls = getattr(sheet.models, data_type)
    except AttributeError as e:
        raise Http404("%s is not a supported type." % data_type)
    csv_data = csv_export(cls)

    response = HttpResponse(csv_data, content_type="text/csv")
    response['Content-Disposition'] = 'attachment; filename=%s.csv' % data_type
    return response
