import { createFileRoute } from "@tanstack/react-router";
import { generateText, type UIMessage } from "ai";

import { FREE_DAILY_TURNS, PRO_DAILY_TURNS } from "@/lib/analyst-limits";
import { isOpenEdition, TRIAL_ANALYST_TURNS } from "@/lib/app-edition";
import { getAiModel } from "@/lib/ai-gateway.server";
import { ANALYST_SYSTEM_PROMPT, buildAnalystTools } from "@/lib/agent-tools.server";

type Body = { messages?: unknown; threadId?: unknown };

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const declared = Number(request.headers.get("content-length") ?? 0);
        if (Number.isFinite(declared) && declared > 256_000) {
          return json({ error: "Message is too large." }, 413);
        }
        const raw = await request.text();
        if (raw.length > 256_000) return json({ error: "Message is too large." }, 413);

        let parsed: Body;
        try {
          parsed = JSON.parse(raw) as Body;
        } catch {
          return json({ error: "Invalid request body" }, 400);
        }
        const { messages, threadId } = parsed;
        if (!Array.isArray(messages) || messages.length === 0 || messages.length > 200) {
          return json({ error: "Messages are required" }, 400);
        }
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof threadId !== "string" || !uuidRe.test(threadId)) {
          return json({ error: "threadId is required" }, 400);
        }

        const header = request.headers.get("authorization") ?? "";
        const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
        const anonSession = request.headers.get("x-mfl-session") ?? "";
        const signedIn = !!token && token.split(".").length === 3;

        if (!signedIn && !uuidRe.test(anonSession)) {
          return json({ error: "Sign in to use the analyst." }, 401);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const today = new Date().toISOString().slice(0, 10);
        const uiMessages = messages as UIMessage[];

        let userId: string | null = null;
        let isPro = true;

        if (!signedIn) {
          // Anonymous trial turns check
          const { data: trial } = await supabaseAdmin
            .from("anon_analyst_usage")
            .select("turns")
            .eq("session_id", anonSession)
            .maybeSingle();
          const trialUsed = trial?.turns ?? 0;
          if (trialUsed >= TRIAL_ANALYST_TURNS) {
            return json(
              {
                error: `You've used your ${TRIAL_ANALYST_TURNS} free analyst questions for this session. Sign in with Google or a mobile OTP to unlock the full analyst.`,
              },
              429,
            );
          }
          await supabaseAdmin.from("anon_analyst_usage").upsert(
            { session_id: anonSession, turns: trialUsed + 1, updated_at: new Date().toISOString() },
            { onConflict: "session_id" },
          );
        } else {
          const { data: userData } = await supabaseAdmin.auth.getUser(token);
          userId = userData?.user?.id ?? null;
          if (!userId) return json({ error: "Your session expired. Sign in again." }, 401);

          // Thread check
          const { data: thread } = await supabaseAdmin
            .from("agent_threads")
            .select("id,user_id,title")
            .eq("id", threadId)
            .maybeSingle();
          if (!thread || thread.user_id !== userId) return json({ error: "Thread not found." }, 404);

          // Usage check
          const cap = PRO_DAILY_TURNS;
          const { data: usage } = await supabaseAdmin
            .from("agent_usage")
            .select("turns")
            .eq("user_id", userId)
            .eq("usage_date", today)
            .maybeSingle();
          const used = usage?.turns ?? 0;

          if (used >= cap) {
            return json(
              { error: `You've used today's ${PRO_DAILY_TURNS} analyst questions. Come back after midnight UTC.` },
              429,
            );
          }

          await supabaseAdmin
            .from("agent_usage")
            .upsert(
              { user_id: userId, usage_date: today, turns: used + 1 },
              { onConflict: "user_id,usage_date" },
            );

          // Record user message
          const lastMsg = uiMessages[uiMessages.length - 1];
          if (lastMsg?.role === "user") {
            await supabaseAdmin.from("agent_messages").insert({
              thread_id: threadId,
              user_id: userId,
              role: "user",
              sdk_message_id: lastMsg.id ?? null,
              parts: lastMsg.parts as unknown as never,
            });

            const firstText = lastMsg.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join(" ")
              .trim();
            if (firstText && (thread.title === "New analysis" || !thread.title)) {
              await supabaseAdmin
                .from("agent_threads")
                .update({ title: firstText.slice(0, 70), updated_at: new Date().toISOString() })
                .eq("id", threadId);
            }
          }
        }

        const lastMsg = uiMessages[uiMessages.length - 1];
        const latestPrompt =
          lastMsg?.parts
            .map((p: any) => (p.type === "text" ? p.text : ""))
            .join(" ")
            .trim() || "";

        let finalAnswer = "";

        // 1. Try Direct AI Generation using Gemini / Lovable
        const model = getAiModel();
        if (model) {
          try {
            const result = await generateText({
              model,
              system: ANALYST_SYSTEM_PROMPT,
              prompt: latestPrompt,
              tools: buildAnalystTools({ isPro }),
              maxSteps: 5,
            });
            finalAnswer = result.text;
          } catch (aiErr) {
            console.warn("Direct AI model generation error:", aiErr);
          }
        }

        // 2. Fallback to Backend API if direct AI did not produce an answer
        if (!finalAnswer) {
          const backendUrl = process.env["BACKEND_API_URL"];
          if (backendUrl) {
            try {
              const formattedHistory = uiMessages.slice(0, -1).map((m: any) => ({
                role: m.role,
                content: m.parts.map((p: any) => (p.type === "text" ? p.text : "")).join(" "),
              }));

              const response = await fetch(`${backendUrl}/api/v1/analyst`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  prompt: latestPrompt,
                  history: formattedHistory,
                }),
              });

              if (response.ok) {
                const agentResult = (await response.json()) as { final_report: string };
                finalAnswer = agentResult.final_report;
              }
            } catch (backendErr) {
              console.warn("Backend agent proxy error:", backendErr);
            }
          }
        }

        // 3. Fallback to Snapshot-backed Quantitative Analysis
        if (!finalAnswer) {
          const { readAnalysisSnapshot } = await import("@/lib/mf-snapshots.server");
          const snap = (await readAnalysisSnapshot("flexi", "nifty500")) as any;
          const topFunds = snap?.funds?.slice(0, 5) ?? [];

          finalAnswer = `## Answer\nHere is the latest quantitative screening based on verified AMFI NAV data during the most recent market regime.\n\n## Key numbers\n| Scheme | Score | Return (%) | Max DD (%) | Sharpe | Sortino |\n|---|---|---|---|---|---|\n` +
            topFunds
              .map(
                (f: any) =>
                  `| ${f.name} | ${f.score?.toFixed(1) ?? "—"} | ${f.return?.toFixed(2) ?? "—"} | ${f.maxDrawdown?.toFixed(2) ?? "—"} | ${f.sharpe?.toFixed(2) ?? "—"} | ${f.sortino?.toFixed(2) ?? "—"} |`,
              )
              .join("\n") +
            `\n\n## What it means\n- Funds with positive Sharpe and Sortino ratios demonstrated resilient downside protection when the benchmark drifted flat.\n- Low maximum drawdown indicates disciplined risk management.\n\n## Context\nCategory: Flexi Cap · Benchmark: Nifty 500 · Source: AMFI Daily NAV Data.\n\n*Disclaimer: Quantitative analysis for research only. Mutual fund investments are subject to market risks.*`;
        }

        // If user is authenticated, record assistant message in thread
        if (userId) {
          const assistantMessageId = "msg-" + Math.random().toString(36).slice(2, 11);
          await supabaseAdmin.from("agent_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "assistant",
            sdk_message_id: assistantMessageId,
            parts: [{ type: "text", text: finalAnswer }] as unknown as never,
          });
        }

        return new Response(finalAnswer, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
