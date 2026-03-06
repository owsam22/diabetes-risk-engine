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

import random


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


def get_custom_suggestions(patient_data: dict, risk_result: dict) -> dict:
    """
    Generate personalized health suggestions based on patient data.
    """
    bmi = patient_data['bmi']
    glucose = patient_data['blood_glucose_level']
    hba1c = patient_data['HbA1c_level']
    age = patient_data['age']
    is_high_risk = risk_result["prediction"] == 1

    # Define pools of suggestions
    diet_pools = {
        "general": [
            "Prioritize whole, unprocessed foods like vegetables, lean proteins, and whole grains.",
            "Practice portion control by using smaller plates and listening to hunger cues.",
            "Stay hydrated primarily with water instead of sugary drinks or juices.",
            "Include a source of fiber in every meal to help regulate blood sugar."
        ],
        "high_glucose": [
            "Limit high-glycemic foods like white bread, sugary cereals, and sweets.",
            "Focus on non-starchy vegetables (leafy greens, broccoli, peppers) for most meals.",
            "Consider a low-carbohydrate approach to help stabilize blood glucose levels.",
            "Avoid late-night snacking, especially foods high in refined sugars."
        ],
        "high_bmi": [
            "Reduce calorie-dense foods and focus on nutrient-rich, lower-calorie options.",
            "Try to cook more meals at home to better control ingredients and portions.",
            "Incorporate healthy fats like avocados and nuts in moderation.",
            "Slow down while eating to allow your brain to register fullness."
        ]
    }

    exercise_pools = {
        "general": [
            "Aim for at least 150 minutes of moderate-intensity aerobic activity per week.",
            "Incorporate strength training exercises at least two days a week.",
            "Find physical activities you enjoy, like walking, swimming, or cycling.",
            "Break up long periods of sitting with short walks or stretching."
        ],
        "high_bmi": [
            "Start with low-impact exercises like swimming or brisk walking to protect joints.",
            "Use a pedometer or fitness tracker to aim for a daily step goal, starting small.",
            "Focus on consistency rather than intensity when starting a new routine.",
            "Consider working with a fitness professional to develop a safe, effective plan."
        ],
        "senior": [
            "Focus on balance and flexibility exercises to prevent falls.",
            "Engage in low-impact activities like Tai Chi or water aerobics.",
            "Maintain muscle mass through gentle resistance band exercises.",
            "Consult with a doctor before starting a new, vigorous exercise program."
        ]
    }

    lifestyle_pools = {
        "general": [
            "Prioritize 7-9 hours of quality sleep each night for metabolic health.",
            "Manage stress through techniques like meditation, deep breathing, or hobbies.",
            "Schedule regular check-ups with your healthcare provider for monitoring.",
            "Maintain a consistent daily routine for meals, exercise, and sleep."
        ],
        "smoker": [
            "Seek support and resources to develop a plan for quitting smoking.",
            "Avoid environments that trigger the urge to smoke.",
            "Remind yourself of the long-term health benefits of being smoke-free.",
            "Consider nicotine replacement therapy after consulting with a physician."
        ],
        "high_risk": [
            "Monitor your blood glucose levels regularly as recommended by your doctor.",
            "Keep a detailed log of your diet, activity, and glucose readings.",
            "Educate yourself and your family about the early signs of diabetes.",
            "Follow your prescribed medical plan strictly and report any changes to your doctor."
        ]
    }

    # Selection Logic
    selected_diet = []
    selected_exercise = []
    selected_lifestyle = []

    # Diet Selection
    if glucose > 140 or hba1c > 6.0:
        selected_diet.extend(random.sample(diet_pools["high_glucose"], 2))
        selected_diet.append(random.choice(diet_pools["general"]))
    elif bmi > 25:
        selected_diet.extend(random.sample(diet_pools["high_bmi"], 2))
        selected_diet.append(random.choice(diet_pools["general"]))
    else:
        selected_diet.extend(random.sample(diet_pools["general"], 3))

    # Exercise Selection
    if age > 60:
        selected_exercise.extend(random.sample(exercise_pools["senior"], 2))
        selected_exercise.append(random.choice(exercise_pools["general"]))
    elif bmi > 30:
        selected_exercise.extend(random.sample(exercise_pools["high_bmi"], 2))
        selected_exercise.append(random.choice(exercise_pools["general"]))
    else:
        selected_exercise.extend(random.sample(exercise_pools["general"], 3))

    # Lifestyle Selection
    if patient_data['smoking_history'] not in ['never', 'No Info']:
        selected_lifestyle.append(random.choice(lifestyle_pools["smoker"]))
        if is_high_risk:
            selected_lifestyle.append(random.choice(lifestyle_pools["high_risk"]))
        selected_lifestyle.append(random.choice(lifestyle_pools["general"]))
    elif is_high_risk:
        selected_lifestyle.extend(random.sample(lifestyle_pools["high_risk"], 2))
        selected_lifestyle.append(random.choice(lifestyle_pools["general"]))
    else:
        selected_lifestyle.extend(random.sample(lifestyle_pools["general"], 3))

    # Ensure uniqueness and variety
    return {
        "diet": list(dict.fromkeys(selected_diet))[:3],
        "exercise": list(dict.fromkeys(selected_exercise))[:3],
        "lifestyle": list(dict.fromkeys(selected_lifestyle))[:3]
    }


# ─── Auth Routes ────────────────────────────────────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
@app.route("/auth/register", methods=["POST"])
def register():
    db = get_db()
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password required"}), 400

    email = data["email"].lower().strip()

    try:
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
    except Exception as e:
        print(f"Registration Error: {e}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


@app.route("/api/auth/login", methods=["POST"])
@app.route("/auth/login", methods=["POST"])
def login():
    db = get_db()
    data = request.get_json()

    try:
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
    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


@app.route("/api/auth/me", methods=["GET"])
@app.route("/auth/me", methods=["GET"])
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
@app.route("/predict", methods=["POST"])
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

    # Defer AI suggestions to separate request
    ai_suggestions = None

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


@app.route("/api/suggestions/<assessment_id>", methods=["POST"])
@jwt_required()
def generate_suggestions(assessment_id):
    db = get_db()
    user_id = get_jwt_identity()

    try:
        assessment = db.assessments.find_one({
            "_id": ObjectId(assessment_id),
            "user_id": ObjectId(user_id)
        })

        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404

        # If already has suggestions, just return it
        if assessment.get("ai_suggestions"):
            return jsonify(assessment["ai_suggestions"])

        # Prepare data for AI call
        patient_data = {
            "gender": assessment["gender"],
            "age": assessment["age"],
            "hypertension": assessment["hypertension"],
            "heart_disease": assessment["heart_disease"],
            "smoking_history": assessment["smoking_history"],
            "bmi": assessment["bmi"],
            "HbA1c_level": assessment["HbA1c_level"],
            "blood_glucose_level": assessment["blood_glucose_level"]
        }
        risk_result = {
            "prediction": assessment["prediction"],
            "risk_score": assessment["risk_score"]
        }

        # Call Custom Suggestion Engine
        ai_suggestions = get_custom_suggestions(patient_data, risk_result)

        # Update document
        db.assessments.update_one(
            {"_id": ObjectId(assessment_id)},
            {"$set": {"ai_suggestions": ai_suggestions}}
        )

        return jsonify(ai_suggestions)

    except Exception as e:
        print(f"Error generating suggestions: {e}")
        return jsonify({"error": "Failed to generate suggestions", "details": str(e)}), 500


# ─── What-If Simulation Route (no save, no AI) ──────────────────────────────

@app.route("/api/simulate", methods=["POST"])
@app.route("/simulate", methods=["POST"])
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
@app.route("/history", methods=["GET"])
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
@app.route("/export/csv", methods=["GET"])
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