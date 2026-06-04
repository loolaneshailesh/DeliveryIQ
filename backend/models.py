from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum


class AvailabilityStatus(str, enum.Enum):
    available = "available"
    busy = "busy"
    offline = "offline"


class SentimentType(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class Zone(Base):
    __tablename__ = "zones"
    zone_id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String, nullable=False)
    avg_delivery_minutes = Column(Integer, default=30)
    agents = relationship("Agent", back_populates="zone")
    orders = relationship("Order", back_populates="zone")


class Customer(Base):
    __tablename__ = "customers"
    customer_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String)
    orders = relationship("Order", back_populates="customer")


class Agent(Base):
    __tablename__ = "agents"
    agent_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String)
    zone_id = Column(Integer, ForeignKey("zones.zone_id"))
    availability_status = Column(Enum(AvailabilityStatus), default=AvailabilityStatus.available)
    zone = relationship("Zone", back_populates="agents")
    assignments = relationship("Assignment", back_populates="agent")


class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    zone_id = Column(Integer, ForeignKey("zones.zone_id"))
    status = Column(String, default="placed")
    delivery_address = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    estimated_delivery_at = Column(DateTime)
    customer = relationship("Customer", back_populates="orders")
    zone = relationship("Zone", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    assignments = relationship("Assignment", back_populates="order")
    feedback = relationship("Feedback", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"
    item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    item_name = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    order = relationship("Order", back_populates="items")


class Assignment(Base):
    __tablename__ = "assignments"
    assignment_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    agent_id = Column(Integer, ForeignKey("agents.agent_id"))
    assigned_at = Column(DateTime, default=datetime.utcnow)
    order = relationship("Order", back_populates="assignments")
    agent = relationship("Agent", back_populates="assignments")


class Feedback(Base):
    __tablename__ = "feedback"
    feedback_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), unique=True)
    rating = Column(Integer)
    comments = Column(String)
    sentiment = Column(Enum(SentimentType), default=SentimentType.neutral)
    order = relationship("Order", back_populates="feedback")
