import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { S3_PATHS } from "./s3-layout";

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
