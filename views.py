from django.shortcuts import render

import django.contrib.auth.views

def profile(request):
    return render(request, 'registration/profile.html')

def logout(request):
    return django.contrib.auth.views.logout_then_login(request)
