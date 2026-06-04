from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Feedback, Order
from schemas import FeedbackCreate, FeedbackOut
from sentiment import classify_sentiment

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackOut)
def submit_feedback(data: FeedbackCreate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status != "delivered":
        raise HTTPException(status_code=400, detail="Feedback can only be submitted after delivery")

    existing = db.query(Feedback).filter(Feedback.order_id == data.order_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this order")

    sentiment = classify_sentiment(data.comments or "")

    feedback = Feedback(
        order_id=data.order_id,
        rating=data.rating,
        comments=data.comments,
        sentiment=sentiment
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/order/{order_id}", response_model=FeedbackOut)
def get_feedback(order_id: int, db: Session = Depends(get_db)):
    feedback = db.query(Feedback).filter(Feedback.order_id == order_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback
