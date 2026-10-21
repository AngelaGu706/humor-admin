"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function LoginButton({ failed }: { failed: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(failed ? "Sign-in could not be completed. Please try again." : "");
  async function login() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
    } catch { setError("Could not start Google sign-in. Please try again."); setBusy(false); }
  }
  return <><button className="google-button" onClick={login} disabled={busy}><span className="google-g">G</span>{busy ? "Connecting…" : "Continue with Google"}</button>{error && <p className="notice error" role="alert">{error}</p>}</>;
}
