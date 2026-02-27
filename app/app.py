from flask import Flask, render_template, request
import pandas as pd
import joblib

app = Flask(__name__)
model = joblib.load("../model/rf_diabetes_model.pkl")  # adjust path

@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    if request.method == "POST":
        # Collect form data
        patient = {
            "gender": request.form["gender"],
            "age": int(request.form["age"]),
            "hypertension": int(request.form["hypertension"]),
            "heart_disease": int(request.form["heart_disease"]),
            "smoking_history": request.form["smoking_history"],
            "bmi": float(request.form["bmi"]),
            "HbA1c_level": float(request.form["HbA1c_level"]),
            "blood_glucose_level": float(request.form["blood_glucose_level"])
        }

        # Predict
        df = pd.DataFrame([patient])
        df = pd.get_dummies(df)
        # Align columns
        train_cols = joblib.load("../model/train_columns.pkl")  # save X_train columns
        df = df.reindex(columns=train_cols, fill_value=0)

        prob = model.predict_proba(df)[:,1][0]
        pred = int(prob > 0.3)  # threshold tuned
        result = {"prediction": pred, "risk_score": prob}

    return render_template("index.html", result=result)

if __name__ == "__main__":
    app.run(debug=True)