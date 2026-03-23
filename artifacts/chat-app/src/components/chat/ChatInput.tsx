import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ImagePlus, X, Mic, MicOff, Paperclip, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Attachment {
  type: "image" | "pdf";
  preview?: string;
  data: string;
  mimeType: string;
  name?: string;
}

interface ChatInputProps {
  onSend: (content: string, imageData?: string, mimeType?: string, pdfData?: string, pdfName?: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const clipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "hi-IN";
      rec.onresult = (e: SpeechRecognitionEvent) => {
        const transcript = e.results[0][0].transcript;
        setValue((prev) => prev + (prev ? " " : "") + transcript);
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      setRecognition(rec);
    }
  }, []);

  const toggleMic = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSend = () => {
    const hasContent = value.trim() || attachment;
    if (!hasContent || isLoading) return;

    if (attachment?.type === "image") {
      onSend(value.trim() || " ", attachment.data, attachment.mimeType);
    } else if (attachment?.type === "pdf") {
      onSend(value.trim() || `Please read and summarize this PDF: ${attachment.name}`, undefined, undefined, attachment.data, attachment.name);
    } else {
      onSend(value.trim());
    }

    setValue("");
    setAttachment(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mime = file.type || "image/jpeg";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAttachment({ type: "image", preview: result, data: result.split(",")[1], mimeType: mime });
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleClipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAttachment({ type: "pdf", data: result.split(",")[1], mimeType: "application/pdf", name: file.name });
    };
    reader.readAsDataURL(file);
    if (clipInputRef.current) clipInputRef.current.value = "";
  };

  const handleGlobeClick = () => {
    setValue((prev) => (prev ? prev + " " : "") + "Search: ");
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [value]);

  const canSend = (value.trim() || attachment) && !isLoading;

  return (
    <div className="flex flex-col w-full gap-2">
      {/* Attachment Preview */}
      <AnimatePresence>
        {attachment && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="relative inline-flex items-center gap-2 self-start ml-2 glass-card px-3 py-2 rounded-xl"
          >
            {attachment.type === "image" && attachment.preview ? (
              <img src={attachment.preview} alt="Preview" className="h-12 w-12 object-cover rounded-lg" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-[10px] font-bold text-red-500">PDF</span>
                </div>
                <span className="text-xs text-foreground max-w-[120px] truncate">{attachment.name}</span>
              </div>
            )}
            <button
              onClick={() => setAttachment(null)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Box */}
      <div className="glass-input relative flex items-end w-full rounded-[1.5rem] p-2 transition-all duration-300">
        {/* Hidden file inputs */}
        <input type="file" accept="image/*,video/*" ref={imageInputRef} onChange={handleImageSelect} className="hidden" />
        <input type="file" accept=".pdf" ref={clipInputRef} onChange={handleClipSelect} className="hidden" />

        {/* Left Buttons */}
        <div className="flex items-center gap-0.5 flex-shrink-0 pb-1">
          {/* Camera / Gallery */}
          <Button type="button" size="icon" variant="ghost"
            onClick={() => imageInputRef.current?.click()}
            disabled={isLoading}
            className="rounded-xl h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
            title="Image / Camera"
          >
            <ImagePlus className="w-4 h-4" />
          </Button>

          {/* PDF / Clip */}
          <Button type="button" size="icon" variant="ghost"
            onClick={() => clipInputRef.current?.click()}
            disabled={isLoading}
            className="rounded-xl h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
            title="Attach PDF"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          {/* Globe / Web Search */}
          <Button type="button" size="icon" variant="ghost"
            onClick={handleGlobeClick}
            disabled={isLoading}
            className="rounded-xl h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
            title="Web Search"
          >
            <Globe className="w-4 h-4" />
          </Button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Veda AI..."
          className="flex-1 max-h-[180px] min-h-[44px] bg-transparent resize-none outline-none py-3 px-2 text-[15px] text-foreground placeholder:text-muted-foreground/60"
          rows={1}
          disabled={isLoading}
        />

        {/* Right Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0 pb-1">
          {/* Mic */}
          <Button type="button" size="icon" variant="ghost"
            onClick={toggleMic}
            disabled={isLoading || !recognition}
            className={`rounded-xl h-9 w-9 transition-colors ${isListening ? "text-red-500 bg-red-500/10 animate-pulse" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          {/* Send */}
          <Button size="icon"
            className="rounded-xl h-10 w-10 shadow-md flex-shrink-0"
            onClick={handleSend}
            disabled={!canSend}
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4 ml-0.5" />
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
