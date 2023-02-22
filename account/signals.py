from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

from .models import Profile
from chat.models import Room, SavedContactName


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create(sender, instance, created, **kwargs):
    print(created)
    if created:
        Profile.objects.create(user=instance)
        room = Room.objects.create(created_by=instance)
        room.members.add(instance)
        SavedContactName.objects.create(user=instance, chat=room, saved_name="saved messages")

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_profile(sender, instance, **kwargs):
    print('saving')
    instance.profile.save()
