from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Agent, Assignment, Order, Zone
from schemas import AgentCreate, AgentOut, AvailabilityUpdate

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("")
def list_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    result = []
    for agent in agents:
        active_count = (
            db.query(func.count(Assignment.assignment_id))
            .join(Order, Order.order_id == Assignment.order_id)
            .filter(Assignment.agent_id == agent.agent_id, Order.status != "delivered")
            .scalar()
        )
        zone = db.query(Zone).filter(Zone.zone_id == agent.zone_id).first()
        result.append({
            "agent_id": agent.agent_id,
            "name": agent.name,
            "phone": agent.phone,
            "zone_id": agent.zone_id,
            "zone_name": zone.zone_name if zone else None,
            "availability_status": agent.availability_status,
            "active_assignments": active_count
        })
    return result


@router.post("", response_model=AgentOut)
def create_agent(data: AgentCreate, db: Session = Depends(get_db)):
    agent = Agent(**data.model_dump())
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get("/{agent_id}/orders")
def get_agent_orders(agent_id: int, db: Session = Depends(get_db)):
    assignments = db.query(Assignment).filter(Assignment.agent_id == agent_id).all()
    result = []
    for a in assignments:
        order = db.query(Order).filter(Order.order_id == a.order_id).first()
        if order:
            result.append({
                "order_id": order.order_id,
                "status": order.status,
                "delivery_address": order.delivery_address,
                "assigned_at": a.assigned_at
            })
    return result


@router.patch("/{agent_id}/availability")
def update_availability(agent_id: int, data: AvailabilityUpdate, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.availability_status = data.availability_status
    db.commit()
    return {"message": "Availability updated", "status": data.availability_status}
