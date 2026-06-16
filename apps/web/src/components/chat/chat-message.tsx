"use client";

import { useState, type ReactNode } from "react";
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Bus, BadgeDollarSign } from "lucide-react";
import type { Message } from "@/hooks/use-chat";
import { PlaceCard, type PlaceData } from "@/components/chat/place-card";

/* ── Actions bar — copy, feedback ── */
function MessageActions({
  content,
  onRegenerate,
}: {
  content: string;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnClass =
    "flex items-center gap-1 rounded-md px-1.5 py-1 text-tertiary transition-all duration-150 hover:bg-hover hover:text-text-secondary active:scale-90";

  return (
    <div className="flex items-center gap-0.5 opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0">
      <button onClick={handleCopy} className={btnClass} aria-label="Copy">
        {copied ? <Check className="h-3.5 w-3.5 text-ink animate-pop-in" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <button className={btnClass} aria-label="Good response">
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button className={btnClass} aria-label="Bad response">
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
      {onRegenerate && (
        <button onClick={onRegenerate} className={btnClass} aria-label="Retry">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ── Simple markdown parser — handles **bold**, *italic*, bullet points, headers, links, code ── */
function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  const result: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let codeBlock: string[] | null = null;

  const flushList = () => {
    if (listItems.length > 0) {
      result.push(
        <ul key={`ul-${result.length}`} className="my-2 space-y-1.5 pl-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Code block toggle
    if (trimmed.startsWith("```")) {
      if (codeBlock === null) {
        flushList();
        codeBlock = [];
      } else {
        result.push(
          <pre
            key={`code-${lineIdx}`}
            className="my-3 overflow-x-auto rounded-lg border border-border-hairline bg-surface px-4 py-3 font-[family-name:var(--font-mono)] text-[13px] leading-[1.6] text-ink"
          >
            <code>{codeBlock.join("\n")}</code>
          </pre>
        );
        codeBlock = null;
      }
      return;
    }

    if (codeBlock !== null) {
      codeBlock.push(line);
      return;
    }

    // Bullet point: * or -
    if (/^[\*\-]\s/.test(trimmed)) {
      const content = trimmed.replace(/^[\*\-]\s/, "");
      listItems.push(
        <li key={`li-${lineIdx}`} className="flex gap-2 text-[15px] leading-[1.6]">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-tertiary" />
          <span>{inlineFormat(content)}</span>
        </li>
      );
      return;
    }

    // Numbered list: 1. or 1)
    if (/^\d+[.)]\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)[.)]\s(.*)$/);
      if (match) {
        listItems.push(
          <li key={`li-${lineIdx}`} className="flex gap-2 text-[15px] leading-[1.6]">
            <span className="mt-px min-w-[18px] shrink-0 text-right text-[13px] font-medium text-tertiary">{match[1]}.</span>
            <span>{inlineFormat(match[2])}</span>
          </li>
        );
        return;
      }
    }

    flushList();

    // Empty line
    if (!trimmed) {
      result.push(<div key={`br-${lineIdx}`} className="h-2" />);
      return;
    }

    // Headers: ### h3, ## h2, # h1
    if (trimmed.startsWith("### ")) {
      result.push(
        <h4 key={`h3-${lineIdx}`} className="mb-1 mt-3 text-[15px] font-semibold leading-[1.4] text-ink">
          {inlineFormat(trimmed.slice(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      result.push(
        <h3 key={`h2-${lineIdx}`} className="mb-1.5 mt-4 text-[16px] font-semibold leading-[1.4] text-ink">
          {inlineFormat(trimmed.slice(3))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      result.push(
        <h2 key={`h1-${lineIdx}`} className="mb-2 mt-4 text-[17px] font-bold leading-[1.3] text-ink">
          {inlineFormat(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    // Regular paragraph
    result.push(
      <p key={`p-${lineIdx}`} className="text-[15px] leading-[1.6]">
        {inlineFormat(trimmed)}
      </p>
    );
  });

  // Flush remaining unclosed code block
  if (codeBlock !== null && codeBlock.length > 0) {
    result.push(
      <pre key="code-end" className="my-3 overflow-x-auto rounded-lg border border-border-hairline bg-surface px-4 py-3 font-[family-name:var(--font-mono)] text-[13px] leading-[1.6] text-ink">
        <code>{codeBlock.join("\n")}</code>
      </pre>
    );
  }

  flushList();
  return result;
}

function inlineFormat(text: string): ReactNode[] {
  // Split by **bold**, *italic*, `code`, [links](url)
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      // **bold**
      parts.push(<strong key={match.index} className="font-semibold text-ink">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      // `inline code`
      parts.push(
        <code key={match.index} className="rounded bg-surface px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[13px] text-ink">
          {match[4]}
        </code>
      );
    } else if (match[5] && match[6]) {
      // [text](url)
      parts.push(
        <a
          key={match.index}
          href={match[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink underline decoration-border-soft underline-offset-2 transition-colors hover:decoration-ink"
        >
          {match[5]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : [text];
}

/* ── Streaming cursor ── */
function StreamingContent({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  if (!isStreaming) {
    return <div>{renderMarkdown(content)}</div>;
  }
  return (
    <div>
      {renderMarkdown(content)}
      <span className="ml-0.5 inline-block h-[1em] w-[2px] bg-ink align-text-bottom" style={{ animation: "gentle-pulse 0.8s ease-in-out infinite" }} />
    </div>
  );
}

/* ── Main message component ── */
export function ChatMessage({
  message,
  isStreaming = false,
  onRegenerate,
  onSuggestionClick,
  userLocation,
  onPlaceSelect,
}: {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onSuggestionClick?: (text: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  onPlaceSelect?: (place: PlaceData) => void;
}) {
  const isUser = message.role === "user";

  /* ── User message — right-aligned bubble ── */
  if (isUser) {
    return (
      <div className="flex justify-end py-2 animate-msg-user">
        <div className="max-w-[480px] rounded-[20px] rounded-br-[4px] bg-hover px-4 py-2.5">
          <p className="font-[family-name:var(--font-body)] text-[15px] leading-[1.6] text-ink">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  /* ── Assistant message — left-aligned, no bubble, no avatar, formatted text ── */
  return (
    <div className="group py-3 animate-msg-assistant">
      <div className="max-w-[640px]">
        {/* Message text — markdown rendered */}
        <div className="font-[family-name:var(--font-body)] text-ink">
          <StreamingContent content={message.content} isStreaming={isStreaming} />
        </div>

        {/* Place cards from uiAction — horizontal scroll */}
        {message.uiAction?.type === "PlaceList" && (
          <div className="scrollbar-hide -mx-2 mt-4 flex gap-3 overflow-x-auto px-2 pb-2">
            {((message.uiAction.data.places as Record<string, unknown>[]) || []).map(
              (place, i) => (
                <div key={i} className="animate-card-enter" style={{ animationDelay: `${i * 80}ms` }}>
                  <PlaceCard
                    place={mapServerPlace(place, userLocation)}
                    onAskAbout={onSuggestionClick}
                    onSelect={onPlaceSelect}
                  />
                </div>
              )
            )}
          </div>
        )}

        {/* Transit card */}
        {message.uiAction?.type === "TransitCard" && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border-hairline bg-canvas p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-scale-in">
            <div className="flex items-center gap-2 font-[family-name:var(--font-body)] text-[14px] font-semibold text-ink">
              <Bus className="h-4 w-4" strokeWidth={1.5} />
              <span>{message.uiAction.data.from as string}</span>
              <span className="text-tertiary">→</span>
              <span>{message.uiAction.data.to as string}</span>
            </div>
            {(message.uiAction.data.estimatedFare as string) && (
              <p className="mt-1 font-[family-name:var(--font-body)] text-[13px] text-text-secondary">
                Estimated fare: <span className="font-semibold text-ink">{message.uiAction.data.estimatedFare as string}</span>
              </p>
            )}
          </div>
        )}

        {/* Fare card */}
        {message.uiAction?.type === "FareCard" && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border-hairline bg-canvas p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-scale-in">
            <div className="flex items-center gap-2 font-[family-name:var(--font-body)] text-[14px] font-semibold text-ink">
              <BadgeDollarSign className="h-4 w-4" strokeWidth={1.5} />
              <span>Fare Check</span>
            </div>
            {(message.uiAction.data.verdict as string) && (
              <p className="mt-1 font-[family-name:var(--font-body)] text-[13px] text-text-secondary">
                {message.uiAction.data.verdict as string}
              </p>
            )}
            {(message.uiAction.data.expectedRange as string) && (
              <p className="mt-1 font-[family-name:var(--font-body)] text-[13px] font-medium text-ink">
                Expected: {message.uiAction.data.expectedRange as string}
              </p>
            )}
          </div>
        )}

        {/* Suggestion chips */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {message.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(s)}
                className="animate-chip-in rounded-full border border-border-hairline bg-canvas px-3 py-1 font-[family-name:var(--font-body)] text-[12px] font-medium text-text-secondary transition-all duration-200 hover:border-ink/30 hover:text-ink hover:shadow-sm active:scale-95"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Actions row */}
        <div className="mt-2">
          <MessageActions content={message.content} onRegenerate={onRegenerate} />
        </div>
      </div>
    </div>
  );
}

/* ── Haversine distance in km ── */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 0.1) return `${Math.round(km * 1000)}m away`;
  if (km < 1) return `${Math.round(km * 100) * 10}m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

/* ── Map server PlaceResult to PlaceCard props ── */
function mapServerPlace(
  raw: Record<string, unknown>,
  userLocation?: { lat: number; lng: number } | null
): PlaceData {
  const types = (raw.types as string[]) || [];
  let type: PlaceData["type"] = "attraction";
  if (types.some((t) => t.includes("restaurant") || t.includes("food"))) type = "restaurant";
  else if (types.some((t) => t.includes("cafe"))) type = "cafe";
  else if (types.some((t) => t.includes("lodging") || t.includes("hotel"))) type = "hotel";
  else if (types.some((t) => t.includes("park") || t.includes("gym") || t.includes("amusement"))) type = "activity";

  const priceMap: Record<number, string> = { 1: "₹", 2: "₹₹", 3: "₹₹₹", 4: "₹₹₹₹" };

  // Extract short area from address (first part before comma)
  const address = (raw.address as string) || "";
  const shortLocation = address.split(",").slice(0, 2).join(",").trim() || address;

  // Compute distance from user
  const placeLat = raw.lat as number | undefined;
  const placeLng = raw.lng as number | undefined;
  let distance: string | undefined;
  if (userLocation && placeLat && placeLng) {
    const km = haversineKm(userLocation.lat, userLocation.lng, placeLat, placeLng);
    if (km > 30) {
      // Show city/area name for far-away places
      const parts = address.split(",").map((s) => s.trim());
      distance = parts.length >= 3 ? parts[parts.length - 3] : parts[parts.length - 2] || shortLocation;
    } else {
      distance = formatDistance(km);
    }
  }

  return {
    name: raw.name as string,
    type,
    image: (raw.photoUrl as string) || undefined,
    rating: raw.rating as number | undefined,
    reviewCount: raw.totalRatings ? `${raw.totalRatings}` : undefined,
    priceLevel: raw.priceLevel ? priceMap[raw.priceLevel as number] : undefined,
    location: shortLocation,
    distance,
    hours: raw.isOpen != null ? (raw.isOpen ? "Open now" : "Closed") : undefined,
    placeId: raw.placeId as string | undefined,
    lat: raw.lat as number | undefined,
    lng: raw.lng as number | undefined,
    tags: types
      .filter((t) => !t.includes("point_of_interest") && !t.includes("establishment"))
      .slice(0, 3)
      .map((t) => t.replace(/_/g, " ")),
  };
}
