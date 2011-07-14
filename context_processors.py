from django.conf import settings # import the settings file


def variables(context):
    # return the value you want as a dictionary. you may add
    # multiple values in there.
    return { 'ROOT_URL': settings.ROOT_URL }
