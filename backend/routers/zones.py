from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Zone, Agent
from schemas import ZoneOut

router = APIRouter(prefix="/zones", tags=["zones"])


@router.get("")
def list_zones(db: Session = Depends(get_db)):
    zones = db.query(Zone).all()
    result = []
    for z in zones:
        agent_count = db.query(func.count(Agent.agent_id)).filter(Agent.zone_id == z.zone_id).scalar()
        result.append({
            "zone_id": z.zone_id,
            "zone_name": z.zone_name,
            "avg_delivery_minutes": z.avg_delivery_minutes,
            "agent_count": agent_count
        })
    return result
