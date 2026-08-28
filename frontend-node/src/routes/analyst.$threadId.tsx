import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bot, Send, Sparkles, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AnalystAnswer } from "@/components/analyst/AnalystAnswer";
import { AnalystQuota } from "@/components/analyst/AnalystQuota";
import { AuthStatus } from "@/components/AuthStatus";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth";
import { FREE_MONTHLY_TURNS } from "@/lib/analyst-limits";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/analyst/$threadId")({
  ssr: false,
  component: AnalystThreadPage,
});

const SUGGESTIONS = [
  "Which mid-cap funds held up best in the latest sideways phase?",
  "Show me large-cap funds with the highest alpha vs Nifty 50.",
  "Which small-cap funds had the lowest max drawdown?",
  "How did flexi-cap funds perform during the range-bound market?",
];

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function AnalystThreadPage() {
  const { threadId } = Route.useParams();
  const { session, loading } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load existing message history from Supabase
  const history = useQuery({
    queryKey: ["thread-messages", threadId],
    enabled: !loading && !!session,
    staleTime: 10_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      const loaded: Message[] = (data ?? []).map((m: any) => {
        let content = m.content || "";
        if (!content && Array.isArray(m.parts)) {
          content = m.parts
            .map((p: any) => (p.type === "text" ? p.text : ""))
            .join(" ");
        }
        return {
          id: m.id || m.sdk_message_id || `msg-${Math.random()}`,
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content,
        };
      });

      return loaded;
    },
  });

  useEffect(() => {
    if (history.data && history.data.length > 0) {
      setMessages(history.data);
    }
  }, [history.data]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  async function submit(text: string) {
    const val = text.trim();
    if (!val || busy) return;

    setInput("");
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: val,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setBusy(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: newMessages,
          threadId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const rawText = await res.text();
      let answer = rawText;

      // Unpack AI SDK data stream chunk if present: 0:"..."
      if (rawText.startsWith("0:")) {
        try {
          const firstLine = rawText.split("\n")[0]?.slice(2);
          if (firstLine) {
            answer = JSON.parse(firstLine);
          }
        } catch {
          answer = rawText.replace(/^0:"/, "").replace(/"\n?$/, "");
        }
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answer,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error(err?.message || "Could not complete the analysis.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/analyst" className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All conversations
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Workspace
            </Link>
            <AuthStatus />
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-4xl px-4 pt-4">
        <AnalystQuota />
      </div>

      <div ref={boxRef} className="mx-auto w-full max-w-4xl flex-1 space-y-6 overflow-y-auto px-4 py-8">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-border/60 p-6 bg-white shadow-2xs">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Bot className="h-5 w-5 text-indigo-600" /> Ask the MF Lens AI Analyst
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every quantitative ranking and risk metric is grounded on verified AWS S3 Delta Lake NAV data.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void submit(s)}
                  className="rounded-full border border-border/60 px-3.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) => (
          <div key={m.id} className="flex gap-3">
            <div className="mt-1 shrink-0 rounded-full border border-border/60 p-1.5 bg-slate-50">
              {m.role === "user" ? (
                <User className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Bot className="h-4 w-4 text-indigo-600" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {m.role === "user" ? (
                <div className="text-sm font-medium text-foreground bg-slate-100/70 p-3 rounded-xl inline-block max-w-xl">
                  {m.content}
                </div>
              ) : (
                <AnalystAnswer text={m.content} />
              )}
            </div>
          </div>
        ))}

        {busy ? (
          <div className="flex items-center gap-2.5 text-sm font-medium text-indigo-700 bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl max-w-md animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600 shrink-0" />
            <span>Analyzing S3 Delta Lake NAV data & calculating regime returns…</span>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/95 backdrop-blur py-4">
        <form
          className="mx-auto flex w-full max-w-4xl items-end gap-2 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(input);
          }}
        >
          <Textarea
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(input);
              }
            }}
            placeholder="Ask about a category, sideways window or specific fund…"
            className="min-h-[52px] resize-none bg-white"
          />
          <Button type="submit" disabled={busy || !input.trim()} className="bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer h-[52px] px-5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
