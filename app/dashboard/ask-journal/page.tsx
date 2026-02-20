// ============================================================================
// User Dashboard — Ask Journal Page (Client Component)
// Chat interface with quick/deep reflect modes
// ============================================================================

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Plus,
  Trash2,
  Loader2,
  Zap,
  Layers,
  MessageCircle,
} from "lucide-react";
import type { JournalChatConversation, JournalChatMessage } from "@/lib/types";

export default function AskJournalPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<JournalChatConversation[]>(
    [],
  );
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<JournalChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatMode, setChatMode] = useState<"quick_reflect" | "deep_reflect">(
    "deep_reflect",
  );
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    setLoadingConvs(true);
    const res = await fetch("/api/chat", { cache: "no-store" });
    const data = await res.json();
    setConversations(Array.isArray(data) ? data : []);
    setLoadingConvs(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId: string) => {
    const res = await fetch(`/api/chat/messages?conversation_id=${convId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId, fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  async function sendMessage() {
    if (!input.trim() || sending) return;
    setSending(true);

    // Optimistically add user message
    const tempMsg: JournalChatMessage = {
      id: "temp-" + Date.now(),
      conversation_id: activeConvId || "",
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    const userInput = input;
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: activeConvId,
        message: userInput,
        chat_mode: chatMode,
      }),
    });

    const data = await res.json();

    if (data.conversation_id) {
      // If new conversation was created, switch to it
      if (!activeConvId) {
        setActiveConvId(data.conversation_id);
        await fetchConversations();
      }

      // Add AI response
      const aiMsg: JournalChatMessage = {
        id: "ai-" + Date.now(),
        conversation_id: data.conversation_id,
        role: "assistant",
        content: data.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }

    setSending(false);
  }

  // Delete conversation
  async function deleteConversation(convId: string) {
    await fetch("/api/chat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: convId }),
    });

    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
    await fetchConversations();
    router.refresh();
  }

  // New chat
  function startNewChat() {
    setActiveConvId(null);
    setMessages([]);
    setInput("");
  }

  return (
    <div className="w-full h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold text-foreground mb-6">Ask Journal</h1>

      <div className="flex gap-4 h-[calc(100%-4rem)]">
        {/* Sidebar: Conversations List */}
        <div className="w-72 bg-white rounded-xl border border-border flex flex-col overflow-hidden flex-shrink-0">
          {/* New Chat Button */}
          <div className="p-3 border-b border-border">
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingConvs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted text-center py-8">
                No conversations yet
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    activeConvId === conv.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted-bg text-foreground"
                  }`}
                  onClick={() => setActiveConvId(conv.id)}
                >
                  <MessageCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm truncate flex-1">{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-danger transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 bg-white rounded-xl border border-border flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="h-12 w-12 text-muted/30 mb-3" />
                <h3 className="font-semibold text-foreground mb-1">
                  Ask Your Journal
                </h3>
                <p className="text-sm text-muted max-w-sm">
                  {chatMode === "quick_reflect"
                    ? "Quick Reflect analyzes your recent journal entries (1-2 weeks) to give focused answers."
                    : "Deep Reflect analyzes your entire journal history for detailed patterns and insights."}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-muted-bg text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted-bg px-4 py-3 rounded-2xl rounded-bl-md">
                  <Loader2 className="h-4 w-4 animate-spin text-muted" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-3 items-center">
              {/* Chat Mode Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  onClick={() => setChatMode("quick_reflect")}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                    chatMode === "quick_reflect"
                      ? "bg-primary text-white"
                      : "bg-white text-muted hover:bg-muted-bg"
                  }`}
                  title="Quick Reflect - Analyzes recent entries (1-2 weeks)"
                >
                  <Zap className="h-3 w-3" />
                  Quick
                </button>
                <button
                  onClick={() => setChatMode("deep_reflect")}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                    chatMode === "deep_reflect"
                      ? "bg-primary text-white"
                      : "bg-white text-muted hover:bg-muted-bg"
                  }`}
                  title="Deep Reflect - Analyzes entire journal history"
                >
                  <Layers className="h-3 w-3" />
                  Deep
                </button>
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
                placeholder="Ask your journal anything..."
                className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
