import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User, Volume2, VolumeX } from "lucide-react";
import type { Message } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useState, useCallback, useRef } from "react";

type ExtendedMessage = Message & { imageUrl?: string; pdfName?: string };

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*>]+\s/gm, "")
    .replace(/\n{2,}/g, ". ")
    .trim();
}

function SpeakerButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const toggle = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const clean = stripMarkdown(text);
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = "hi-IN";
    utter.rate = 0.95;
    utter.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang.startsWith("hi")) ||
      voices.find((v) => v.lang.startsWith("en-IN"));
    if (hindiVoice) utter.voice = hindiVoice;

    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);

    utterRef.current = utter;
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  }, [speaking, text]);

  return (
    <button
      onClick={toggle}
      title={speaking ? "Awaaz band karo" : "Awaaz mein suno"}
      className={cn(
        "flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200",
        "border backdrop-blur-sm",
        speaking
          ? "bg-indigo-500/30 border-indigo-400/50 text-indigo-200"
          : "bg-white/5 border-white/15 text-white/40 hover:bg-white/10 hover:text-white/70"
      )}
    >
      <AnimatePresence mode="wait">
        {speaking ? (
          <motion.span
            key="on"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            <span className="flex gap-0.5 items-end h-3">
              {[0, 0.15, 0.3].map((delay, i) => (
                <motion.span
                  key={i}
                  className="w-0.5 bg-indigo-300 rounded-full"
                  animate={{ height: ["4px", "10px", "4px"] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay }}
                />
              ))}
            </span>
            Bol rahi hun...
          </motion.span>
        ) : (
          <motion.span
            key="off"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            <Volume2 className="w-3 h-3" />
            Awaaz mein suno
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function MessageBubble({ message }: { message: Message }) {
  const m = message as ExtendedMessage;
  const isUser = m.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex gap-2.5 max-w-[85%] md:max-w-[78%]", isUser ? "flex-row-reverse" : "flex-row")}>

        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow",
          isUser
            ? "bg-indigo-500/80 backdrop-blur-sm border border-white/20 text-white"
            : "bg-white/10 backdrop-blur-sm border border-white/15 text-white/90"
        )}>
          {isUser
            ? <User className="w-4 h-4" />
            : <Sparkles className="w-4 h-4" />
          }
        </div>

        {/* Bubble */}
        <div className={cn(
          "group relative px-4 py-3 text-[14.5px] md:text-[15px] leading-relaxed break-words rounded-2xl",
          isUser
            ? "glass-bubble-user text-white rounded-tr-md"
            : "glass-bubble-ai text-white/90 rounded-tl-md"
        )}>
          {isUser ? (
            <div className="flex flex-col gap-2">
              {m.imageUrl && (
                <img
                  src={m.imageUrl}
                  alt="Shared image"
                  className="max-w-[220px] rounded-xl border border-white/20 shadow-lg"
                />
              )}
              {m.pdfName && (
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <div className="w-8 h-9 bg-red-500/30 rounded flex items-center justify-center text-[9px] font-bold text-red-300">PDF</div>
                  <span className="text-xs text-white/80 truncate max-w-[140px]">{m.pdfName}</span>
                </div>
              )}
              {m.content.trim() && m.content !== " " && (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          ) : (
            <div>
              <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-white/10 prose-pre:text-white/80 prose-pre:rounded-xl prose-a:text-indigo-300 prose-strong:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
              <SpeakerButton text={m.content} />
            </div>
          )}

          {/* Timestamp */}
          <div className={cn(
            "text-[10px] opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 whitespace-nowrap text-white/40",
            isUser ? "right-1" : "left-1"
          )}>
            {format(new Date(m.timestamp), "h:mm a")}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
