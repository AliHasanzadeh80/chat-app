from django import forms
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm
from .models import User, Profile

class UserCreationForm(BaseUserCreationForm):
    phone = forms.CharField(max_length=20, required=True, help_text='Phone Number',
                            widget=forms.TextInput(attrs={'placeholder': 'ex. +989101398655'}))

    class Meta:
        model = User
        fields = ('username', 'phone', 'password1', 'password2')


class VerifyForm(forms.Form):
    code = forms.CharField(max_length=8, required=True, help_text='Enter the code that is sent via sms')


class UserUpdateForm(forms.ModelForm):
    phone = forms.CharField(max_length=20, required=True, label='phone number', disabled=True,
                            widget=forms.TextInput(attrs={'placeholder': 'ex. +989101398655'}))
    username = forms.CharField(help_text=None, label='username', widget=forms.TextInput(attrs={'placeholder': 'ex. user1234'}))

    class Meta:
        model = User
        fields = ['username', 'phone']
        

class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['picture', 'bio']
        