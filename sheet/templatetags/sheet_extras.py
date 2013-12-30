from django import template
from sheet.models import rounddown

register = template.Library()

@register.simple_tag
def render_armor(armor, loc_desc):
    if not armor:
        return ''

    descr = []
    for stat in ['p', 's', 'b', 'r', 'dr', 'dp', 'pl']:
        value = getattr(armor, "armor_%s_%s" % (loc_desc, stat))
        value = "%s%s" % ("-" if value < 0 else "", rounddown(abs(value)))
        descr.append(unicode(value))

    return "<td>" + "</td><td>".join(descr) + "</td>"


@register.simple_tag
def sum_sp_cost(skills):
    try:
        return sum((skill.cost() for skill in skills))
    except TypeError:
        return "NaN"


@register.simple_tag
def active(request, url):
    return "active" if request.path.startswith(url) else ""
