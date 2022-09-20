from channels.generic.websocket import AsyncJsonWebsocketConsumer
from importlib.resources import contents
from djangochannelsrestframework.generics import AsyncAPIConsumer, GenericAsyncAPIConsumer
from djangochannelsrestframework.decorators import action
from django.db.models import Count
from django.core import serializers
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
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

from datetime import datetime

class ChatConsumer(GenericAsyncAPIConsumer):
    async def connect(self):
        self.user = self.scope['user'] 
        # print(self.scope['user'])
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

        for room in self.rooms.iterator():
            contact = room.members.exclude(username=self.user.username).first()
            if contact:
                belongs_to = 'pv'
                unread_count = room.unread_count(self.user)
            else:
                belongs_to = 'sm'
                contact = room.members.get(username=self.user.username)
                unread_count = 0;
               
            result[room.id] = {
                "belongs_to": belongs_to,
                "messages": [msg.get_full_data for msg in room.messages.all()],
                "profile": contact.profile.get_full_data,
                "unread_count": unread_count,
            }

            try:
                saved_name = SavedContactName.objects.get(user=contact, chat=room).saved_name
                result[room.id]['profile']['saved_name'] = saved_name
            except SavedContactName.DoesNotExist:
                result[room.id]['profile']['saved_name'] = result[room.id]['profile']['username']

        # print(result)
        return result
    

    
    async def update_OnOff(self, is_online):
        contacts, rooms = await self.update_OnOffDB(is_online)
        channel = get_channel_layer()

        for contact, room in zip(contacts, rooms):
            content = {
                "id": room.id,
                "action": "update_last_seen",
                "username": self.user.username,
                "is_online": is_online,
                "last_seen": datetime.now().strftime('%H:%M')
            }

            await channel.group_send(
                f"_{contact.username}_",
                {"type": "send.data", "content": content}
            )
        
       

    @database_sync_to_async
    def update_OnOffDB(self, is_online):
        profile = Profile.objects.filter(user=self.user)
        profile.update(is_online=is_online)

        if not is_online:
            profile.update(last_seen=datetime.now())

        self.rooms = Room.objects.filter(members__in=(self.user.id,))
        contacts = list()
        rooms = list()

        for room in self.rooms[1:]:
            contact = room.members.exclude(username=self.user.username).first()
            contacts.append(contact)
            rooms.append(room)

        return contacts, rooms
           
                    

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

    async def connect(self):
        self.user = self.scope['user'] 
        
        if self.user.is_authenticated:
            self.broadcastName = f"{self.user}_ROOM"
            await (self.channel_layer.group_add)(self.broadcastName, self.channel_name)

        
        await self.accept()


    async def send_data(self, event):
        data = event["content"]
        # print(data)
        await self.send_json(data)


    async def disconnect(self, close_code):
        self.channel_layer.group_discard("broadcastName", self.channel_name)
        self.close()


    @action()
    async def new_chat(self, request_id, inputs, **kwargs):       
        content, message = await self.add_chat(inputs)
        print('content', content)
        resp = {"message": message}
       
        if content:
            channel = get_channel_layer()
            await channel.group_send(
                self.broadcastName,
                {"type": "send.data", "content": content}
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
                return None, message
            else:
                new_room = Room.objects.create(created_by=creator)             
                new_room.members.add(creator)
                new_room.members.add(new_contact)
                new_room.save()
                
                gp_send_content = dict()
                gp_send_content[str(new_room.id)] = {
                    "belongs_to": 'pv',
                    "profile": new_contact.profile.get_full_data,
                    "messages": [],
                    "unread_count": 0,
                }
                print(gp_send_content)
                if input_cname:
                    SavedContactName.objects.create(
                        user=new_contact,
                        chat=new_room,
                        saved_name=input_cname,
                    )
                    gp_send_content[str(new_room.id)]["profile"]["saved_name"] = input_cname
                else:
                    gp_send_content[str(new_room.id)]["profile"]["saved_name"] = new_contact.username
           
                
                return gp_send_content, message
        else:
            message = "entered phone number is either invalid or unverified!"
            return None, message



    @action()
    async def update_contact(self, request_id, inputs, **kwargs):       
        await self.update_contactDB(inputs)
       
        return inputs, status.HTTP_200_OK


    @database_sync_to_async
    def update_contactDB(self, inputs):
        contact = Room.objects.get(id=inputs.get('roomID')).members.exclude(username=self.user.username).first()
        SavedContactName.objects.filter(
            user=contact, 
            chat=inputs.get('roomID')
        ).update(saved_name=inputs.get('newCName'))
       

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

    async def connect(self):
        self.user = self.scope['user'] 
        if self.user.is_authenticated:
            self.broadcastName = f"{self.user}_MSG"
            await (self.channel_layer.group_add)(self.broadcastName, self.channel_name)

        await self.accept()


    async def send_data(self, event):
        data = event["content"]
        # print(data)
        await self.send_json(data)


    async def disconnect(self, close_code):
        self.channel_layer.group_discard("broadcastName", self.channel_name)
        self.close()


    @action()
    async def new_message(self, request_id, inputs, **kwargs):
        members, senderPic, messageID = await self.get_members(inputs)
        channel = get_channel_layer()

        for member in members:
            print('sending to ', member.username)
            inputs["senderPic"] = senderPic
            inputs["delivered_time"] = datetime.now().strftime('%H:%M')
            inputs["id"] = messageID
            inputs["status"] = "delivered"
            inputs["seen"] = False
            print(inputs)
            await channel.group_send(
                f"{member.username}_MSG",
                {"type": "send.data", "content": {"action": "new_message", "data": inputs}}
            )

        return inputs, status.HTTP_200_OK


    @database_sync_to_async
    def get_members(self, inputs, new_message=True):
        room = Room.objects.get(id=inputs.get('roomID'))
        members = room.members.all()

        if new_message:
            # pictures = [member.profile.picture.url for member in members]
            obj = Message.objects.create(
                room=room,
                sender=User.objects.get(username=inputs.get('sender')),
                content=inputs.get('content'),
                status="delivering",
            )
            return list(members), obj.sender.profile.picture.url, obj.id
        else:
            return members.exclude(username=self.user.username).first()


    @action()
    async def message_status(self, request_id, inputs, **kwargs):
        print(inputs)
        contact = await self.get_members(inputs, False)
        channel = get_channel_layer()
        if contact:
            await channel.group_send(
                f"{contact.username}_MSG",
                {"type": "send.data", "content": {"action": inputs.get("action"), "data": inputs}}
            )
       
        return inputs, status.HTTP_200_OK
       