import { createServerFn } from "@tanstack/react-start";

/** Fund-house published PDFs for a scheme, with the page its section starts on. */
export const getFundDocuments = createServerFn({ method: "POST" })
  .inputValidator((input: { fundName: string }) => {
    if (!input.fundName?.trim()) throw new Error("Fund name is required.");
    return input;
  })
  .handler(async ({ data }) => {
    const { fundDocuments } = await import("@/lib/doc-pages.server");
    return fundDocuments(data.fundName);
  });
