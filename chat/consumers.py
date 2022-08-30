from djangochannelsrestframework.generics import AsyncAPIConsumer, GenericAsyncAPIConsumer
from djangochannelsrestframework.decorators import action
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
        await self.accept()


    async def send_data(self, event):
        data = event["content"]
        # print(data)
        await self.send_json(data)


    async def disconnect(self, close_code):
        self.channel_layer.group_discard("broadcastName", self.channel_name)
        self.close()


    @action()
    async def gp_send(self, request_id, user_pk, content, **kwargs):
        await self.channel.group_send(
            f"_{self.user}_", 
            {"type": "send.data", "content": content}
        )
        return {'response with': 'some message'}, status.HTTP_200_OK



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

  