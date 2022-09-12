from django.db import models
from django.conf import settings


class Room(models.Model):
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='members')
    date_created = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='created_by')
    
    class Meta:
        get_latest_by = 'id'

    def __str__(self):
        return f"room '{self.id}' created by '{self.created_by}'"

    @property
    def msg_count(self):
        return self.messages.count()


    def unread_count(self, user):
        return  self.messages.filter(seen=False).exclude(sender=user).count()


class SavedContactName(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.CASCADE, related_name='saved_names')
    chat = models.ForeignKey(Room, null=True, on_delete=models.CASCADE, related_name='chat')
    saved_name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"at {self.chat}, {self.user.username}={self.saved_name}"
    

class Message(models.Model):
    STATUS = (
        ("delivering","delivering"),
        ("delivered","delivered"),
        ("not delivered","not delivered"),
        ("draft","draft")
    )
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='sender')
    content = models.TextField()
    seen = models.BooleanField(default=False)
    status = models.CharField(max_length=15, choices=STATUS, default="draft")
    delivered_time = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        get_latest_by = 'id'

    def __str__(self):
        return f"from '{self.room}': {self.content[:10]}"
    
    @property
    def get_full_data(self):
        delivered_time = self.delivered_time.strftime('%H:%M')
        return {
            "id": self.id,
            "sender": self.sender.username,
            "senderPic": self.sender.profile.picture.url,
            "content": self.content,
            "seen": self.seen,
            "status": self.status,
            "delivered_time": delivered_time,
        }