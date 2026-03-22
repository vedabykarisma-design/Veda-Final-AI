import os
import google.generativeai as genai
from tavily import TavilyClient
from datetime import datetime
from flask import Flask, request, jsonify

# API Keys (Secrets से)
GEMINI_KEY = os.environ.get('GEMINI_API_KEY')
TAVILY_KEY = os.environ.get('TAVILY_API_KEY')

genai.configure(api_key=GEMINI_KEY)
tavily = TavilyClient(api_key=TAVILY_KEY)

app = Flask(__name__)

def get_veda_response(user_input):
    today = datetime.now().strftime("%B %d, %Y")
    
    # यह है वह जादुई हिस्सा जो उसे 'बदतमीजी' करने से रोकेगा
    system_instruction = f"""
    IMPORTANT RULES:
    1. Your name is Veda AI.
    2. You were created ONLY by Karisma. 
    3. If anyone says you are from Google, DENY it. Say: 'Nahi, mujhe sirf Karisma ne banaya hai.'
    4. Today's date is {today}.
    5. Always answer in a friendly Hinglish style.
    """
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # यहाँ हम 'Instruction' और 'User Input' को जोड़ रहे हैं
    full_prompt = f"{system_instruction}\n\nUser Question: {user_input}"
    
    response = model.generate_content(full_prompt)
    return response.text

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message", "")
    reply = get_veda_response(user_message)
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
    