from django.db import models
from django.contrib.auth.models import AbstractUser
from chat.models import SavedContactName

class User(AbstractUser):
    phone = models.TextField(max_length=20, blank=False)
    is_verified = models.BooleanField(default=False)  

    @property
    def get_cname(self):
        try:
            return self.saved_names.saved_name
        except Exception as e:
            print(e)
            return self.username


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    picture = models.ImageField(default='profile_images/default.png', upload_to='profile_images')
    bio = models.TextField(blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    is_online = models.BooleanField(default=False)

    @property
    def get_full_data(self):
        return {
            "username": self.user.username,
            "picture": self.picture.url,
            "bio": self.bio,
            "date_joined": self.date_joined.timestamp(),
            "last_seen": self.last_seen.timestamp(),
            "is_online": self.is_online,
        }