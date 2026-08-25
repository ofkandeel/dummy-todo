import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List
from jwtutils import verify_clerk_token, jwks_client

# Load environment variables
load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=0)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database model
class Todo(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, index=True)
    completed = Column(Boolean, default=False)
    user_id = Column(String, index=True)

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

# ─── AUTHENTICATION SETUP ──────────────────────────────────────────

security = HTTPBearer()

async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    token = credentials.credentials
    try:
        payload = verify_clerk_token(token)
        if not payload:
            # Return the actual error message in the response
            raise HTTPException(status_code=401, detail="Token validation failed (see server logs)")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
        return user_id
    except Exception as e:
        # Log the error and return it to the client
        print(f"❌ Auth error: {e}")
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")
    
# ─── DEPENDENCIES ──────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── PUBLIC ENDPOINTS ──────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/db-test")
def db_test():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return {"status": "success", "result": result.scalar()}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/debug-token")
async def debug_token(user_id: str = Depends(get_current_user_id)):
    return {
        "message": "Token is valid",
        "user_id": user_id
    }

@app.get("/test-jwks")
async def test_jwks():
    try:
        # Fetch the JWKS keys
        jwks = jwks_client.get_jwk_set()
        
        # Access the keys as a dictionary (PyJWKSet has a 'keys' attribute)
        if hasattr(jwks, 'keys'):
            keys = jwks.keys
        else:
            keys = []
            
        return {
            "status": "success",
            "keys": len(keys),
            "first_key": str(keys[0]) if keys else None,
            "key_ids": [key.key_id for key in keys] if keys else []
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "type": type(jwks).__name__ if 'jwks' in locals() else "unknown"
        }

# ─── PROTECTED ENDPOINTS ──────────────────────────────────────────

@app.get("/todos")
def get_todos(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    return db.query(Todo).filter(Todo.user_id == user_id).all()

@app.post("/todos", response_model=TodoResponse)
def create_todo(
    todo: TodoCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    db_todo = Todo(
        title=todo.title,
        description=todo.description,
        completed=todo.completed,
        user_id=user_id
    )
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@app.put("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    todo: TodoCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
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

@app.delete("/todos/{todo_id}")
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    db_todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(db_todo)
    db.commit()
    return {"message": "Todo deleted successfully"}