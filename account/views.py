from .models import User
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import UserCreationForm
from .forms import VerifyForm
from . import verify


def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
       
        if form.is_valid():
            phone_number = form.cleaned_data.get('phone')    
            print(User.objects.filter(phone=phone_number).exists())
            if not User.objects.filter(phone=phone_number).exists():
                form.save()
                verify.send(form.cleaned_data.get('phone'))
                return redirect('chat-home')
    else:
        form = UserCreationForm()

    context = {
        "title": "Sign-Up",
        "form": form
    }

    return render(request, 'account/register.html', context)


def login(request):
    return render(request, 'account/login.html', context={'title': 'Login'})


@login_required
def verify_code(request):
    if request.method == 'POST':
        form = VerifyForm(request.POST)
        if form.is_valid():
            code = form.cleaned_data.get('code')
            if verify.check(request.user.phone, code):
                request.user.is_verified = True
                request.user.save()
                return redirect('chat-home')
    else:
        form = VerifyForm()

    return render(request, 'account/verify.html', {'form': form})