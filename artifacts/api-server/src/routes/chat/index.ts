import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { randomUUID } from "crypto";

const router = Router();

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const messages: Message[] = [];

router.get("/chat/messages", (_req, res) => {
  res.json(messages);
});

router.post("/chat/messages", async (req, res) => {
  const { content } = req.body as { content: string };

  if (!content || typeof content !== "string" || content.trim() === "") {
    res.status(400).json({ error: "Message content is required" });
    return;
  }

  const userMessage: Message = {
    id: randomUUID(),
    role: "user",
    content: content.trim(),
    timestamp: new Date().toISOString(),
  };

  messages.push(userMessage);

  const chatHistory = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : ("user" as const),
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: chatHistory,
    config: { maxOutputTokens: 8192 },
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
