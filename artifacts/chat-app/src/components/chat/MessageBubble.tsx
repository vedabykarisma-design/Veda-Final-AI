import { format } from "date-fns";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User } from "lucide-react";
import type { Message } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn(
        "flex gap-3 max-w-[85%] md:max-w-[75%]", 
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-2xl flex items-center justify-center shadow-inner",
          isUser 
            ? "bg-secondary text-secondary-foreground" 
            : "bg-gradient-to-br from-primary/20 to-accent/20 text-primary"
        )}>
          {isUser ? <User className="w-4 h-4 md:w-5 md:h-5" /> : <Sparkles className="w-4 h-4 md:w-5 md:h-5" />}
        </div>

        {/* Bubble Content */}
        <div className={cn(
          "group relative px-5 py-4 text-[15px] md:text-base leading-relaxed break-words shadow-sm",
          isUser
            ? "bg-gradient-to-b from-primary to-primary/95 text-primary-foreground rounded-3xl rounded-tr-md shadow-primary/20"
            : "bg-card border border-border/60 text-card-foreground rounded-3xl rounded-tl-md"
        )}>
          
          {isUser ? (
             <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-[1.6] prose-pre:bg-muted prose-pre:text-muted-foreground prose-pre:rounded-xl prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {/* Timestamp (revealed on hover) */}
          <div className={cn(
            "text-[11px] opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 whitespace-nowrap font-medium",
            isUser ? "right-full mr-3 text-muted-foreground" : "left-full ml-3 text-muted-foreground"
          )}>
            {format(new Date(message.timestamp), "h:mm a")}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
