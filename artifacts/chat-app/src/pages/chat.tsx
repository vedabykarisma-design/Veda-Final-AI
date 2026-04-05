import { useEffect, useRef, useState } from "react";
import { ShieldAlert, PlusCircle, PanelLeft } from "lucide-react";
import vedaLogo from "/veda-logo.png";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Sidebar, useChatSessions } from "@/components/chat/Sidebar";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

function generateSessionTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(/\s+/).slice(0, 5).join(" ");
  return words.length > 0 ? words : "New Chat";
}

export default function ChatPage() {
  const { messages, isLoading, isSending, sendMessage, clearMessages, isClearing } = useChat();
  const { addOrUpdateSession } = useChatSessions();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  useEffect(() => {
    if (messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === "user");
      const lastMsg = messages[messages.length - 1];
      const title = firstUserMsg ? generateSessionTitle(firstUserMsg.content) : "New Chat";
      addOrUpdateSession(sessionId, title, lastMsg.content.slice(0, 60), messages.length);
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isSending]);

  const handleNewChat = () => {
    clearMessages();
    setSidebarOpen(false);
  };

  // Naya Function: Jo buttons par click karne se message bhejega
  const handleQuickAction = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden relative bg-slate-950">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.6) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.5) 0%, transparent 50%)" }} />
      </div>

      {/* Sidebar - Higher Z-Index */}
      <div className={`fixed inset-0 z-[100] md:relative md:z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} transition-transform duration-300`}>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
          currentSessionId={sessionId}
          onSelectSession={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col h-full relative z-10 min-w-0">
        <header className="flex-none flex items-center justify-between px-4 py-3 glass-header border-b border-white/10 z-20">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-white z-[50]">
              <PanelLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-bold text-white text-sm md:text-base">Veda AI Agent</h1>
          </div>
          <Button onClick={handleNewChat} className="bg-white/10 text-white text-xs">New Chat</Button>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-5">
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10">
                  <img src={vedaLogo} className="w-20 h-20 mb-4" alt="Logo" />
                  <h2 className="text-white text-xl font-bold mb-6">Aao, baat karte hain! 👋</h2>

                  {/* FIXED QUICK ACTION BUTTONS */}
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    {[
                      { label: "📄 PDF padho", prompt: "Mujhe is PDF ko analyze karke do" },
                      { label: "🖼️ Image dekho", prompt: "Is image ke baare mein batao" },
                      { label: "🌐 Web scan karo", prompt: "Is website link ko scan karo" },
                      { label: "🎤 Voice se bolo", prompt: "Voice mode on karo" }
                    ].map((btn) => (
                      <button 
                        key={btn.label}
                        onClick={() => handleQuickAction(btn.prompt)}
                        className="glass-card p-3 rounded-xl text-xs text-white bg-white/5 hover:bg-white/20 border border-white/10 active:scale-95 transition-all z-[30]"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        </main>

        <footer className="p-4 z-20">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={sendMessage} isLoading={isSending} />
          </div>
        </footer>
      </div>
    </div>
  );
}
