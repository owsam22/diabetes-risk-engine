from flask import Flask, request, jsonify, Response
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from datetime import datetime, timezone
import pandas as pd
import joblib
import requests
import os
import csv
import io
import json
from dotenv import load_dotenv
from db import get_db

load_dotenv()

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-change-me")
CORS(app)  # Allow all origins for production compatibility

jwt = JWTManager(app)

# Load ML model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, "../model/rf_diabetes_model_compressed.pkl"))
train_cols = joblib.load(os.path.join(BASE_DIR, "../model/train_columns.pkl"))

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = "openai/gpt-oss-120b:free"


# ─── Helpers ────────────────────────────────────────────────────────────────

def serialize_doc(doc):
    """Convert MongoDB doc to JSON-serialisable dict."""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if "user_id" in doc:
        doc["user_id"] = str(doc["user_id"])
    if "created_at" in doc and isinstance(doc["created_at"], datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


def get_ai_suggestions(patient_data: dict, risk_result: dict) -> dict:
    """
    Call OpenRouter to get structured AI suggestions split by category.
    Returns: { diet: [...], exercise: [...], lifestyle: [...] }
    """
    try:
        risk_label = "High" if risk_result["prediction"] == 1 else "Low"
        prompt = f"""You are a medical AI assistant. A patient has been assessed for diabetes risk.

Patient Data:
- Gender: {patient_data['gender']}, Age: {patient_data['age']}
- BMI: {patient_data['bmi']}, HbA1c: {patient_data['HbA1c_level']}%, Blood Glucose: {patient_data['blood_glucose_level']} mg/dL
- Hypertension: {'Yes' if patient_data['hypertension'] else 'No'}, Heart Disease: {'Yes' if patient_data['heart_disease'] else 'No'}
- Smoking: {patient_data['smoking_history']}
- Risk Score: {risk_result['risk_score']:.1%} ({risk_label} Risk)

Return a JSON object with exactly these 3 keys: "diet", "exercise", "lifestyle".
Each key maps to an array of 3 short, actionable, friendly tips (strings).
For {risk_label} risk patients, {'suggest immediate corrective actions' if risk_label == 'High' else 'focus on preventive and maintenance steps'}.
Respond ONLY with the raw JSON object, no markdown, no extra text."""

        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"}
        }
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers, json=payload, timeout=20
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        suggestions = json.loads(content)

        # Ensure all keys exist
        return {
            "diet": suggestions.get("diet", []),
            "exercise": suggestions.get("exercise", []),
            "lifestyle": suggestions.get("lifestyle", [])
        }

    except Exception as e:
        print("OpenRouter API error:", e)
        return {
            "diet": ["Maintain a balanced diet rich in vegetables and whole grains."],
            "exercise": ["Aim for at least 30 minutes of moderate exercise daily."],
            "lifestyle": ["Monitor your blood sugar regularly and stay hydrated."]
        }


# ─── Auth Routes ────────────────────────────────────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    db = get_db()
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password required"}), 400

    email = data["email"].lower().strip()

    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    user_doc = {
        "email": email,
        "name": data.get("name", email.split("@")[0]),
        "password_hash": generate_password_hash(data["password"]),
        "created_at": datetime.now(timezone.utc)
    }
    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = create_access_token(identity=user_id)
    return jsonify({
        "token": token,
        "user": {"id": user_id, "email": email, "name": user_doc["name"]}
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    db = get_db()
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password required"}), 400

    email = data["email"].lower().strip()
    user = db.users.find_one({"email": email})

    if not user or not check_password_hash(user["password_hash"], data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    user_id = str(user["_id"])
    token = create_access_token(identity=user_id)
    return jsonify({
        "token": token,
        "user": {"id": user_id, "email": user["email"], "name": user.get("name", email)}
    })


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    db = get_db()
    user_id = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"id": str(user["_id"]), "email": user["email"], "name": user.get("name", "")})


# ─── Prediction Route ────────────────────────────────────────────────────────

@app.route("/api/predict", methods=["POST"])
@jwt_required()
def predict():
    db = get_db()
    user_id = get_jwt_identity()
    data = request.get_json()

    # Validate required fields
    required = ["gender", "age", "hypertension", "heart_disease",
                "smoking_history", "bmi", "HbA1c_level", "blood_glucose_level"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    patient_data = {
        "gender": data["gender"],
        "age": int(data["age"]),
        "hypertension": int(data["hypertension"]),
        "heart_disease": int(data["heart_disease"]),
        "smoking_history": data["smoking_history"],
        "bmi": float(data["bmi"]),
        "HbA1c_level": float(data["HbA1c_level"]),
        "blood_glucose_level": float(data["blood_glucose_level"])
    }

    # Run ML model
    df = pd.DataFrame([patient_data])
    df = pd.get_dummies(df)
    df = df.reindex(columns=train_cols, fill_value=0)

    prob = model.predict_proba(df)[:, 1][0]
    pred = int(prob > 0.3)
    result = {"prediction": pred, "risk_score": float(prob)}

    # Get AI suggestions
    ai_suggestions = get_ai_suggestions(patient_data, result)

    # Save to MongoDB
    assessment_doc = {
        "user_id": ObjectId(user_id),
        **patient_data,
        "prediction": pred,
        "risk_score": float(prob),
        "ai_suggestions": ai_suggestions,
        "created_at": datetime.now(timezone.utc)
    }
    inserted = db.assessments.insert_one(assessment_doc)

    return jsonify({
        "id": str(inserted.inserted_id),
        "prediction": pred,
        "risk_score": float(prob),
        "ai_suggestions": ai_suggestions,
        "created_at": assessment_doc["created_at"].isoformat()
    })


# ─── What-If Simulation Route (no save, no AI) ──────────────────────────────

@app.route("/api/simulate", methods=["POST"])
@jwt_required()
def simulate():
    data = request.get_json()
    required = ["gender", "age", "hypertension", "heart_disease",
                "smoking_history", "bmi", "HbA1c_level", "blood_glucose_level"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    patient_data = {
        "gender": data["gender"],
        "age": int(data["age"]),
        "hypertension": int(data["hypertension"]),
        "heart_disease": int(data["heart_disease"]),
        "smoking_history": data["smoking_history"],
        "bmi": float(data["bmi"]),
        "HbA1c_level": float(data["HbA1c_level"]),
        "blood_glucose_level": float(data["blood_glucose_level"])
    }

    df = pd.DataFrame([patient_data])
    df = pd.get_dummies(df)
    df = df.reindex(columns=train_cols, fill_value=0)

    prob = model.predict_proba(df)[:, 1][0]
    pred = int(prob > 0.3)

    return jsonify({"prediction": pred, "risk_score": float(prob)})


# ─── History Route ───────────────────────────────────────────────────────────

@app.route("/api/history", methods=["GET"])
@jwt_required()
def history():
    db = get_db()
    user_id = get_jwt_identity()

    assessments = list(db.assessments.find(
        {"user_id": ObjectId(user_id)},
        sort=[("created_at", -1)]
    ))
    return jsonify([serialize_doc(a) for a in assessments])


# ─── CSV Export ──────────────────────────────────────────────────────────────

@app.route("/api/export/csv", methods=["GET"])
@jwt_required()
def export_csv():
    db = get_db()
    user_id = get_jwt_identity()

    assessments = list(db.assessments.find(
        {"user_id": ObjectId(user_id)},
        sort=[("created_at", 1)]
    ))

    output = io.StringIO()
    fieldnames = ["created_at", "gender", "age", "hypertension", "heart_disease",
                  "smoking_history", "bmi", "HbA1c_level", "blood_glucose_level",
                  "prediction", "risk_score"]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for a in assessments:
        row = serialize_doc(a)
        row["prediction"] = "High Risk" if row["prediction"] == 1 else "Low Risk"
        row["risk_score"] = f"{float(row['risk_score']) * 100:.2f}%"
        writer.writerow(row)

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=diabetes_history.csv"}
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)