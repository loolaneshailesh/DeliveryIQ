from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import orders, agents, customers, zones, feedback, analytics
from ws_manager import manager

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DeliveryIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router)
app.include_router(agents.router)
app.include_router(customers.router)
app.include_router(zones.router)
app.include_router(feedback.router)
app.include_router(analytics.router)


@app.websocket("/ws/orders/{order_id}")
async def websocket_endpoint(websocket: WebSocket, order_id: int):
    await manager.connect(order_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(order_id, websocket)


@app.get("/")
def root():
    return {"message": "DeliveryIQ API is running"}
