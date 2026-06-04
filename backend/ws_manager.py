from fastapi import WebSocket
from typing import Dict, List


class WebSocketManager:
    def __init__(self):
        self.connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, order_id: int, websocket: WebSocket):
        await websocket.accept()
        if order_id not in self.connections:
            self.connections[order_id] = []
        self.connections[order_id].append(websocket)

    def disconnect(self, order_id: int, websocket: WebSocket):
        if order_id in self.connections:
            self.connections[order_id].remove(websocket)

    async def broadcast(self, order_id: int, message: dict):
        if order_id in self.connections:
            for ws in self.connections[order_id]:
                await ws.send_json(message)


manager = WebSocketManager()
