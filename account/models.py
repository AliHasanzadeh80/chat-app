from tkinter.messagebox import NO
from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import datetime

class User(AbstractUser):
    phone = models.TextField(max_length=20, blank=False)
    is_verified = models.BooleanField(default=False)  


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    picture = models.ImageField(default='profile_images/default.png', upload_to='profile_images')
    bio = models.TextField(blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    is_online = models.BooleanField(default=False)

    @property
    def get_full_data(self):
        dj_time = self.date_joined.strftime('%B %d, %Y')
        sub = datetime.now() - self.last_seen.replace(tzinfo=None)

        if 0 <= sub.days < 1:
            ls_time = self.last_seen.strftime('%H:%M')
        elif 1 <= sub.days < 365:
            ls_time = self.last_seen.strftime('%b %e, %H:%M')
        else:
            ls_time = 'a long time ago'

        return {
            "username": self.user.username,
            "picture": self.picture.url,
            "bio": self.bio,
            "date_joined": dj_time,
            "last_seen": ls_time,
            "is_online": self.is_online,
        }