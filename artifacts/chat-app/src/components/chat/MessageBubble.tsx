import { format } from "date-fns";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User } from "lucide-react";
import type { Message } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

type ExtendedMessage = Message & { imageUrl?: string; pdfName?: string };

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
            <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-white/10 prose-pre:text-white/80 prose-pre:rounded-xl prose-a:text-indigo-300 prose-strong:text-white">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
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
