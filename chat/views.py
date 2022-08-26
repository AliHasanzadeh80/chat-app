from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from account.decorators import verification_required

@login_required
@verification_required
def home(request):
    messages.success(request, f"Logged in as {request.user.username}")
    return render(request, 'chat/home.html', context={'title': 'Home'})