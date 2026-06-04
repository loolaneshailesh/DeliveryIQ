from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db, delivery_events
from models import Order, OrderItem, Zone, Customer, Assignment, Agent
from schemas import OrderCreate, StatusUpdate
from ws_manager import manager

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("")
async def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    zone = db.query(Zone).filter(Zone.zone_id == data.zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    eta = datetime.utcnow() + timedelta(minutes=zone.avg_delivery_minutes)

    order = Order(
        customer_id=data.customer_id,
        zone_id=data.zone_id,
        delivery_address=data.delivery_address,
        estimated_delivery_at=eta
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    for item in data.items:
        order_item = OrderItem(order_id=order.order_id, item_name=item.item_name, quantity=item.quantity)
        db.add(order_item)

    db.commit()

    await delivery_events.insert_one({
        "order_id": order.order_id,
        "event_type": "ORDER_PLACED",
        "status": "placed",
        "note": "Order placed successfully",
        "location_hint": data.delivery_address,
        "timestamp": datetime.utcnow().isoformat(),
        "updated_by": None
    })

    return {
        "order_id": order.order_id,
        "status": order.status,
        "estimated_delivery_at": order.estimated_delivery_at,
        "message": "Order created"
    }


@router.get("/{order_id}")
async def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()

    events_cursor = delivery_events.find({"order_id": order_id}, {"_id": 0})
    timeline = await events_cursor.to_list(length=100)

    assignment = db.query(Assignment).filter(Assignment.order_id == order_id).first()
    agent_name = None
    if assignment:
        agent = db.query(Agent).filter(Agent.agent_id == assignment.agent_id).first()
        if agent:
            agent_name = agent.name

    return {
        "order_id": order.order_id,
        "customer_id": order.customer_id,
        "zone_id": order.zone_id,
        "status": order.status,
        "delivery_address": order.delivery_address,
        "created_at": order.created_at,
        "estimated_delivery_at": order.estimated_delivery_at,
        "items": [{"item_name": i.item_name, "quantity": i.quantity} for i in items],
        "timeline": timeline,
        "assigned_agent": agent_name
    }


@router.get("/status/{zone_id}")
def get_orders_by_zone(zone_id: int, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.zone_id == zone_id).all()
    return [{"order_id": o.order_id, "status": o.status, "delivery_address": o.delivery_address} for o in orders]


@router.get("/{order_id}/suggest-agent")
def suggest_agent(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    agents = db.query(Agent).filter(
        Agent.zone_id == order.zone_id,
        Agent.availability_status == "available"
    ).all()

    if not agents:
        return {"suggested_agent": None, "message": "No available agents in this zone"}

    best = None
    min_assignments = float("inf")
    for agent in agents:
        count = (
            db.query(func.count(Assignment.assignment_id))
            .join(Order, Order.order_id == Assignment.order_id)
            .filter(Assignment.agent_id == agent.agent_id, Order.status != "delivered")
            .scalar()
        )
        if count < min_assignments:
            min_assignments = count
            best = agent

    return {
        "suggested_agent": {
            "agent_id": best.agent_id,
            "name": best.name,
            "active_assignments": min_assignments
        }
    }


@router.post("/{order_id}/assign")
async def assign_agent(order_id: int, data: dict, db: Session = Depends(get_db)):
    agent_id = data.get("agent_id")
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.zone_id != order.zone_id:
        raise HTTPException(status_code=400, detail="Agent is not in the same zone as the order")

    if agent.availability_status != "available":
        raise HTTPException(status_code=400, detail="Agent is not available")

    existing = db.query(Assignment).filter(Assignment.order_id == order_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Order already assigned")

    assignment = Assignment(order_id=order_id, agent_id=agent_id)
    db.add(assignment)
    agent.availability_status = "busy"
    order.status = "assigned"
    db.commit()

    await delivery_events.insert_one({
        "order_id": order_id,
        "event_type": "ASSIGNMENT",
        "status": "assigned",
        "note": f"Assigned to agent {agent.name}",
        "location_hint": None,
        "timestamp": datetime.utcnow().isoformat(),
        "updated_by": agent_id
    })

    await manager.broadcast(order_id, {"status": "assigned", "agent": agent.name})

    return {"message": "Agent assigned successfully"}


@router.patch("/{order_id}/status")
async def update_status(order_id: int, data: StatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = data.status
    db.commit()

    event_type = "DELIVERY_COMPLETE" if data.status == "delivered" else "STATUS_UPDATE"

    await delivery_events.insert_one({
        "order_id": order_id,
        "event_type": event_type,
        "status": data.status,
        "note": data.note or "",
        "location_hint": data.location_hint or "",
        "timestamp": datetime.utcnow().isoformat(),
        "updated_by": data.agent_id
    })

    if data.status == "delivered":
        assignment = db.query(Assignment).filter(Assignment.order_id == order_id).first()
        if assignment:
            agent = db.query(Agent).filter(Agent.agent_id == assignment.agent_id).first()
            if agent:
                agent.availability_status = "available"
                db.commit()

    await manager.broadcast(order_id, {"status": data.status, "note": data.note})

    return {"message": "Status updated"}
