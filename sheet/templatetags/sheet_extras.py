import itertools
from django import template

register = template.Library()

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
