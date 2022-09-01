from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import User
from .forms import UserCreationForm
from .forms import VerifyForm
from . import verify


def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            phone_number = form.cleaned_data.get('phone')              
            if not User.objects.filter(phone=phone_number).exists():
                try:
                    print('sending...')
                    verify.send(form.cleaned_data.get('phone'))
                    form.save()
                    return redirect('chat-home')
                except Exception as e:
                    print(e)
                    messages.error(request, 'Invalid phone number!')   
            else:
                messages.warning(request, 'Entered phone number is already verified!')
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
                messages.error(request, 'please enter verification code correctly!')
    else:
        form = VerifyForm()

    return render(request, 'account/verify.html', {'form': form})