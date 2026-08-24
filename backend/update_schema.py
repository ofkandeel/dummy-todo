from main import engine
from sqlalchemy import text

def add_user_id_column():
    with engine.connect() as conn:
        # Check if column exists (PostgreSQL)
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='todos' AND column_name='user_id'
        """))
        if not result.fetchone():
            conn.execute(text("ALTER TABLE todos ADD COLUMN user_id VARCHAR"))
            conn.commit()
            print("✅ Added user_id column to todos table")
        else:
            print("ℹ️ user_id column already exists")

if __name__ == "__main__":
    add_user_id_column() 