import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
print("Testing imports...")
from ml.models import summarize_text
print("ml.models imported successfully")
from services.vector_store import vector_store
print("vector_store imported successfully")
