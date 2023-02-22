from django.contrib import admin
from .models import Room, SavedContactName, Message


class MessageAdmin(admin.ModelAdmin):
    list_display = ('room', 'sender', 'content', 'delivered_time')

admin.site.register(Room)
admin.site.register(SavedContactName)
admin.site.register(Message, MessageAdmin)
