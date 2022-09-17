from django.contrib import admin
from .models import User, Profile
from .forms import ProfileUpdateForm

class ProfileAdmin(admin.ModelAdmin):
    readonly_fields = ('date_joined',)
    form = ProfileUpdateForm

admin.site.register(User)
admin.site.register(Profile, ProfileAdmin)