import { createServerFn } from "@tanstack/react-start";

/** Request a 6-digit OTP for an Indian mobile number. */
export const requestPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string }) => ({ phone: String(data?.phone ?? "") }))
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string; phone?: string }> => {
    const { toE164, randomCode, hashCode, sendSms, OTP_TTL_MINUTES } = await import(
      "@/lib/otp.server"
    );
    const phone = toE164(data.phone);
    if (!phone) return { ok: false, error: "Enter a valid mobile number (10 digits for India)." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("phone_otp")
      .select("sent_count,updated_at")
      .eq("phone", phone)
      .maybeSingle();

    const lastSentAt = existing?.updated_at ? new Date(existing.updated_at).getTime() : 0;
    const sinceLast = Date.now() - lastSentAt;

    if (lastSentAt && sinceLast < 30_000) {
      return { ok: false, error: "Please wait a few seconds before asking for another code." };
    }

    // Anti SMS-pumping: cap unverified sends per number. The row is deleted on a
    // successful verification, so genuine sign-ins never hit this ceiling.
    const MAX_SENDS_PER_HOUR = 5;
    const withinHour = lastSentAt && sinceLast < 60 * 60_000;
    if (withinHour && (existing?.sent_count ?? 0) >= MAX_SENDS_PER_HOUR) {
      return {
        ok: false,
        error: "Too many codes requested for this number. Try again in an hour.",
      };
    }


    const code = randomCode();
    const error = await sendSms(phone, code);
    if (error) return { ok: false, error };

    const now = new Date();
    await supabaseAdmin.from("phone_otp").upsert(
      {
        phone,
        code_hash: await hashCode(phone, code),
        attempts: 0,
        sent_count: (withinHour ? (existing?.sent_count ?? 0) : 0) + 1,
        expires_at: new Date(now.getTime() + OTP_TTL_MINUTES * 60_000).toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: "phone" },
    );

    return { ok: true, phone };
  });

/**
 * Verifies the OTP and hands back a one-time password the browser immediately
 * exchanges for a Supabase session (the password is rotated on every sign-in).
 */
export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string; code: string }) => ({
    phone: String(data?.phone ?? ""),
    code: String(data?.code ?? ""),
  }))
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; error?: string; phone?: string; password?: string }> => {
      const { toE164, hashCode, randomPassword, OTP_MAX_ATTEMPTS } = await import(
        "@/lib/otp.server"
      );
      const phone = toE164(data.phone);
      const code = data.code.replace(/\D/g, "");
      if (!phone || code.length !== 6) return { ok: false, error: "Enter the 6-digit code." };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row } = await supabaseAdmin
        .from("phone_otp")
        .select("code_hash,attempts,expires_at")
        .eq("phone", phone)
        .maybeSingle();

      if (!row) return { ok: false, error: "Ask for a new code." };
      if (new Date(row.expires_at).getTime() < Date.now()) {
        return { ok: false, error: "That code expired. Ask for a new one." };
      }
      if (row.attempts >= OTP_MAX_ATTEMPTS) {
        return { ok: false, error: "Too many attempts. Ask for a new code." };
      }
      if ((await hashCode(phone, code)) !== row.code_hash) {
        await supabaseAdmin
          .from("phone_otp")
          .update({ attempts: row.attempts + 1, updated_at: new Date().toISOString() })
          .eq("phone", phone);
        return { ok: false, error: "That code is not right." };
      }

      await supabaseAdmin.from("phone_otp").delete().eq("phone", phone);

      // Find or create the auth user for this phone, then rotate its password.
      const password = randomPassword();
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const digits = phone.replace(/^\+/, "");
      const found = list?.users?.find((u) => (u.phone ?? "").replace(/^\+/, "") === digits);

      if (found) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(found.id, { password });
        if (error) return { ok: false, error: error.message };
      } else {
        const { error } = await supabaseAdmin.auth.admin.createUser({
          phone,
          password,
          phone_confirm: true,
        });
        if (error) return { ok: false, error: error.message };
      }

      return { ok: true, phone, password };
    },
  );
