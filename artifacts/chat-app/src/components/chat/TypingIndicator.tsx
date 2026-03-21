import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex w-full justify-start py-2"
    >
      <div className="flex gap-3 max-w-[85%] md:max-w-[75%] flex-row">
        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary flex items-center justify-center shadow-inner">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div className="px-5 py-4 bg-card border border-border/60 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-1.5 h-[48px] md:h-[52px]">
          <motion.div 
            className="w-2 h-2 rounded-full bg-primary/40" 
            animate={{ y: [0, -6, 0], scale: [1, 1.2, 1], backgroundColor: ["hsl(var(--primary)/0.4)", "hsl(var(--primary))", "hsl(var(--primary)/0.4)"] }} 
            transition={{ duration: 1, repeat: Infinity, delay: 0 }} 
          />
          <motion.div 
            className="w-2 h-2 rounded-full bg-primary/40" 
            animate={{ y: [0, -6, 0], scale: [1, 1.2, 1], backgroundColor: ["hsl(var(--primary)/0.4)", "hsl(var(--primary))", "hsl(var(--primary)/0.4)"] }} 
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} 
          />
          <motion.div 
            className="w-2 h-2 rounded-full bg-primary/40" 
            animate={{ y: [0, -6, 0], scale: [1, 1.2, 1], backgroundColor: ["hsl(var(--primary)/0.4)", "hsl(var(--primary))", "hsl(var(--primary)/0.4)"] }} 
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} 
          />
        </div>
      </div>
    </motion.div>
  );
}
