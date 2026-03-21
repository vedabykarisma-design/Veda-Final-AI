import os
import google.generativeai as genai
from tavily import TavilyClient

# Secrets से चाबियाँ उठाना
GEMINI_KEY = os.environ['GEMINI_API_KEY']
TAVILY_KEY = os.environ['TAVILY_API_KEY']

# AI Setup
genai.configure(api_key=GEMINI_KEY)
tavily = TavilyClient(api_key=TAVILY_KEY)

def veda_ai(query):
    print(f"\n🔍 Veda AI searching for: {query}...")
    search = tavily.search(query=query)
    context = str(search['results'])
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"You are Veda AI by Karisma. Answer in Hinglish: {query} \nContext: {context}"
    response = model.generate_content(prompt)
    return response.text

if __name__ == "__main__":
    print("--- Veda AI is Online ---")
    user_input = input("\nKarisma, aaj aap kya janna chahti hain? ")
    print("\n--- Result ---\n", veda_ai(user_input))
    