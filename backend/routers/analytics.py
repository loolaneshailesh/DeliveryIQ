from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
from models import Order, Agent, Assignment, Feedback, Zone

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    status_counts = db.query(Order.status, func.count(Order.order_id)).group_by(Order.status).all()

    today = datetime.utcnow().date()
    daily_counts = (
        db.query(func.date(Order.created_at), func.count(Order.order_id))
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )

    return {
        "by_status": {status: count for status, count in status_counts},
        "daily": [{"date": str(d), "count": c} for d, c in daily_counts]
    }


@router.get("/zone-heatmap")
def zone_heatmap(db: Session = Depends(get_db)):
    zones = db.query(Zone).all()
    result = []
    for zone in zones:
        total = db.query(func.count(Order.order_id)).filter(Order.zone_id == zone.zone_id).scalar()
        result.append({
            "zone_id": zone.zone_id,
            "zone_name": zone.zone_name,
            "total_deliveries": total,
            "avg_delivery_minutes": zone.avg_delivery_minutes
        })
    return result


@router.get("/agent-leaderboard")
def agent_leaderboard(db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    result = []
    for agent in agents:
        completed = (
            db.query(func.count(Assignment.assignment_id))
            .join(Order, Order.order_id == Assignment.order_id)
            .filter(Assignment.agent_id == agent.agent_id, Order.status == "delivered")
            .scalar()
        )
        avg_rating = (
            db.query(func.avg(Feedback.rating))
            .join(Order, Order.order_id == Feedback.order_id)
            .join(Assignment, Assignment.order_id == Order.order_id)
            .filter(Assignment.agent_id == agent.agent_id)
            .scalar()
        )
        result.append({
            "agent_id": agent.agent_id,
            "name": agent.name,
            "completed_deliveries": completed,
            "avg_rating": round(float(avg_rating), 1) if avg_rating else None
        })
    result.sort(key=lambda x: x["completed_deliveries"], reverse=True)
    return result


@router.get("/peak-hours")
def peak_hours(db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=7)
    rows = (
        db.query(func.extract("hour", Order.created_at).label("hour"), func.count(Order.order_id))
        .filter(Order.created_at >= since)
        .group_by("hour")
        .order_by("hour")
        .all()
    )
    return [{"hour": int(h), "count": c} for h, c in rows]


@router.get("/sentiment-breakdown")
def sentiment_breakdown(db: Session = Depends(get_db)):
    rows = db.query(Feedback.sentiment, func.count(Feedback.feedback_id)).group_by(Feedback.sentiment).all()
    return {s: c for s, c in rows}
