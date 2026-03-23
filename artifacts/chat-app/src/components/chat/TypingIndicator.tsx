import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="flex w-full justify-start py-1"
    >
      <div className="flex gap-2.5 flex-row">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-white/90 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="px-4 py-3 glass-bubble-ai rounded-2xl rounded-tl-md flex items-center gap-1.5 h-[42px]">
          {[0, 0.18, 0.36].map((delay, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-400"
              animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
