from .models import Room, SavedContactName, Message
from rest_framework import serializers


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class CNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedContactName
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'