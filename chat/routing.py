from django.urls import path

from .consumers import ChatConsumer, RoomConsumer, MessageConsumer


ws_urlpatterns = [
    path("ws/", ChatConsumer.as_asgi()),
    path("ws/room/", RoomConsumer.as_asgi()),
    path("ws/message/", MessageConsumer.as_asgi()),
]