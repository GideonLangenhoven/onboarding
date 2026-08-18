import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let client: SupabaseClient | null = null;

/** Built on first use so a missing env var fails at runtime, not during the build. */
export function getSupabase() {
  if (!client) {
    if (!url || !anonKey) {
      throw new Error("This page is not set up yet. Please tell the person helping you.");
    }
    client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

type WizardResponse = { success?: boolean; error?: string };

/**
 * The only way this app talks to the backend. functions.invoke reports failures
 * two different ways: an `error` object for non-2xx, and a 200 body carrying
 * `success:false`. Both become a thrown Error with the server's message.
 */
export async function callWizard<T>(
  action: string,
  token: string,
  payload: Record<string, unknown> = {},
): Promise<T & WizardResponse> {
  const { data, error } = await getSupabase().functions.invoke("onboarding-wizard", {
    body: { action, token, ...payload },
  });

  if (error) {
    let message = error.message || "Something went wrong. Please try again.";
    const response = (error as { context?: Response }).context;
    if (response && typeof response.json === "function") {
      try {
        const body = (await response.json()) as WizardResponse;
        if (body?.error) message = body.error;
      } catch {
        // Body was not JSON. Keep the transport message.
      }
    }
    throw new Error(message);
  }

  const body = data as (T & WizardResponse) | null;
  if (!body || body.success === false) {
    throw new Error(body?.error || "Something went wrong. Please try again.");
  }
  return body;
}
