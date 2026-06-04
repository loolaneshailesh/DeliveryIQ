from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class ZoneOut(BaseModel):
    zone_id: int
    zone_name: str
    avg_delivery_minutes: int
    model_config = {"from_attributes": True}


class CustomerCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None


class CustomerOut(BaseModel):
    customer_id: int
    name: str
    email: str
    phone: Optional[str] = None
    model_config = {"from_attributes": True}


class AgentCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    zone_id: int


class AgentOut(BaseModel):
    agent_id: int
    name: str
    phone: Optional[str] = None
    zone_id: int
    availability_status: str
    model_config = {"from_attributes": True}


class OrderItemCreate(BaseModel):
    item_name: str
    quantity: int = 1


class OrderCreate(BaseModel):
    customer_id: int
    zone_id: int
    delivery_address: str
    items: List[OrderItemCreate]


class OrderItemOut(BaseModel):
    item_id: int
    item_name: str
    quantity: int
    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    order_id: int
    customer_id: int
    zone_id: int
    status: str
    delivery_address: str
    created_at: datetime
    estimated_delivery_at: Optional[datetime] = None
    items: List[OrderItemOut] = []
    model_config = {"from_attributes": True}


class StatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None
    location_hint: Optional[str] = None
    agent_id: Optional[int] = None


class AssignAgent(BaseModel):
    agent_id: int


class FeedbackCreate(BaseModel):
    order_id: int
    rating: int
    comments: Optional[str] = None


class FeedbackOut(BaseModel):
    feedback_id: int
    order_id: int
    rating: int
    comments: Optional[str] = None
    sentiment: str
    model_config = {"from_attributes": True}


class AvailabilityUpdate(BaseModel):
    availability_status: str
