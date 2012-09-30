from django import template

register = template.Library()

@register.simple_tag
def render_armor(armor, loc_desc):
    if not armor:
        return ''

    descr = []
    for stat in ['p', 's', 'b', 'r', 'dr', 'dp']:
        descr.append(unicode(getattr(armor,
                                     "armor_%s_%s" % (loc_desc, stat))))

    return "<td>" + "</td><td>".join(descr) + "</td>"

@register.simple_tag
def sum_sp_cost(skills):
    try:
        return sum((skill.cost() for skill in skills))
    except TypeError:
        return "NaN"
