from flask import Flask, render_template, request
import pandas as pd
import joblib
import requests
import os
from dotenv import load_dotenv

load_dotenv()  # load environment variables from .env

app = Flask(__name__)

# Load your risk model
model = joblib.load("../model/rf_diabetes_model.pkl")
train_cols = joblib.load("../model/train_columns.pkl")  # X_train columns

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = "openai/gpt-oss-120b:free"

def get_ai_suggestions(patient_data, risk_result):
    """
    Call OpenRouter API to get AI suggestions/tips based on patient info and risk result
    """
    try:
        # Build prompt
        prompt = f"""
        You are a health assistant. Based on the patient data and diabetes risk, give 3 concise, practical tips for the patient.
        Patient Data: {patient_data}
        Risk Score: {risk_result['risk_score']:.2f} ({'High' if risk_result['prediction']==1 else 'Low'})
        Tips should be actionable, friendly, and safe advice.
        """

        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "reasoning": {"enabled": True}
        }

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.post("https://openrouter.ai/api/v1/chat/completions",
                                 headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        # Extract assistant message content
        ai_message = data['choices'][0]['message']['content']

        # Split into lines for the template
        tips = [line.strip("-• \n") for line in ai_message.split("\n") if line.strip()]
        return tips[:5]  # limit to max 5 tips

    except Exception as e:
        print("OpenRouter API error:", e)
        return ["Could not fetch AI suggestions at this time."]


@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    ai_tips = None
    form_data = {}
    if request.method == "POST":
        # Collect form data
        form_data = {
            "gender": request.form["gender"],
            "age": int(request.form["age"]),
            "hypertension": int(request.form["hypertension"]),
            "heart_disease": int(request.form["heart_disease"]),
            "smoking_history": request.form["smoking_history"],
            "bmi": float(request.form["bmi"]),
            "HbA1c_level": float(request.form["HbA1c_level"]),
            "blood_glucose_level": float(request.form["blood_glucose_level"])
        }

        # Predict risk
        df = pd.DataFrame([form_data])
        df = pd.get_dummies(df)
        df = df.reindex(columns=train_cols, fill_value=0)

        prob = model.predict_proba(df)[:,1][0]
        pred = int(prob > 0.3)
        result = {"prediction": pred, "risk_score": prob}

        # Fetch AI suggestions
        ai_tips = get_ai_suggestions(form_data, result)

    return render_template("index.html", result=result, ai_tips=ai_tips, form_data=form_data)


if __name__ == "__main__":
    app.run(debug=True)