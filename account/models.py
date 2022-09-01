from django.db import models
from django.contrib.auth.models import AbstractUser

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