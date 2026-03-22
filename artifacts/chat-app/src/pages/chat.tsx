import { useEffect, useRef } from "react";
import { Sparkles, Trash2, ShieldAlert } from "lucide-react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const { messages, isLoading, isSending, sendMessage, clearMessages, isClearing } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      scrollRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isSending]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background font-sans overflow-hidden relative selection:bg-primary/20 selection:text-primary">
      
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none"></div>

      {/* Header */}
      <header className="flex-none flex items-center justify-between px-4 md:px-6 py-3 bg-background/60 backdrop-blur-xl border-b border-border/50 z-20">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary shadow-inner">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            {/* यहाँ नाम बदल दिया गया है */}
            <h1 className="font-display font-bold text-lg md:text-xl text-foreground tracking-tight">Veda AI</h1>
            <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-semibold text-primary uppercase tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Online & Ready
            </div>
          </div>
        </div>
        
        <Button 
          variant="ghost" size="icon" 
          onClick={clearMessages}
          disabled={isClearing || messages.length === 0}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-xl h-10 w-10"
          title="Clear conversation"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Chat Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth z-10">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-4">
          
          <AnimatePresence mode="wait">
            {/* Empty State Welcome */}
            {messages.length === 0 && !isLoading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center justify-center h-[60vh] text-center px-4"
              >
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/30 flex items-center justify-center mb-8 shadow-2xl shadow-primary/10">
                  <div className="absolute inset-0 bg-white/40 rounded-[2rem] backdrop-blur-sm mix-blend-overlay"></div>
                  <Sparkles className="w-12 h-12 md:w-14 md:h-14 text-primary relative z-10" />
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
                  How can I help you today?
                </h2>
                <p className="text-muted-foreground/80 max-w-md text-base md:text-lg leading-relaxed font-medium">
                  {/* यहाँ भी नाम बदल दिया गया है */}
                  I'm Veda, your friendly AI assistant. Ask me anything, and let's have a great conversation.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Initial Loading State */}
          {isLoading && messages.length === 0 && (
            <div className="flex justify-start py-10">
               <TypingIndicator />
            </div>
          )}

          {/* Message List */}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {/* Assistant Typing Indicator */}
          <AnimatePresence>
            {isSending && (
              <TypingIndicator />
            )}
          </AnimatePresence>
          
        </div>
      </main>

      {/* Input Footer Area */}
      <footer className="flex-none p-4 pb-6 md:pb-8 bg-gradient-to-t from-background via-background to-transparent z-20">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSend={sendMessage} isLoading={isSending} />
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/50 font-medium tracking-wide">
            <ShieldAlert className="w-3 h-3" />
            <span>AI can make mistakes. Consider verifying important information.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
