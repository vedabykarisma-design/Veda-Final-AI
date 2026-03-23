import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import vedaLogo from "/veda-logo.png";

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  messageCount: number;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  currentSessionId: string;
  onSelectSession: (session: ChatSession) => void;
}

const STORAGE_KEY = "veda_chat_sessions";

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveSessions = (newSessions: ChatSession[]) => {
    setSessions(newSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
  };

  const addOrUpdateSession = (id: string, title: string, preview: string, messageCount: number) => {
    setSessions((prev) => {
      const existing = prev.find((s) => s.id === id);
      let updated: ChatSession[];
      if (existing) {
        updated = prev.map((s) =>
          s.id === id ? { ...s, title, preview, messageCount, timestamp: new Date().toISOString() } : s
        );
      } else {
        const newSession: ChatSession = {
          id,
          title,
          preview,
          timestamp: new Date().toISOString(),
          messageCount,
        };
        updated = [newSession, ...prev].slice(0, 20);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    saveSessions(updated);
  };

  return { sessions, addOrUpdateSession, deleteSession };
}

export function Sidebar({ isOpen, onToggle, onNewChat, currentSessionId, onSelectSession }: SidebarProps) {
  const { sessions, deleteSession } = useChatSessions();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 260 : 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="relative flex-none h-full overflow-hidden z-40"
      >
        <div className="w-[260px] h-full flex flex-col glass-sidebar border-r border-white/10">
          {/* Sidebar Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <img src={vedaLogo} alt="Veda" className="w-8 h-8 object-contain" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">Veda AI Agent</p>
              <p className="text-[10px] text-muted-foreground">by Master Karisma</p>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <Button
              onClick={onNewChat}
              className="w-full rounded-xl gap-2 text-sm font-semibold glass-button"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          {/* Recent Chats */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {sessions.length > 0 && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recent Chats
              </p>
            )}
            {sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground/60">No chats yet. Start a conversation!</p>
              </div>
            )}
            <div className="space-y-1">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onHoverStart={() => setHoveredId(session.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  className={`group relative flex items-start gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                    currentSessionId === session.id
                      ? "bg-primary/15 border border-primary/20"
                      : "hover:bg-white/10"
                  }`}
                  onClick={() => onSelectSession(session)}
                >
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{session.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{session.preview}</p>
                  </div>
                  {hoveredId === session.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-50 w-5 h-10 flex items-center justify-center rounded-r-lg glass-toggle text-muted-foreground hover:text-foreground transition-colors"
        style={{ left: isOpen ? 260 : 0 }}
      >
        {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </>
  );
}
