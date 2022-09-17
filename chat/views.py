from multiprocessing import context
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from account.decorators import verification_required
from account.forms import ProfileUpdateForm, UserUpdateForm

@login_required
@verification_required
def home(request):
    print(request.method)
    # messages.success(request, f"Logged in as {request.user.username}")   
    if request.method == 'POST':
        user_update_form = UserUpdateForm(request.POST, instance=request.user)
        profile_update_form = ProfileUpdateForm(
            request.POST,
            request.FILES,
            instance=request.user.profile
        )
        if profile_update_form.is_valid() and user_update_form.is_valid():
            profile_update_form.save()
            user_update_form.save()
            messages.success(request, 'your profile have been successfully updated!')
            return redirect('chat-home')
    else:
        user_update_form = UserUpdateForm(instance=request.user)
        profile_update_form = ProfileUpdateForm(instance=request.user.profile)

    context = {
        'title': 'Home',
        'pu_form': profile_update_form,
        'uu_form': user_update_form,
    }
    return render(request, 'chat/homechild.html', context)

@login_required
@verification_required
def addContact(request):
    return render(request, 'chat/addcontact.html')