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

  // Save session to LocalStorage whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === "user");
      const lastMsg = messages[messages.length - 1];
      const title = firstUserMsg ? generateSessionTitle(firstUserMsg.content) : "New Chat";
      addOrUpdateSession(sessionId, title, lastMsg.content.slice(0, 60), messages.length);
    }
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isSending]);

  const handleNewChat = () => {
    clearMessages();
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden relative">
      {/* Glassmorphism background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        <div className="absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.6) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.5) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.3) 0%, transparent 70%)" }}
        />
        <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
      </div>

      {/* Sidebar */}
      <div className="relative z-40 flex h-full">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((o) => !o)}
          onNewChat={handleNewChat}
          currentSessionId={sessionId}
          onSelectSession={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col h-full relative z-10 min-w-0">

        {/* Glass Header */}
        <header className="flex-none flex items-center justify-between px-4 md:px-5 py-3 glass-header border-b border-white/10 relative z-20">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost" size="icon"
              onClick={() => setSidebarOpen((o) => !o)}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-9 w-9"
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
              <img src={vedaLogo} alt="Veda AI" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight leading-none">Veda AI Agent</h1>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                Premium · Online
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={handleNewChat}
            disabled={isClearing || messages.length === 0}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl gap-1.5 text-xs font-semibold px-3 h-9"
          >
            <PlusCircle className="w-4 h-4" />
            New Chat
          </Button>
        </header>

        {/* Messages */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-5 pb-4">
            <AnimatePresence mode="wait">
              {messages.length === 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex flex-col items-center justify-center h-[58vh] text-center px-4"
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-2xl scale-150" />
                    <img src={vedaLogo} alt="Veda AI" className="relative w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-2xl" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight">
                    Aao, baat karte hain! 👋
                  </h2>
                  <p className="text-white/60 max-w-sm text-sm md:text-base leading-relaxed">
                    Main Veda AI hoon, Master Karisma ki creation. Image, PDF, links — sab handle karta hoon!
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-xs">
                    {["📄 PDF padho", "🖼️ Image dekho", "🌐 Web scan karo", "🎤 Voice se bolo"].map((tip) => (
                      <div key={tip} className="glass-card px-3 py-2 rounded-xl text-xs text-white/70 text-center">{tip}</div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading && messages.length === 0 && (
              <div className="flex justify-start py-8"><TypingIndicator /></div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            <AnimatePresence>
              {isSending && <TypingIndicator />}
            </AnimatePresence>
          </div>
        </main>

        {/* Glass Input Footer */}
        <footer className="flex-none p-3 pb-5 md:pb-6 relative z-20">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={(content, imageData, mimeType, pdfData, pdfName) =>
                sendMessage(content, imageData, mimeType, pdfData, pdfName)
              }
              isLoading={isSending}
            />
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-white/30 font-medium">
              <ShieldAlert className="w-3 h-3" />
              <span>Veda AI can make mistakes. Verify important info.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
