import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { S3_PATHS } from "./s3-layout";

const CONTACT_RECIPIENT = "sandip.prodhan@pabtechnologies.com";

async function sendContactEmail(data: {
  name: string;
  email: string;
  phone: string;
  portfolioDetails: string;
  investmentHorizon: string;
  monthlySipOrLumpsum: string;
}) {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["CONTACT_FROM_EMAIL"];

  if (!apiKey || !from) {
    throw new Error("Contact email is not configured. Please try again later.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [CONTACT_RECIPIENT],
      reply_to: data.email,
      subject: `FundLens contact request from ${data.name}`,
      text: [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Phone / subject: ${data.phone || "Not provided"}`,
        `Investment horizon: ${data.investmentHorizon}`,
        `Monthly SIP / lump sum: ${data.monthlySipOrLumpsum || "Not provided"}`,
        "",
        "Request details:",
        data.portfolioDetails,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    console.error("Contact email delivery failed:", await response.text());
    throw new Error("We could not send your message. Please try again later.");
  }
}

export const submitPortfolioRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2, "Name must be at least 2 characters"),
        email: z.string().trim().email("Invalid email address"),
        phone: z.string().trim().optional().default(""),
        portfolioDetails: z
          .string()
          .trim()
          .min(5, "Please share a few details about your funds or portfolio"),
        investmentHorizon: z.string().trim().optional().default("3-5 Years"),
        monthlySipOrLumpsum: z.string().trim().optional().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { s3PutJSON, isS3Configured } = await import("./s3.server");
    await sendContactEmail(data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const payload = {
      ...data,
      submittedAt: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "SSR",
    };

    if (isS3Configured()) {
      const key = S3_PATHS.portfolioRequest(data.name, timestamp);
      await s3PutJSON(key, payload);
    }

    // Also persist in Supabase if configured (optional backup)
    if (process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("portfolio_requests" as any).insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          portfolio_details: data.portfolioDetails,
          investment_horizon: data.investmentHorizon,
          created_at: new Date().toISOString(),
        } as any);
      } catch {
        /* S3 is primary */
      }
    }

    return {
      success: true,
      message:
        "Your portfolio details have been received! Our quantitative team will analyze your portfolio-level Sharpe, Sortino, and Treynor ratios and get back to you shortly.",
    };
  });
