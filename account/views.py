from django.shortcuts import render


def register(request):
    return render(request, 'account/register.html', context={'title': 'Sign-Up'})

def login(request):
    return render(request, 'account/login.html', context={'title': 'Login'})