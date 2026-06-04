import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://postgres:password@localhost:5432/deliveryiq")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

engine = create_engine(POSTGRES_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

mongo_client = AsyncIOMotorClient(MONGO_URL)
mongo_db = mongo_client["deliveryiq"]
delivery_events = mongo_db["delivery_events"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
