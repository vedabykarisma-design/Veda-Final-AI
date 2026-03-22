import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (content: string, imageData?: string, mimeType?: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const hasContent = value.trim() || imageData;
    if (hasContent && !isLoading) {
      onSend(value.trim() || " ", imageData ?? undefined, imageData ? imageMimeType : undefined);
      setValue("");
      setImagePreview(null);
      setImageData(null);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type || "image/jpeg";
    setImageMimeType(mime);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      const base64 = result.split(",")[1];
      setImageData(base64);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageData(null);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const canSend = (value.trim() || imageData) && !isLoading;

  return (
    <div className="flex flex-col w-full gap-2">
      {imagePreview && (
        <div className="relative inline-block self-start ml-2">
          <img
            src={imagePreview}
            alt="Upload preview"
            className="h-20 w-20 object-cover rounded-xl border-2 border-primary/30 shadow-md"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:bg-destructive/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="relative flex items-end w-full bg-card border-2 border-border/80 rounded-[1.75rem] p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageSelect}
          className="hidden"
        />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0 rounded-2xl h-11 w-11 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title="Upload image"
        >
          <ImagePlus className="w-5 h-5" />
        </Button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Veda AI..."
          className="flex-1 max-h-[200px] min-h-[44px] bg-transparent resize-none outline-none py-3 px-2 text-[15px] text-foreground placeholder:text-muted-foreground/70"
          rows={1}
          disabled={isLoading}
        />

        <div className="p-1 flex-shrink-0">
          <Button
            size="icon"
            className="rounded-2xl h-11 w-11 shadow-md"
            onClick={handleSend}
            disabled={!canSend}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-0.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
