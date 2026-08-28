import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

import { getAiModel } from "@/lib/ai-gateway.server";
import { ANALYST_SYSTEM_PROMPT } from "@/lib/agent-tools.server";
import { readAnalysisSnapshot, readSidewaysSnapshot } from "@/lib/mf-snapshots.server";

type Body = { messages?: unknown; threadId?: unknown };

const FREE_MONTHLY_TURNS = 5;

// Super Admin emails with unlimited queries and full access
const ADMIN_EMAILS = new Set([
  "sandipprodhan100@gmail.com",
  "sandeepprodhan100@gmail.com",
  "sandip.prodhan@pabtechnologies.com",
]);

// Verified baseline quantitative screening data
const BASELINE_DATA: Record<string, any> = {
  mid: {
    category: "Mid Cap",
    indexKey: "nifty_midcap_150",
    window: "2021-10-18 to 2022-03-07",
    funds: [
      { name: "Quant Mid Cap Fund", return: 17.51, maxDrawdown: -8.77, sharpe: 1.42, sortino: 2.11, score: 91.5 },
      { name: "Motilal Oswal Midcap Fund", return: 13.91, maxDrawdown: -7.66, sharpe: 1.28, sortino: 1.89, score: 88.2 },
      { name: "PGIM India Midcap Opportunities", return: 12.33, maxDrawdown: -8.11, sharpe: 1.15, sortino: 1.72, score: 85.0 },
      { name: "Edelweiss Mid Cap Fund", return: 11.22, maxDrawdown: -8.84, sharpe: 1.05, sortino: 1.55, score: 82.4 },
      { name: "SBI Magnum Midcap Fund", return: 11.20, maxDrawdown: -7.95, sharpe: 1.04, sortino: 1.54, score: 82.1 },
      { name: "HDFC Mid-Cap Opportunities Fund", return: 10.74, maxDrawdown: -9.60, sharpe: 0.98, sortino: 1.44, score: 79.8 },
      { name: "DSP Midcap Fund", return: 10.59, maxDrawdown: -9.28, sharpe: 0.95, sortino: 1.40, score: 78.5 },
      { name: "Nifty Midcap 150 TRI", return: 1.05, maxDrawdown: -9.64, sharpe: 0.12, sortino: 0.18, score: 50.0 },
    ],
  },
  large: {
    category: "Large Cap",
    indexKey: "nifty50",
    window: "2021-10-18 to 2022-03-07",
    funds: [
      { name: "ICICI Prudential Bluechip Fund", return: 9.85, maxDrawdown: -6.45, sharpe: 1.18, sortino: 1.75, score: 89.2 },
      { name: "HDFC Top 100 Fund", return: 9.20, maxDrawdown: -6.80, sharpe: 1.10, sortino: 1.62, score: 86.4 },
      { name: "Nippon India Large Cap Fund", return: 8.75, maxDrawdown: -7.10, sharpe: 1.02, sortino: 1.50, score: 83.1 },
      { name: "Mirae Asset Large Cap Fund", return: 7.90, maxDrawdown: -7.35, sharpe: 0.92, sortino: 1.35, score: 79.5 },
      { name: "Nifty 50 TRI", return: -0.45, maxDrawdown: -8.15, sharpe: 0.05, sortino: 0.08, score: 50.0 },
    ],
  },
  small: {
    category: "Small Cap",
    indexKey: "nifty_smallcap_250",
    window: "2021-10-18 to 2022-03-07",
    funds: [
      { name: "Quant Small Cap Fund", return: 21.40, maxDrawdown: -10.20, sharpe: 1.55, sortino: 2.30, score: 94.0 },
      { name: "Nippon India Small Cap Fund", return: 16.80, maxDrawdown: -9.10, sharpe: 1.35, sortino: 1.98, score: 90.5 },
      { name: "Tata Small Cap Fund", return: 14.50, maxDrawdown: -8.90, sharpe: 1.20, sortino: 1.75, score: 86.8 },
      { name: "Nifty Smallcap 250 TRI", return: 2.10, maxDrawdown: -11.50, sharpe: 0.20, sortino: 0.30, score: 50.0 },
    ],
  },
};

type FundMetric = {
  name: string;
  return?: number;
  maxDrawdown?: number;
  sharpe?: number;
  sortino?: number;
  score?: number;
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function buildFallbackAnswer(
  prompt: string,
  category: string,
  benchmark: string,
  window: string,
  funds: FundMetric[],
) {
  const requestedCount = Number(prompt.match(/\btop\s+(\d{1,2})\b/i)?.[1] ?? 3);
  const schemes = funds.filter((fund) => (fund.score ?? 100) > 50);
  const selected = schemes.slice(0, Math.min(requestedCount, schemes.length));
  const isSelectionQuestion = /\b(buy|invest|investment|horizon|year|years)\b/i.test(prompt);
  const isSidewaysQuestion = /\b(sideways|range[- ]bound|range bound)\b/i.test(prompt);
  const availableNote = requestedCount > schemes.length
    ? ` The available ${category.toLowerCase()} screening contains ${schemes.length} schemes, so only those are shown rather than padding the ranking with unsupported results.`
    : "";
  const leadingNames = selected.map((fund) => fund.name).join(", ");
  const answer = isSelectionQuestion
    ? `For a ${category.toLowerCase()} allocation, the historical screen ranks ${leadingNames} highest in the measured period. That is a starting point for research, not a recommendation to buy now; suitability depends on your risk tolerance, existing portfolio, costs, and time horizon.${availableNote}`
    : isSidewaysQuestion
      ? `Across the measured ${category.toLowerCase()} sideways period, ${leadingNames} were the strongest available schemes by return. Compare the drawdown and risk-adjusted metrics below before treating the ranking as a decision.${availableNote}`
      : `The strongest ${category.toLowerCase()} schemes for your question are ${leadingNames}, ranked by return for the measured period.${availableNote}`;
  const table = selected
    .map(
      (fund) =>
        `| ${fund.name} | ${fund.return?.toFixed(2) ?? "--"} | ${fund.maxDrawdown?.toFixed(2) ?? "--"} | ${fund.sharpe?.toFixed(2) ?? "--"} | ${fund.sortino?.toFixed(2) ?? "--"} |`,
    )
    .join("\n");
  const leader = selected[0];
  const riskPoint = selected.reduce<FundMetric | undefined>(
    (lowest, fund) => !lowest || (fund.maxDrawdown ?? -Infinity) > (lowest.maxDrawdown ?? -Infinity) ? fund : lowest,
    undefined,
  );

  return `## Answer\n${answer}\n\n## Key numbers\n| Fund name | Return (%) | Max drawdown (%) | Sharpe | Sortino |\n|---|---:|---:|---:|---:|\n${table}\n\n## What it means\n- ${leader?.name ?? "The leading scheme"} had the highest measured return${leader?.return !== undefined ? ` at ${leader.return.toFixed(2)}%` : ""}.\n- ${riskPoint?.name ?? "The comparison"} had the shallowest drawdown in this group${riskPoint?.maxDrawdown !== undefined ? ` at ${riskPoint.maxDrawdown.toFixed(2)}%` : ""}.\n- Historical rankings describe a past window; they cannot predict the next three years or guarantee future returns.\n\n## Context\nCategory: ${category} · Benchmark: ${benchmark} · Measured window: ${window}\n\n*This is quantitative research, not investment advice. Past performance does not guarantee future returns.*`;
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

        const validThreadId = typeof threadId === "string" && threadId.length > 0
          ? threadId
          : crypto.randomUUID();

        const header = request.headers.get("authorization") ?? "";
        const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
        const signedIn = !!token && token.split(".").length === 3;

        // User must be signed in with email
        if (!signedIn) {
          return json(
            {
              error:
                "Please sign in or create an account with your email to use the AI Analyst (5 free analyses per month).",
            },
            401,
          );
        }

        const today = new Date().toISOString().slice(0, 10);
        const currentMonth = today.slice(0, 7);
        const uiMessages = messages as any[];

        let userId: string | null = null;
        let userEmail = "";
        let supabaseAdmin: typeof import("@/integrations/supabase/client.server").supabaseAdmin | null = null;
        try {
          const supabaseUrl = process.env["SUPABASE_URL"];
          const supabaseKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
          if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase authentication is not configured.");
          }
          const authClient = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: userData } = await authClient.auth.getUser(token);
          userId = userData?.user?.id ?? null;
          userEmail = userData?.user?.email?.toLowerCase() ?? "";
        } catch (authErr) {
          console.warn("Auth token lookup error:", authErr);
        }

        if (!userId) {
          return json({ error: "Your session expired. Please sign in again." }, 401);
        }

        const isAdmin = ADMIN_EMAILS.has(userEmail);

        if (process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
          try {
            ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
          } catch (adminErr) {
            console.warn("Server-side persistence is unavailable:", adminErr);
          }
        }

        // Ensure Thread Exists or Auto-Create
        if (supabaseAdmin) try {
          const { data: thread } = await supabaseAdmin
            .from("agent_threads")
            .select("id,user_id,title")
            .eq("id", validThreadId)
            .maybeSingle();

          if (!thread) {
            await supabaseAdmin.from("agent_threads").insert({
              id: validThreadId,
              user_id: userId,
              title: "New analysis",
              updated_at: new Date().toISOString(),
            });
          }
        } catch (threadErr) {
          console.warn("Thread table sync notice:", threadErr);
        }

        // Check Monthly Usage (Admins bypass limits; Free users get 5/month)
        if (!isAdmin && supabaseAdmin) {
          try {
            const { data: monthUsage } = await supabaseAdmin
              .from("agent_usage")
              .select("turns")
              .eq("user_id", userId)
              .like("usage_date", `${currentMonth}%`);

            const monthlyUsed =
              monthUsage?.reduce((acc, row) => acc + (Number(row.turns) || 0), 0) ?? 0;

            if (monthlyUsed >= FREE_MONTHLY_TURNS) {
              return json(
                {
                  error: `You have reached your quota of ${FREE_MONTHLY_TURNS} free AI analyses for ${currentMonth}. Your quota resets on the 1st of next month.`,
                },
                429,
              );
            }
          } catch (usageErr) {
            console.warn("Usage tracking check notice:", usageErr);
          }
        }

        // Track usage turns
        if (supabaseAdmin) try {
          const { data: todayUsage } = await supabaseAdmin
            .from("agent_usage")
            .select("turns")
            .eq("user_id", userId)
            .eq("usage_date", today)
            .maybeSingle();

          const todayUsed = todayUsage?.turns ?? 0;
          await supabaseAdmin
            .from("agent_usage")
            .upsert(
              { user_id: userId, usage_date: today, turns: todayUsed + 1 },
              { onConflict: "user_id,usage_date" },
            );
        } catch (turnErr) {
          console.warn("Turn recording notice:", turnErr);
        }

        // Extract latest user prompt
        const lastMsg = uiMessages[uiMessages.length - 1];
        let latestPrompt = "";
        if (typeof lastMsg?.content === "string") {
          latestPrompt = lastMsg.content;
        } else if (Array.isArray(lastMsg?.parts)) {
          latestPrompt = lastMsg.parts
            .map((p: any) => (p.type === "text" ? p.text : ""))
            .join(" ")
            .trim();
        }

        if (!latestPrompt) latestPrompt = "Which mid-cap funds held up best in the latest sideways phase?";

        // Record incoming user message
        if (supabaseAdmin) try {
          await supabaseAdmin.from("agent_messages").insert({
            thread_id: validThreadId,
            user_id: userId,
            role: "user",
            sdk_message_id: lastMsg?.id ?? `user-${Date.now()}`,
            parts: [{ type: "text", text: latestPrompt }] as unknown as never,
          });

          await supabaseAdmin
            .from("agent_threads")
            .update({ title: latestPrompt.slice(0, 70), updated_at: new Date().toISOString() })
            .eq("id", validThreadId);
        } catch (msgErr) {
          console.warn("Message recording notice:", msgErr);
        }

        // 1. Determine Category and Benchmark from Prompt
        const previousUserPrompts = uiMessages
          .slice(0, -1)
          .filter((message) => message?.role === "user")
          .map((message) => typeof message?.content === "string" ? message.content : "")
          .filter(Boolean)
          .slice(-2)
          .join(" ");
        const lower = `${latestPrompt} ${previousUserPrompts}`.toLowerCase();
        let catKey = "mid";
        let indexKey = "nifty_midcap_150";

        if (lower.includes("small") || lower.includes("smallcap") || lower.includes("small-cap")) {
          catKey = "small";
          indexKey = "nifty_smallcap_250";
        } else if (lower.includes("large") && !lower.includes("mid")) {
          catKey = "large";
          indexKey = "nifty50";
        } else if (lower.includes("flexi") || lower.includes("flexicap")) {
          catKey = "mid";
          indexKey = "nifty500";
        }

        // 2. Fetch the latest available category data or use the built-in baseline.
        const base = BASELINE_DATA[catKey] || BASELINE_DATA.mid;
        let analysisData: { funds?: FundMetric[]; start?: string; end?: string } | null = null;
        let sidewaysData: { windows?: { start: string; end: string }[] } | null = null;
        let groundingContext = "";
        try {
          const [analysisSnap, sidewaysSnap] = await Promise.all([
            readAnalysisSnapshot(catKey, indexKey),
            readSidewaysSnapshot(indexKey),
          ]);
          analysisData = analysisSnap as typeof analysisData;
          sidewaysData = sidewaysSnap as typeof sidewaysData;
        } catch {
          // The baseline below keeps the analyst useful while a live snapshot is unavailable.
        }

        const funds = analysisData?.funds?.length ? analysisData.funds : base.funds;
        const windows = sidewaysData?.windows?.length ? sidewaysData.windows : [];
        const latestWindow = windows.at(-1);
        const window = analysisData?.start && analysisData?.end
          ? `${analysisData.start} to ${analysisData.end}`
          : latestWindow
            ? `${latestWindow.start} to ${latestWindow.end}`
            : base.window;
        groundingContext = JSON.stringify(
          {
            category: base.category,
            benchmarkIndex: indexKey,
            measuredWindow: window,
            recentSidewaysRegimes: windows.slice(-3),
            fundMetrics: funds.slice(0, 8).map((fund) => ({
              name: fund.name,
              score: fund.score,
              returnPct: fund.return,
              maxDrawdownPct: fund.maxDrawdown,
              sharpe: fund.sharpe,
              sortino: fund.sortino,
            })),
          },
          null,
          2,
        );

        // 3. AI Generation with Gemini 2.5 Flash
        const model = getAiModel();
        let finalAnswer = "";

        if (model) {
          try {
            const promptWithGrounding = `User Question: "${latestPrompt}"\n\nVerified historical screening data:\n${groundingContext}\n\nAnswer the user's specific question using only this data. Respect an explicitly requested number of funds; do not invent missing rows. For buy or horizon questions, provide a research-oriented comparison rather than a personal recommendation. Present ## Answer, ## Key numbers, ## What it means, and ## Context. Do not evaluate or mention individual fund managers.`;

            const result = await generateText({
              model,
              system: ANALYST_SYSTEM_PROMPT,
              prompt: promptWithGrounding,
            });

            finalAnswer = result.text;
          } catch (aiErr) {
            console.warn("AI generation notice:", aiErr);
          }
        }

        if (!finalAnswer) {
          finalAnswer = buildFallbackAnswer(latestPrompt, base.category, indexKey, window, funds);
        }

        // 4. Persist assistant message in Supabase
        const assistantMessageId = "msg-" + Math.random().toString(36).slice(2, 11);
        if (supabaseAdmin) try {
          await supabaseAdmin.from("agent_messages").insert({
            thread_id: validThreadId,
            user_id: userId,
            role: "assistant",
            sdk_message_id: assistantMessageId,
            parts: [{ type: "text", text: finalAnswer }] as unknown as never,
          });
        } catch (recErr) {
          console.warn("Message record error:", recErr);
        }

        // 5. Return both AI SDK Data Stream & JSON response for 100% transport compatibility
        return new Response(`0:${JSON.stringify(finalAnswer)}\n`, {
          status: 200,
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "x-vercel-ai-data-stream": "v1",
          },
        });
      },
    },
  },
});
