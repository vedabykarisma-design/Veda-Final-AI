import os, re, emoji, base64
from flask import Flask, request, jsonify, render_template
from datetime import datetime, timedelta
from replit import db
import google.generativeai as genai

app = Flask(__name__)

# API Key Setup
GEMINI_KEY = os.environ.get('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def clean_for_tts(text):
    clean = emoji.replace_emoji(text, replace='')
    clean = re.sub(r'[*#_]', '', clean)
    return clean.strip()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get("message", "")
        image_b64 = data.get("image") # Image data
        user_id = "master_karisma" # Default ID

        # User Preferences (Memory)
        user_prefs = db.get(f"prefs_{user_id}", {"nickname": "User", "memories": []})

        # Personality Logic
        system_prompt = f"""Aap Veda AI hain, jise Master Karisma ne banaya hai.
        User aapko '{user_prefs['nickname']}' bulane ko kahe toh wahi kahein.
        Lekin Karisma ko hamesha 'Master Karisma' hi kahengi.
        Past memories: {user_prefs['memories']}
        Jawab chote aur dosti bhare dein."""

        # Image + Text Processing
        content = [system_prompt, user_input]
        if image_b64:
            img_data = base64.b64decode(image_b64)
            content.append({"mime_type": "image/jpeg", "data": img_data})

        response = model.generate_content(content)
        reply = response.text

        # 30 Days History Logic
        now = datetime.now()
        history = db.get(f"hist_{user_id}", [])
        history.append({"msg": user_input, "reply": reply, "time": now.timestamp()})

        # Auto-delete after 30 days
        limit = (now - timedelta(days=30)).timestamp()
        db[f"hist_{user_id}"] = [h for h in history if h['time'] > limit]

        # Name Change Detection
        if "mujhe" in user_input.lower() and "bolo" in user_input.lower():
            name = user_input.split("bolo")[0].split("mujhe")[-1].strip()
            user_prefs['nickname'] = name
            db[f"prefs_{user_id}"] = user_prefs

        return jsonify({"reply": reply, "audio_text": clean_for_tts(reply)})
    except Exception as e:
        return jsonify({"reply": f"Master, ek error hai: {str(e)}"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
