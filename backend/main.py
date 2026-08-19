import os
import base64
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Boolean, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel
from typing import List
import jwt

# Load environment variables
load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=0)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Supabase configuration
SUPABASE_URL = "https://uzhxkwavsumrzrmnitin.supabase.co"

# Public key - hardcoded for testing on render
PUBLIC_KEY = """-----BEGIN PUBLIC KEY-----
LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0RRZ0FFWDRySmREZ0c2T3h3QVZIZG1NOHE4dGI5L1JtOQovVW1uZDNSRU1Nb2Y2d3hjZnBqWjg1d0pUMmVmbUJGVCtkSFphNzVnQ2xwTWh1WnVFRnB6OWJXMFB3PT0KLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t
-----END PUBLIC KEY-----"""
print("✅ Public key hardcoded successfully")

# Get the public key from environment (base64-encoded)
# public_key_b64 = os.getenv("SUPABASE_PUBLIC_KEY_B64")
#if not public_key_b64:
#    raise ValueError("SUPABASE_PUBLIC_KEY_B64 environment variable is not set")
#
#try:
#    decoded_bytes = base64.b64decode(public_key_b64)
#    PUBLIC_KEY = decoded_bytes.decode('utf-8')
#    print("✅ Public key loaded successfully")
#except UnicodeDecodeError as e:
#    print(f"❌ Error decoding public key: {e}")
#    raise

# Database model
class Todo(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, index=True)
    completed = Column(Boolean, default=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)

# Pydantic schemas
class TodoCreate(BaseModel):
    title: str
    description: str
    completed: bool = False

class TodoResponse(BaseModel):
    id: int
    title: str
    description: str
    completed: bool

    class Config:
        from_attributes = True

# FastAPI app
app = FastAPI(title="Todo API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://dummy-todo-2.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # First, decode without verification to see the algorithm
        unverified_header = jwt.get_unverified_header(token)
        print(f"🔍 Token algorithm: {unverified_header.get('alg')}")
        
        # Now verify with the public key
        payload = jwt.decode(
            token,
            PUBLIC_KEY,
            algorithms=["ES256", "HS256"],  # Try both algorithms
            options={"verify_aud": False}
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except jwt.InvalidTokenError as e:
        print(f"❌ Invalid token error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        
# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Health check (public)
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Get all todos for the current user
@app.get("/todos", response_model=List[TodoResponse])
def get_todos(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Todo).filter(Todo.user_id == user_id).all()

# Create a new todo for the current user
@app.post("/todos", response_model=TodoResponse)
def create_todo(
    todo: TodoCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_todo = Todo(**todo.dict(), user_id=user_id)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

# Update a todo (ensuring it belongs to the user)
@app.put("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    todo: TodoCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db_todo.title = todo.title
    db_todo.description = todo.description
    db_todo.completed = todo.completed
    db.commit()
    db.refresh(db_todo)
    return db_todo

# Delete a todo (ensuring it belongs to the user)
@app.delete("/todos/{todo_id}")
def delete_todo(
    todo_id: int,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(db_todo)
    db.commit()
    return {"message": "Todo deleted successfully"}

# Test endpoint (public)
@app.get("/db-test")
def db_test():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return {"status": "success", "result": result.scalar()}
    except Exception as e:
        return {"status": "error", "error": str(e)}