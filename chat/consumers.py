from djangochannelsrestframework.generics import AsyncAPIConsumer, GenericAsyncAPIConsumer
from djangochannelsrestframework.decorators import action
from django.db.models import Count
from django.core import serializers
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from rest_framework import status

from djangochannelsrestframework.mixins import (
    ListModelMixin,
    RetrieveModelMixin,
    PatchModelMixin,
    UpdateModelMixin,
    CreateModelMixin,
    DeleteModelMixin,
)
from .models import Room, SavedContactName, Message
from account.models import User, Profile
from .serializers import RoomSerializer, CNameSerializer, MessageSerializer


class ChatConsumer(
    GenericAsyncAPIConsumer,
):

    async def connect(self):
        self.user = self.scope['user'] 
        print(self.scope['user'])
        if self.user.is_authenticated:
            self.broadcastName = f"_{self.user}_"
            await (self.channel_layer.group_add)(self.broadcastName, self.channel_name)

        self.channel = get_channel_layer()
        await self.update_OnOff(True)
        await self.accept()


    async def send_data(self, event):
        data = event["content"]
        # print(data)
        await self.send_json(data)


    async def disconnect(self, close_code):
        await self.update_OnOff(False)
        self.channel_layer.group_discard("broadcastName", self.channel_name)
        self.close()


    @action()
    async def full_data(self, request_id, **kwargs):
        full_data = await self.get_full_data()
        return full_data, status.HTTP_200_OK


    @database_sync_to_async
    def get_full_data(self):
        result = dict()
        rooms = Room.objects.filter(members__in=(self.user.id,))
              
        for room in rooms.iterator():
            contact = room.members.exclude(username=self.user.username).first()
            result[room.id] = {
                "profile": contact.profile.get_full_data,
                "messages": [msg.get_full_data for msg in room.messages.all()]
            }

            try:
                saved_name = SavedContactName.objects.get(user=contact, chat=room).saved_name
                result[room.id]['profile']['saved_name'] = saved_name
            except SavedContactName.DoesNotExist:
                result[room.id]['profile']['saved_name'] = result[room.id]['profile']['username']

        # print(result)
        return result
    

    @database_sync_to_async
    def update_OnOff(self, is_online):
        # print(is_online)
        Profile.objects.filter(user=self.user).update(is_online=is_online)



class RoomConsumer(
    ListModelMixin,
    RetrieveModelMixin,
    PatchModelMixin,
    UpdateModelMixin,
    CreateModelMixin,
    DeleteModelMixin,
    GenericAsyncAPIConsumer,
):

    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    
    @action()
    async def new_chat(self, request_id, inputs, **kwargs):
        created, message = await self.add_chat(inputs)
        resp = {"message": message}

        if created:
            channel = get_channel_layer()
            await channel.group_send(
                f"_{inputs.get('creator')}_",
                {"type": "send.data", "content": inputs}
            )
            return resp, status.HTTP_200_OK
        else:
            return resp, status.HTTP_400_BAD_REQUEST

    @database_sync_to_async
    def add_chat(self, inputs):        
        print(inputs)
        input_phone = inputs.get('phone')
        input_cname = inputs.get('contact_name')
        creator = self.scope['user']
        new_contact = User.objects.filter(phone=input_phone)
        print(creator, new_contact.first())
        message = None

        if new_contact.exists():
            new_contact = new_contact.first()
            ids = [creator.id, new_contact.id]
            rooms = Room.objects.annotate(count=Count('members')).filter(count=len(ids))
            for id in ids:
                rooms = rooms.filter(members__id=id)
            # print(rooms)
            if rooms.exists():
                message = "this contact is already in your contacts list!"
                return False, message
            else:
                new_room = Room.objects.create(created_by=creator)             
                new_room.members.add(creator)
                new_room.members.add(new_contact)
                new_room.save()
                
                if input_cname:
                    SavedContactName.objects.create(
                        user=new_contact,
                        chat=new_room,
                        saved_name=input_cname,
                    )
                
                return True, message
        else:
            message = "entered phone number is either invalid or unverified!"
            return False, message


class MessageConsumer(
    ListModelMixin,
    RetrieveModelMixin,
    PatchModelMixin,
    UpdateModelMixin,
    CreateModelMixin,
    DeleteModelMixin,
    GenericAsyncAPIConsumer,
):

    queryset = Message.objects.all()
    serializer_class = MessageSerializer

  