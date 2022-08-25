from django.shortcuts import render, redirect
from .forms import UserCreationForm


def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
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