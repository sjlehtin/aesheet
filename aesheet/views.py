from django.shortcuts import render_to_response
from django.template import RequestContext

import django.contrib.auth.views

def profile(request):
    c = {}
    return render_to_response('registration/profile.html',
                              c,
                              context_instance=RequestContext(request))

def logout(request):
    return django.contrib.auth.views.logout_then_login(request)
