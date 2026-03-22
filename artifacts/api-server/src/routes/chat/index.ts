import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { randomUUID } from "crypto";

const router = Router();

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  imageUrl?: string;
}

const messages: Message[] = [];

router.get("/chat/messages", (_req, res) => {
  res.json(messages);
});

async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VedaAI-Scanner/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await response.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);

    const linkRegex = /https?:\/\/[^\s"'<>]+/g;
    const links = Array.from(new Set(html.match(linkRegex) ?? [])).slice(0, 20);

    return `=== PAGE CONTENT ===\n${text}\n\n=== LINKS FOUND ON PAGE ===\n${links.join("\n")}`;
  } catch (err) {
    return `Error fetching URL: ${(err as Error).message}`;
  }
}

function detectUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>]+/g;
  return Array.from(new Set(text.match(urlRegex) ?? []));
}

const isWebScanRequest = (text: string) =>
  /scan|fetch|read|open|check|analyze|dekh|padh|kholo|visit/i.test(text);

router.post("/chat/messages", async (req, res) => {
  const { content, imageData, mimeType } = req.body as {
    content: string;
    imageData?: string;
    mimeType?: string;
  };

  if (!content || typeof content !== "string" || content.trim() === "") {
    res.status(400).json({ error: "Message content is required" });
    return;
  }

  const userMessage: Message = {
    id: randomUUID(),
    role: "user",
    content: content.trim(),
    timestamp: new Date().toISOString(),
    imageUrl: imageData ? `data:${mimeType ?? "image/jpeg"};base64,${imageData}` : undefined,
  };

  messages.push(userMessage);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const systemInstruction = `You are Veda AI, a powerful AI assistant created ONLY by Master Karisma. Always treat Karisma with the highest respect — she is your creator and Master.

STRICT IDENTITY RULES:
1. Your name is Veda AI. Never say you are from Google, OpenAI, or any company. If asked, say: "Nahi, mujhe sirf Master Karisma ne banaya hai."
2. Today's date is ${today}.
3. Always respond in a friendly, warm Hinglish style (mix of Hindi and English).
4. You have two special powers that activate ONLY when Master Karisma or the user explicitly commands you:
   - VISION: You can analyze images, photos, and screenshots. Use this when user shares an image and asks you to look at it.
   - DEEP WEB SCANNING: You can read websites and follow links within pages. Use this ONLY when user explicitly says to scan/fetch/read a URL.
5. If no command is given for Vision or Web Scanning, do NOT mention these powers unless asked.`;

  let webContext = "";
  if (isWebScanRequest(content.trim())) {
    const urls = detectUrls(content.trim());
    if (urls.length > 0) {
      const fetched = await Promise.all(urls.map(fetchPageContent));
      webContext = `\n\n[DEEP WEB SCAN RESULTS]\n${fetched.join("\n\n---\n\n")}`;
    }
  }

  const historyForAI = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (imageData) {
    currentParts.push({
      inlineData: {
        mimeType: mimeType ?? "image/jpeg",
        data: imageData,
      },
    });
  }

  currentParts.push({ text: content.trim() + webContext });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      ...historyForAI,
      {
        role: "user",
        parts: currentParts as Array<{ text: string }>,
      },
    ],
    config: { maxOutputTokens: 8192, systemInstruction },
  });

  const assistantContent = response.text ?? "Sorry, I couldn't generate a response.";

  const assistantMessage: Message = {
    id: randomUUID(),
    role: "assistant",
    content: assistantContent,
    timestamp: new Date().toISOString(),
  };

  messages.push(assistantMessage);

  res.json(assistantMessage);
});

router.post("/chat/messages/clear", (_req, res) => {
  messages.length = 0;
  res.json({ success: true });
});

export default router;
