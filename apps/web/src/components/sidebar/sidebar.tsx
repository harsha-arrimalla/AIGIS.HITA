"use client";

import { useState } from "react";
import { Search, SquarePen, Trash2, X } from "lucide-react";
import { HitaLogo } from "@/components/hita-logo";

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
  messageCount: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function groupConversations(conversations: Conversation[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfLast7Days = new Date(startOfToday.getTime() - 7 * 86400000);
  const startOfLast30Days = new Date(startOfToday.getTime() - 30 * 86400000);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Previous 30 days", items: [] },
    { label: "Older", items: [] },
  ];

  const sorted = [...conversations].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  for (const conv of sorted) {
    const t = conv.updatedAt.getTime();
    if (t >= startOfToday.getTime()) groups[0].items.push(conv);
    else if (t >= startOfYesterday.getTime()) groups[1].items.push(conv);
    else if (t >= startOfLast7Days.getTime()) groups[2].items.push(conv);
    else if (t >= startOfLast30Days.getTime()) groups[3].items.push(conv);
    else groups[4].items.push(conv);
  }

  return groups.filter((g) => g.items.length > 0);
}

export function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  const groups = groupConversations(filtered);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/10 animate-backdrop-in"
        onClick={onClose}
      />

      <aside
        className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-surface font-[family-name:var(--font-body)] shadow-[2px_0_12px_rgba(0,0,0,0.08)] animate-[slide-in-left_0.3s_cubic-bezier(0.16,1,0.3,1)]"
      >
        {/* Header — logo + actions */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center">
              <HitaLogo size={22} color="var(--color-ink)" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              hita
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-hover hover:text-ink"
              aria-label="Search"
            >
              <Search size={16} strokeWidth={1.8} />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-hover hover:text-ink"
              aria-label="Close sidebar"
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* New chat button */}
        <div className="px-3 pb-1 pt-1">
          <button
            onClick={onNew}
            className="flex w-full items-center gap-2.5 rounded-xl border border-border-hairline bg-canvas px-3.5 py-2.5 text-[13px] font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-border-soft hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] active:scale-[0.97]"
          >
            <SquarePen size={15} strokeWidth={1.8} className="text-text-secondary" />
            New conversation
          </button>
        </div>

        {/* Search — collapsible */}
        {searchOpen && (
          <div className="px-3 pt-2 pb-1 animate-fade-down">
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-border-hairline bg-canvas px-3 py-2 text-[13px] text-ink placeholder:text-tertiary outline-none transition-colors focus:border-border-soft"
            />
          </div>
        )}

        {/* Conversation list */}
        <div className="mt-1 flex-1 overflow-y-auto px-2 pb-4">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 pt-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-hover">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-tertiary">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="mt-3 text-[13px] font-medium text-ink">
                No conversations yet
              </p>
              <p className="mt-0.5 text-[12px] text-text-secondary">
                Start a new chat to begin exploring
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mt-5 first:mt-2">
                <p className="mb-1.5 px-2 text-[11px] font-medium text-tertiary">
                  {group.label}
                </p>
                {group.items.map((conv) => {
                  const isActive = conv.id === activeId;
                  const isHovered = conv.id === hoveredId;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => onSelect(conv.id)}
                      onMouseEnter={() => setHoveredId(conv.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`
                        group relative flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all duration-150
                        ${isActive ? "bg-ink/5" : "hover:bg-hover"}
                      `}
                    >
                      <span
                        className={`flex-1 truncate text-[13px] ${isActive ? "font-medium text-ink" : "text-ink"}`}
                      >
                        {conv.title}
                      </span>
                      <div className="flex shrink-0 items-center">
                        {isHovered && !isActive ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(conv.id);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-pressed hover:text-danger"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <span className="text-[11px] text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                            {timeAgo(conv.updatedAt)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
