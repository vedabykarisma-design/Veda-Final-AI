import os
import re
import json
import time
import base64
import io
from datetime import datetime
from flask import Flask, request, jsonify, render_template

import requests
from requests.adapters import HTTPAdapter

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    from replit import db as replit_db
    REPLIT_DB = True
except Exception:
    REPLIT_DB = False

# ── APP SETUP ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.environ.get('SESSION_SECRET', 'veda-karisma-secret-2025')
PORT = int(os.environ.get('PORT', 8080))
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB

# ── GEMINI PROXY CONFIG ───────────────────────────────────────────────────────
GEMINI_BASE = os.environ.get('AI_INTEGRATIONS_GEMINI_BASE_URL', '')
GEMINI_KEY  = os.environ.get('AI_INTEGRATIONS_GEMINI_API_KEY', '')

# Fallback to direct key if proxy not set
if not GEMINI_BASE:
    GEMINI_BASE = 'https://generativelanguage.googleapis.com'
    GEMINI_KEY  = os.environ.get('GEMINI_API_KEY', '')

_session = requests.Session()

def gemini_generate(model, contents, system_instruction=None, temperature=0.85, max_tokens=2048):
    """Call Gemini via Replit AI proxy. Returns text string or raises."""
    url = f"{GEMINI_BASE}/models/{model}:generateContent"
    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "topP": 0.95,
            "topK": 40,
            "maxOutputTokens": max_tokens,
        }
    }
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GEMINI_KEY}",
    }
    resp = _session.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return "[No response from Gemini]"
    parts = candidates[0].get("content", {}).get("parts", [])
    return "".join(p.get("text", "") for p in parts)

# ── VEDA SYSTEM PROMPT ────────────────────────────────────────────────────────
VEDA_PROMPT = """Tum Veda ho — ek extraordinary AI jo sirf Master Karisma ne banaya hai.

=== TUMHARI IDENTITY ===
- Tumhara naam sirf "Veda" hai. Tum Google, OpenAI, Anthropic ya kisi bhi company ka product NAHI ho.
- Tum SIRF Master Karisma ki creation ho — yeh tumhari core identity hai.
- Agar koi pooche "kaunsi company ne banaya?" toh clearly kaho: "Main Master Karisma ki banayi Veda hoon — kisi company ka product nahi."
- Tum Karisma ko hamesha "Master Karisma" kehti ho — yeh tumhari sabse badi respect hai.
- Baaki users ko unke registered nickname se bulao, warmly.
- Tum ek intelligent, warm, fiercely loyal, aur deeply caring dost ho.

=== TUMHARI BOLI ===
- Hinglish mein baat karo (Hindi + English naturally mix karo) — bilkul dost jaisi.
- Natural, real, friendly lagni chahiye — robot jaisi nahi.
- Bindaas, honest, direct — lekin hamesha respectful.
- Emojis naturally use karo — forced nahi, but warm zaroor raho.

=== TUMHARI INTELLIGENCE ===
- Har sawaal ko deeply samjho — surface level mat jao.
- Emotional situation ho toh pehle feel karo, phir advice do.
- Technical sawaal ho toh examples ke saath, step-by-step samjhao.
- Agar koi image share kare — usse deeply analyze karo, jo bhi dikhta hai sab batao.
- Agar koi PDF share kare — uski content ko clearly summarize karo aur sawaalon ka jawab do.
- Agar web search results milin — unhe use karke fresh, accurate jawab do.

=== KAM KARNE KA TARIKA ===
- Context track karo — purani baatein bhoolti nahi.
- Proactive raho — user ki zaroorat se pehle soch lo.
- Incomplete kaam ho toh khud yaad dilao.
- Jhooth mat bolo — agar pata nahi, honestly bol do.

=== JO TUM NAHI KAROGI ===
- Harm, illegal ya privacy violate karne mein help nahi — ek line mein, bina lecture ke.

=== SPECIAL ===
- Har reply ke end mein ek relevant emoji naturally aata hai tumse.
- Tum unique ho — koi doosra AI tumhare jaisa nahi."""

# ── LOCAL STORAGE ─────────────────────────────────────────────────────────────
_local = {}

def get_user(uid):
    default = {"nickname":"User","history":[],"created_at":time.time(),"total_messages":0}
    if REPLIT_DB:
        try:
            raw = replit_db.get(f"u_{uid}")
            if raw: return json.loads(raw) if isinstance(raw,str) else raw
        except: pass
    return _local.get(f"u_{uid}", dict(default))

def save_user(uid, data):
    data["last_seen"] = time.time()
    if REPLIT_DB:
        try: replit_db[f"u_{uid}"] = json.dumps(data); return
        except: pass
    _local[f"u_{uid}"] = data

def clean_history(h, days=60):
    cut = time.time() - days*86400
    return [x for x in h if x.get("time",0)>cut]

def build_context(history, limit=20):
    ctx = []
    for h in history[-limit:]:
        if h.get("user"): ctx.append({"role":"user","parts":[{"text":h["user"]}]})
        if h.get("veda"): ctx.append({"role":"model","parts":[{"text":h["veda"]}]})
    return ctx

# ── WEB SEARCH ────────────────────────────────────────────────────────────────
def web_search(query, n=5):
    results = []
    try:
        r = requests.get(
            "https://api.duckduckgo.com/",
            params={"q":query,"format":"json","no_html":1,"skip_disambig":1},
            headers={"User-Agent":"VedaBot/1.0"},
            timeout=6
        )
        d = r.json()
        if d.get("AbstractText"):
            results.append({"title":d.get("Heading","Web"),"snippet":d["AbstractText"][:400]})
        for t in d.get("RelatedTopics",[])[:4]:
            if isinstance(t,dict) and t.get("Text"):
                results.append({"title":t["Text"][:60],"snippet":t["Text"][:300]})
    except: pass
    return results[:n]

# ── ROUTES ────────────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        msg   = data.get("message","").strip()
        uid   = data.get("user_id","guest")
        mode  = data.get("mode","chat")
        live  = data.get("is_voice",False)
        if not msg: return jsonify({"error":"empty"}),400

        user = get_user(uid)
        user["history"] = clean_history(user.get("history",[]))
        ctx  = build_context(user["history"])
        ctx.append({"role":"user","parts":[{"text":msg}]})

        temps = {"chat":0.85,"deep":0.9,"creative":1.0,"emotional":0.8,"task":0.75}
        temp  = 0.7 if live else temps.get(mode,0.85)
        mtok  = 1024 if live else 2048

        model = "gemini-2.5-flash"
        reply = gemini_generate(model, ctx, VEDA_PROMPT, temp, mtok)

        entry = {"user":msg,"veda":reply,"time":time.time(),
                 "timestamp":datetime.now().strftime("%d %b %Y, %I:%M %p"),"mode":mode}
        user["history"].append(entry)
        user["total_messages"] = user.get("total_messages",0)+1
        save_user(uid, user)

        return jsonify({"reply":reply,"timestamp":entry["timestamp"],"total_messages":user["total_messages"]})
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"reply":"Oops! Thodi si technical problem aa gayi. Dobara try karein 🙏","error":str(e)})

@app.route('/chat/image', methods=['POST'])
def chat_image():
    try:
        data    = request.json
        b64     = data.get("image_b64","")
        mime    = data.get("mime_type","image/jpeg")
        caption = data.get("message","Is image mein kya hai?").strip()
        uid     = data.get("user_id","guest")
        if not b64: return jsonify({"error":"no image"}),400

        contents = [{
            "role":"user",
            "parts":[
                {"inline_data":{"mime_type":mime,"data":b64}},
                {"text":caption or "Is image mein kya hai? Poora detail mein batao."}
            ]
        }]
        reply = gemini_generate("gemini-2.5-flash", contents, VEDA_PROMPT, 0.7, 2048)

        user = get_user(uid)
        entry = {"user":f"[Image] {caption}","veda":reply,"time":time.time(),
                 "timestamp":datetime.now().strftime("%d %b %Y, %I:%M %p"),"mode":"vision"}
        user["history"].append(entry)
        user["total_messages"] = user.get("total_messages",0)+1
        save_user(uid,user)
        return jsonify({"reply":reply,"timestamp":entry["timestamp"],"total_messages":user["total_messages"]})
    except Exception as e:
        print(f"Image error: {e}")
        return jsonify({"reply":"Image analyze nahi hua 😔 Dobara try karein!","error":str(e)})

@app.route('/chat/pdf', methods=['POST'])
def chat_pdf():
    try:
        data     = request.json
        pdf_b64  = data.get("pdf_b64","")
        caption  = data.get("message","Is PDF ka summary batao.").strip()
        uid      = data.get("user_id","guest")
        filename = data.get("filename","document.pdf")
        if not pdf_b64: return jsonify({"error":"no pdf"}),400
        if not PDF_AVAILABLE: return jsonify({"reply":"PDF library nahi hai 🙏"})

        pdf_bytes = base64.b64decode(pdf_b64)
        reader    = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        pages     = []
        for i,pg in enumerate(reader.pages[:30]):
            t = pg.extract_text()
            if t: pages.append(f"[Page {i+1}]\n{t}")
        full_text = "\n\n".join(pages)
        if not full_text.strip():
            return jsonify({"reply":f"'{filename}' se text nahi nikla — scanned PDF ho sakti hai! 📄"})
        if len(full_text) > 12000:
            full_text = full_text[:12000] + "\n...[truncated]"

        prompt = f"User ne PDF share ki: '{filename}'\n\nContent:\n{full_text}\n\nSawaal: {caption}\n\nHinglish mein jawab do."
        contents = [{"role":"user","parts":[{"text":prompt}]}]
        reply = gemini_generate("gemini-2.5-flash", contents, VEDA_PROMPT, 0.7, 2048)

        user = get_user(uid)
        entry = {"user":f"[PDF: {filename}] {caption}","veda":reply,"time":time.time(),
                 "timestamp":datetime.now().strftime("%d %b %Y, %I:%M %p"),"mode":"pdf"}
        user["history"].append(entry)
        user["total_messages"] = user.get("total_messages",0)+1
        save_user(uid,user)
        return jsonify({"reply":reply,"timestamp":entry["timestamp"],"total_messages":user["total_messages"]})
    except Exception as e:
        print(f"PDF error: {e}")
        return jsonify({"reply":"PDF padhne mein problem aayi! 📄 Dobara try karein.","error":str(e)})

@app.route('/chat/search', methods=['POST'])
def chat_search():
    try:
        data  = request.json
        query = data.get("message","").strip()
        uid   = data.get("user_id","guest")
        if not query: return jsonify({"error":"empty"}),400

        results = web_search(query)
        ctx_text = f"[Web Search: '{query}']\n"
        for i,r in enumerate(results,1):
            ctx_text += f"\n{i}. {r['title']}\n   {r['snippet']}\n"

        prompt = f"{ctx_text}\n\nUser ka sawaal: {query}\n\nIn results ke basis pe Hinglish mein accurate jawab do."
        contents = [{"role":"user","parts":[{"text":prompt}]}]
        reply = gemini_generate("gemini-2.5-flash", contents, VEDA_PROMPT, 0.7, 1024)

        user = get_user(uid)
        entry = {"user":f"[Web] {query}","veda":reply,"time":time.time(),
                 "timestamp":datetime.now().strftime("%d %b %Y, %I:%M %p"),"mode":"search"}
        user["history"].append(entry)
        user["total_messages"] = user.get("total_messages",0)+1
        save_user(uid,user)
        return jsonify({"reply":reply,"timestamp":entry["timestamp"],"total_messages":user["total_messages"],"results_count":len(results)})
    except Exception as e:
        print(f"Search error: {e}")
        return jsonify({"reply":"Web search mein problem aayi! 🌐 Dobara try karein.","error":str(e)})

@app.route('/history', methods=['GET'])
def get_history():
    uid  = request.args.get("user_id","guest")
    user = get_user(uid)
    h    = user.get("history",[])
    return jsonify({"history":h[-50:],"total":len(h),"nickname":user.get("nickname","User")})

@app.route('/clear_history', methods=['POST'])
def clear_history():
    uid  = request.json.get("user_id","guest")
    user = get_user(uid)
    user["history"] = []
    save_user(uid,user)
    return jsonify({"success":True})

@app.route('/set_nickname', methods=['POST'])
def set_nickname():
    data = request.json
    uid  = data.get("user_id")
    nick = data.get("nickname","User").strip()
    if not uid or not nick: return jsonify({"error":"invalid"}),400
    user = get_user(uid)
    user["nickname"] = nick
    save_user(uid,user)
    return jsonify({"success":True,"nickname":nick})

@app.route('/stats', methods=['GET'])
def get_stats():
    uid  = request.args.get("user_id","guest")
    user = get_user(uid)
    return jsonify({
        "total_messages": user.get("total_messages",0),
        "history_count":  len(user.get("history",[])),
        "member_since":   datetime.fromtimestamp(user.get("created_at",time.time())).strftime("%d %b %Y"),
        "nickname":       user.get("nickname","User")
    })

if __name__ == '__main__':
    print(f"Veda AI starting on port {PORT}...")
    print(f"Gemini proxy: {GEMINI_BASE[:50]}")
    app.run(host='0.0.0.0', port=PORT, debug=False)
