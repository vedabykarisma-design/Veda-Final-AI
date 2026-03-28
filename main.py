import os
import json
from datetime import datetime, timedelta
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS

# API Keys (Render ke 'Environment Variables' mein GEMINI_API_KEY zaroor daalein)
GEMINI_KEY = os.environ.get('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_KEY)

app = Flask(__name__)
CORS(app)

DB_FILE = "user_data.json"

# Data load/save logic
def load_data():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            try:
                return json.load(f)
            except:
                return {"users": {}, "paid_users": {}}
    return {"users": {}, "paid_users": {}}

def save_data(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message", "")
    user_id = request.remote_addr
    db = load_data()
    today = datetime.now()

    # 1. AUTOMATIC MONTHLY CODE LOGIC (Karisma-March, Karisma-April, etc.)
    current_month_name = today.strftime('%B') 
    monthly_secret_code = f"Karisma-{current_month_name}"

    # Activation check
    if monthly_secret_code in user_message:
        expiry_date = (today + timedelta(days=30)).strftime("%Y-%m-%d")
        db["paid_users"][user_id] = expiry_date
        save_data(db)
        return jsonify({"reply": f"Mubarak ho Master! {current_month_name} ka unlimited access activate ho gaya hai. ✨"})

    # 2. PAID ACCESS CHECK
    is_paid = False
    if user_id in db["paid_users"]:
        expiry_dt = datetime.strptime(db["paid_users"][user_id], "%Y-%m-%d")
        if today <= expiry_dt:
            is_paid = True
        else:
            del db["paid_users"][user_id]
            save_data(db)

    # 3. FREE TRIAL LIMIT (5 CHATS)
    if not is_paid:
        count = db["users"].get(user_id, 0)
        if count >= 5:
            wa_link = "https://wa.me/918963928058"
            return jsonify({
                "reply": (
                    "Suno! Aapka 5-chat free trial khatam ho gaya hai. 🛑\n\n"
                    "Poore mahine unlimited baaton ke liye ₹50 pay karein.\n"
                    f"Mujhse WhatsApp par judne ke liye yahan click karein: {wa_link}\n"
                    "Payment ke baad main aapko activation code dungi!"
                )
            })
        db["users"][user_id] = count + 1
        save_data(db)

    # 4. VEDA PERSONALITY RESPONSE
    role = "Tum Karisma ki Veda AI ho. Karisma ko hamesha 'Master' kaho. Sabse bahut polite aur helpful raho. Hinglish mein baat karo."
    model = genai.GenerativeModel('gemini-1.5-flash')

    try:
        response = model.generate_content(f"{role}\nUser Message: {user_message}")
        return jsonify({"reply": response.text})
    except Exception as e:
        return jsonify({"reply": "Maaf kijiyega Master, mera dimaag thoda thak gaya hai (API Limit). 1 minute baad koshish karein! 😊"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
