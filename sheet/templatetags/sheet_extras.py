from django import template

register = template.Library()

@register.simple_tag
def render_armor_leth_red(armor, loc_desc):
    if not armor:
        return ''

    descr = []
    for dmg_type in ['p', 's', 'b', 'r']:
        descr.append(unicode(getattr(armor,
                                     "armor_%s_%s" % (loc_desc, dmg_type))))

    return "<td>" + "</td><td>".join(descr) + "</td>"

@register.simple_tag
def sum_sp_cost(skills):
    return sum((skill.cost() for skill in skills))
