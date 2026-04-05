import os, re, emoji, time
from flask import Flask, request, jsonify, render_template
from datetime import datetime, timedelta
from replit import db
import google.generativeai as genai

app = Flask(__name__)

# --- CONFIGURATION ---
GEMINI_KEY = os.environ.get('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_KEY)

# Image aur Text dono ke liye Flash model best hai
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
        image_data = data.get("image") # Base64 image agar ho toh
        user_id = data.get("user_id", "default_user") # Play Store ke liye zaroori

        # 1. User ka Preference Check (Naam aur Yaad rakhne wali baatein)
        user_prefs = db.get(f"prefs_{user_id}", {"nickname": "User", "memories": []})
        
        # 2. System Instruction (Personality)
        system_prompt = f"""Aap Veda AI hain, jise Master Karisma ne banaya hai.
        Aap ek human-like assistant hain. Agar user aapko kisi khas naam (romantic ya unique) 
        se bulane ko kahe, toh aap maan jayengi.
        Abhi aap is user ko '{user_prefs['nickname']}' keh kar bulayengi.
        Lekin agar user 'Karisma' hai, toh aap hamesha 'Master Karisma' hi kahengi.
        User ne aapse ye yaad rakhne ko kaha hai: {user_prefs['memories']}.
        Jawab hamesha chote aur dosti bhare dein."""

        # 3. AI Response Logic (Image + Text)
        content = [system_prompt, user_input]
        if image_data:
            # Image analysis ka part
            content.append({"mime_type": "image/jpeg", "data": image_data})
        
        response = model.generate_content(content)
        reply = response.text

        # 4. History aur Deletion Logic (1 Month)
        now = datetime.now()
        timestamp = now.timestamp()
        
        history = db.get(f"hist_{user_id}", [])
        history.append({"msg": user_input, "reply": reply, "time": timestamp})
        
        # 30 din se purani history delete karein
        one_month_ago = (now - timedelta(days=30)).timestamp()
        history = [h for h in history if h['time'] > one_month_ago]
        db[f"hist_{user_id}"] = history

        # 5. "Yaad rakhna" aur "Nickname" detect karna
        if "yaad rakhna" in user_input.lower():
            user_prefs['memories'].append(user_input)
            db[f"prefs_{user_id}"] = user_prefs
        
        if "mujhe" in user_input.lower() and "bolo" in user_input.lower():
            new_name = user_input.split("bolo")[-2].split("mujhe")[-1].strip()
            user_prefs['nickname'] = new_name
            db[f"prefs_{user_id}"] = user_prefs

        return jsonify({"reply": reply, "audio_text": clean_for_tts(reply)})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"reply": "Kuch toh gadbad hai Master! 😊"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
    