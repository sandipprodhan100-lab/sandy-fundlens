import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bot, Send, Sparkles, User, Wrench } from "lucide-react";
import { toast } from "sonner";

import { AnalystAnswer } from "@/components/analyst/AnalystAnswer";
import { AnalystQuota } from "@/components/analyst/AnalystQuota";
import { AuthStatus } from "@/components/AuthStatus";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth";
import { getAnonSessionId } from "@/lib/anon-session";
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

function AnalystThreadPage() {
  const { threadId } = Route.useParams();
  const { session, loading } = useSession();
  const [trial, setTrial] = useState(false);
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const history = useQuery({
    queryKey: ["thread-messages", threadId],
    enabled: !loading,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      return (data ?? []).map(
        (m: any) =>
          ({
            id: m.id,
            role: m.role,
            content: m.content || "",
            parts: m.parts && m.parts.length > 0 ? m.parts : [{ type: "text", text: m.content || "" }],
          }) as unknown as UIMessage,
      );
    },
  });

  return (
    <Chat
      key={threadId}
      trial={trial && !session}
      threadId={threadId}
      initialMessages={history.data ?? []}
      input={input}
      setInput={setInput}
      boxRef={boxRef}
      inputRef={inputRef}
    />
  );
}

function Chat({
  trial,
  threadId,
  initialMessages,
  input,
  setInput,
  boxRef,
  inputRef,
}: {
  trial: boolean;
  threadId: string;
  initialMessages: UIMessage[];
  input: string;
  setInput: (v: string) => void;
  boxRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) return { Authorization: `Bearer ${token}` };
          return { "x-mfl-session": getAnonSessionId() };
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (error) => toast.error(error.message || "The analyst could not process that query."),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status, boxRef]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy, inputRef]);

  async function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    try {
      await sendMessage({ text: value });
    } catch (err: any) {
      toast.error(err?.message || "Failed to send message.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
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
        {trial ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            Free trial · {Math.max(0, FREE_MONTHLY_TURNS - messages.filter((m) => m.role === "user").length)} of{" "}
            {FREE_MONTHLY_TURNS} questions left in this session ·{" "}
            <Link to="/login" search={{ next: "/analyst" }} className="text-primary underline">
              Sign in to unlock the full analyst
            </Link>
          </div>
        ) : (
          <AnalystQuota />
        )}
      </div>

      <div ref={boxRef} className="mx-auto w-full max-w-4xl flex-1 space-y-6 overflow-y-auto px-4 py-8">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-border/60 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Bot className="h-5 w-5 text-primary" /> Ask the MF Lens Analyst
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every quantitative ranking and risk metric is grounded on verified AWS S3 Delta Lake NAV data.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void submit(s)}
                  className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-accent cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) => {
          const textContent =
            m.parts
              ?.map((p: any) => (p.type === "text" ? p.text : ""))
              .join("") || (m as any).content || "";

          return (
            <div key={m.id} className="flex gap-3">
              <div className="mt-1 shrink-0 rounded-full border border-border/60 p-1.5">
                {m.role === "user" ? (
                  <User className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Bot className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {textContent ? (
                  m.role === "user" ? (
                    <div className="text-sm text-foreground">{textContent}</div>
                  ) : (
                    <AnalystAnswer text={textContent} />
                  )
                ) : null}

                {m.parts
                  ?.filter((p: any) => p.type?.startsWith("tool-"))
                  .map((part: any, i: number) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs text-muted-foreground"
                    >
                      <Wrench className="h-3 w-3" />
                      {part.type.replace("tool-", "").replaceAll("_", " ")}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}

        {busy ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4 animate-pulse text-primary" /> Analyzing S3 AMFI Delta Lake NAV data & calculating regime returns…
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/90 backdrop-blur">
        <form
          className="mx-auto flex w-full max-w-4xl items-end gap-2 px-4 py-4"
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
            placeholder="Ask about a category, a window or a specific fund…"
            className="min-h-[52px] resize-none"
          />
          <Button type="submit" disabled={busy || !input.trim()} className="cursor-pointer">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
