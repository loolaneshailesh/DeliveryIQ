import os
from collections import defaultdict
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://deliveryiq:password@localhost:5432/deliveryiq")

engine = create_engine(POSTGRES_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class FakeCollection:
    def __init__(self):
        self._docs = []

    async def insert_one(self, doc):
        self._docs.append(doc)

    def find(self, query=None, projection=None):
        return FakeCursor(self._filter(query))

    def _filter(self, query):
        if not query:
            return list(self._docs)
        return [doc for doc in self._docs if all(doc.get(k) == v for k, v in query.items())]


class FakeCursor:
    def __init__(self, docs):
        self._docs = docs

    async def to_list(self, length=100):
        return self._docs[:length]


class FakeDB:
    def __init__(self):
        self._cols = defaultdict(FakeCollection)

    def __getitem__(self, name):
        return self._cols[name]


mongo_db = FakeDB()
delivery_events = mongo_db["delivery_events"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
