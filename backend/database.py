from dotenv import load_dotenv
import os

load_dotenv()

# For local development, use SQLite
# For production with Supabase, use the Supabase client directly
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./janmitra.db")

def get_db():
    """Database connection - for Supabase use app.core.supabase instead"""
    pass
