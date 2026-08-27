import { createServerFn } from "@tanstack/react-start";

/** Value Research + Morningstar star ratings for a scheme (cached server-side). */
export const getFundRatings = createServerFn({ method: "POST" })
  .inputValidator((input: { fundName: string }) => {
    const fundName = input.fundName?.trim();
    if (!fundName) throw new Error("Fund name is required.");
    if (fundName.length > 160) throw new Error("Fund name is too long.");
    return { fundName };
  })
  .handler(async ({ data }) => {
    const { getRatingsCached } = await import("@/lib/ratings.server");
    return getRatingsCached(data.fundName);
  });
