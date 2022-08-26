from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from account.decorators import verification_required

@login_required
@verification_required
def home(request):
    return render(request, 'chat/home.html', context={'title': 'Home'})