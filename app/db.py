from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        # Added serverSelectionTimeoutMS to fail faster if connection is blocked
        _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        
        # Explicitly target 'diabetes_cds' database. 
        # Some Atlas URIs don't include the db name in the string.
        _db = _client.get_database("diabetes_cds")
    return _db
