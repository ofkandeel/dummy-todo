# backend/migrate.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base

# Load environment variables from .env
load_dotenv()

# Get the database URL (default to SQLite if not set)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")
print(f"🚀 Running migration on: {DATABASE_URL}")

# Create engine
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

Base = declarative_base()

# Define the Todo model (must match your main.py model)
class Todo(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, index=True)
    completed = Column(Boolean, default=False)

# Create tables
print("📦 Creating tables...")
Base.metadata.create_all(engine)
print("✅ Tables created successfully!")