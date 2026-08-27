import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";

import { FREE_DAILY_TURNS, PRO_DAILY_TURNS } from "@/lib/analyst-limits";
import { isOpenEdition, TRIAL_ANALYST_TURNS } from "@/lib/app-edition";

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
        // Hard bound on request size so an anonymous caller can't push a giant
        // body through the model or the database.
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

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return json({ error: "AI is not configured for this app." }, 500);

        const header = request.headers.get("authorization") ?? "";
        const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
        const anonSession = request.headers.get("x-mfl-session") ?? "";
        const signedIn = !!token && token.split(".").length === 3;

        if (!signedIn && !uuidRe.test(anonSession)) {
          return json({ error: "Sign in to use the analyst." }, 401);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const today = new Date().toISOString().slice(0, 10);
        const uiMessagesRaw = messages as UIMessage[];

        // ---- Signed-out trial: 3 questions per browser session, no history ----
        if (!signedIn) {
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

          const latestPrompt = uiMessagesRaw[uiMessagesRaw.length - 1]?.parts
            .map((p: any) => (p.type === "text" ? p.text : ""))
            .join(" ")
            .trim() || "";

          const formattedHistory = uiMessagesRaw.slice(0, -1).map((m: any) => ({
            role: m.role,
            content: m.parts.map((p: any) => (p.type === "text" ? p.text : "")).join(" ")
          }));

          const backendUrl = process.env["BACKEND_API_URL"] || "http://localhost:8000";
          const response = await fetch(`${backendUrl}/api/v1/analyst`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              prompt: latestPrompt,
              history: formattedHistory
            })
          });

          if (!response.ok) {
            const errMsg = await response.text();
            return json({ error: `Backend agent failed: ${errMsg}` }, 500);
          }

          const agentResult = (await response.json()) as { final_report: string };
          return new Response(agentResult.final_report, {
            headers: { "content-type": "text/plain; charset=utf-8" }
          });
        }

        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        const userId = userData?.user?.id;
        if (!userId) return json({ error: "Your session expired. Sign in again." }, 401);

        const { getServerPaddleEnvironment } = await import("@/lib/paddle.server");
        const { data: proFlag } = await supabaseAdmin.rpc("has_pro_access", {
          user_uuid: userId,
          check_env: getServerPaddleEnvironment(),
        });
        // Signed-in users get the full analyst while the open edition is live.
        const isPro = !!proFlag || isOpenEdition;

        // thread must belong to the caller
        const { data: thread } = await supabaseAdmin
          .from("agent_threads")
          .select("id,user_id,title")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread || thread.user_id !== userId) return json({ error: "Thread not found." }, 404);

        // Free users get the published quota; Pro is "unlimited" for humans but
        // still capped so a leaked token can't run up model spend.
        const cap = isPro ? PRO_DAILY_TURNS : FREE_DAILY_TURNS;
        const { data: usage } = await supabaseAdmin
          .from("agent_usage")
          .select("turns")
          .eq("user_id", userId)
          .eq("usage_date", today)
          .maybeSingle();
        const used = usage?.turns ?? 0;

        // Beyond the daily allowance, spend a purchased top-up question if one is left.
        if (used >= cap) {
          const { data: credit } = await supabaseAdmin
            .from("agent_credits")
            .select("credits,used")
            .eq("user_id", userId)
            .maybeSingle();
          const remaining = (credit?.credits ?? 0) - (credit?.used ?? 0);
          if (remaining <= 0) {
            return json(
              {
                error: isPro
                  ? `You've used today's ${PRO_DAILY_TURNS} analyst questions. Come back after midnight UTC.`
                  : `You've used your ${FREE_DAILY_TURNS} free analyst questions for today.`,
              },
              429,
            );
          }
          await supabaseAdmin
            .from("agent_credits")
            .update({ used: (credit?.used ?? 0) + 1, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        } else {
          await supabaseAdmin
            .from("agent_usage")
            .upsert(
              { user_id: userId, usage_date: today, turns: used + 1 },
              { onConflict: "user_id,usage_date" },
            );
        }

        const uiMessages = messages as UIMessage[];
        const last = uiMessages[uiMessages.length - 1];
        if (last?.role === "user") {
          const { error: insertError } = await supabaseAdmin.from("agent_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            sdk_message_id: last.id ?? null,
            parts: last.parts as unknown as never,
          });
          if (insertError) console.error("agent_messages insert (user)", insertError);

          const firstText = last.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join(" ")
            .trim();
          if (firstText && (thread.title === "New analysis" || !thread.title)) {
            await supabaseAdmin
              .from("agent_threads")
              .update({ title: firstText.slice(0, 70), updated_at: new Date().toISOString() })
              .eq("id", threadId);
          } else {
            await supabaseAdmin
              .from("agent_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId);
          }
        }

        const latestPrompt = last?.parts
          .map((p: any) => (p.type === "text" ? p.text : ""))
          .join(" ")
          .trim() || "";

        const formattedHistory = uiMessages.slice(0, -1).map((m: any) => ({
          role: m.role,
          content: m.parts.map((p: any) => (p.type === "text" ? p.text : "")).join(" ")
        }));

        const backendUrl = process.env["BACKEND_API_URL"] || "http://localhost:8000";
        const response = await fetch(`${backendUrl}/api/v1/analyst`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: latestPrompt,
            history: formattedHistory
          })
        });

        if (!response.ok) {
          const errMsg = await response.text();
          return json({ error: `Backend agent failed: ${errMsg}` }, 500);
        }

        const agentResult = (await response.json()) as { final_report: string };
        const finalAnswer = agentResult.final_report;

        // Insert assistant response into database
        const assistantMessageId = "msg-" + Math.random().toString(36).slice(2, 11);
        const assistantParts = [{ type: "text", text: finalAnswer }];
        
        const { error } = await supabaseAdmin.from("agent_messages").insert({
          thread_id: threadId,
          user_id: userId,
          role: "assistant",
          sdk_message_id: assistantMessageId,
          parts: assistantParts as unknown as never,
        });
        if (error) console.error("agent_messages insert (assistant)", error);

        return new Response(finalAnswer, {
          headers: { "content-type": "text/plain; charset=utf-8" }
        });
      },
    },
  },
});
