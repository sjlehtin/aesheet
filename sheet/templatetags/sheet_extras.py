import itertools
from django import template
from sheet.models import rounddown
from django.utils.html import format_html, mark_safe

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

    return format_html("<td>{}</td>", mark_safe("</td><td>".join(descr)))


@register.simple_tag
def sum_sp_cost(skills):
    try:
        return sum((skill.cost() for skill in skills))
    except TypeError:
        return "NaN"


@register.simple_tag
def active(request, url):
    return "active" if request.path.startswith(url) else ""


@register.simple_tag
def map_tag_to_bootstrap(tag):
    tags = {'debug': 'info', 'info': 'info', 'success': 'success',
            'warning': 'warning', 'error': 'danger'}
    return tags[tag]

@register.filter
def padnone(value, arg):
    if len(value) >= int(arg):
        return value
    return itertools.islice(itertools.chain(value, itertools.repeat(None)),
                            0, int(arg))


@register.simple_tag
def render_burst_fire(weapon):
    bursts = weapon.burst_fire_skill_checks()
    if not bursts:
        return ""
    acts = [burst.action for burst in bursts]
    inits = [burst.initiative for burst in bursts]
    checks = [burst.checks for burst in bursts]

    out = []

    out.append("<thead>")
    out.append("<tr>")
    out.append("<th>Leth</th>")
    out.append("<th>Loc</th>")
    for act in acts:
        out.append("<th>{act}</th>".format(act=act))
    out.append("</tr></thead>")

    out.append("<tfoot><tr>")
    out.append("<th></th>")
    out.append("<th></th>")
    for init in inits:
        out.append("<th>{init}</th>".format(
            init="{0:+d}".format(init) if init else ""))
    out.append("</tr></tfoot>")

    lethalities = ["{0:+d}".format(ii) for ii in [0, -2, 2, 0, -2]]
    hit_locations = ["{0:+d}".format(ii) for ii in [0, 0, 0, -1, -1]]
    out.append("<tbody>")

    for row in zip(lethalities, hit_locations, *checks):
        out.append("<tr>")
        for check in row:
            out.append("<td>{check}</td>".format(check=check if check else ""))
        out.append("</tr>")
    out.append("</tbody>")
    return mark_safe("\n".join(out))
