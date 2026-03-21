import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (val: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (value.trim() && !isLoading) {
      onSend(value.trim());
      setValue("");
      
      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  return (
    <div className="relative flex items-end w-full bg-card border-2 border-border/80 rounded-[1.75rem] p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message Lumi..."
        className="w-full max-h-[200px] min-h-[44px] bg-transparent resize-none outline-none py-3 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/70"
        rows={1}
        disabled={isLoading}
      />
      <div className="p-1 flex-shrink-0">
        <Button 
          size="icon" 
          className="rounded-2xl h-11 w-11 shadow-md"
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
        </Button>
      </div>
    </div>
  );
}
