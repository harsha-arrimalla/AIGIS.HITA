"use client";

import {
  useRef,
  useCallback,
  useState,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import {
  ArrowUp,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
  Square,
} from "lucide-react";

interface Attachment {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "file";
}

export function ChatInput({
  onSend,
  isLoading,
}: {
  onSend: (message: string) => void;
  isLoading: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [hasContent, setHasContent] = useState(false);

  const handleSubmit = useCallback(() => {
    const value = textareaRef.current?.value.trim();
    if ((!value && attachments.length === 0) || isLoading) return;
    onSend(value || "");
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
    setAttachments([]);
    setHasContent(false);
  }, [onSend, isLoading, attachments]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    setHasContent(el.value.trim().length > 0);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => {
      const isImage = file.type.startsWith("image/");
      const attachment: Attachment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        type: isImage ? "image" : "file",
      };
      if (isImage) {
        attachment.preview = URL.createObjectURL(file);
      }
      return attachment;
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== id);
    });
  };

  const canSend = hasContent || attachments.length > 0;

  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas via-canvas to-canvas/0 pb-3 pt-6">
      <div className="mx-auto max-w-[720px] px-4">
        {/* Main input container */}
        <div
          className={`overflow-hidden rounded-[24px] border-2 bg-raised transition-all duration-300 ${
            focused
              ? "border-coral shadow-[0_0_0_4px_rgba(255,90,95,0.12),0_8px_28px_rgba(255,90,95,0.14)] scale-[1.005]"
              : "border-transparent shadow-2"
          }`}
        >
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex gap-2 border-b border-border-hairline px-4 py-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group/att relative flex-shrink-0"
                >
                  {att.type === "image" && att.preview ? (
                    <div className="h-16 w-16 overflow-hidden rounded-xl border border-border-hairline">
                      <img
                        src={att.preview}
                        alt={att.file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 items-center gap-2 rounded-xl border border-border-hairline bg-surface px-3">
                      <FileText className="h-4 w-4 text-text-secondary" />
                      <span className="max-w-[120px] truncate font-[family-name:var(--font-body)] text-[12px] text-text-secondary">
                        {att.file.name}
                      </span>
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-on-dark opacity-0 shadow-sm transition-opacity group-hover/att:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <div className="px-4 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Message Hita..."
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={isLoading}
              className="w-full resize-none bg-transparent font-[family-name:var(--font-body)] text-[15px] leading-[1.6] text-ink placeholder:text-tertiary focus:outline-none disabled:opacity-50"
              style={{ minHeight: 24, maxHeight: 200 }}
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-2.5">
            {/* Left actions */}
            <div className="flex items-center gap-0.5">
              {/* File attach */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.csv,.json,.md"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-tertiary transition-colors duration-150 hover:bg-hover hover:text-text-secondary"
                aria-label="Attach file"
              >
                <Paperclip className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </button>

              {/* Image upload (shortcut) */}
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "image/*";
                    fileInputRef.current.click();
                    // Reset accept after click
                    setTimeout(() => {
                      if (fileInputRef.current)
                        fileInputRef.current.accept = "image/*,.pdf,.txt,.csv,.json,.md";
                    }, 100);
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-tertiary transition-colors duration-150 hover:bg-hover hover:text-text-secondary"
                aria-label="Upload image"
              >
                <ImageIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </button>
            </div>

            {/* Right — send / stop */}
            <button
              onClick={isLoading ? undefined : handleSubmit}
              disabled={!canSend && !isLoading}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
                isLoading
                  ? "bg-gradient-to-r from-coral to-[#FF8A5C] text-on-coral animate-gentle-pulse"
                  : canSend
                    ? "bg-gradient-to-r from-coral to-[#FF8A5C] text-on-coral shadow-[0_4px_12px_rgba(255,90,95,0.35)] hover:shadow-[0_6px_16px_rgba(255,90,95,0.45)] hover:scale-105"
                    : "bg-pressed text-tertiary"
              }`}
              aria-label={isLoading ? "Stop" : "Send"}
            >
              {isLoading ? (
                <Square className="h-3 w-3 fill-current" />
              ) : (
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {/* Hint text */}
        <p className="mt-1.5 text-center font-[family-name:var(--font-body)] text-[11px] text-tertiary">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
