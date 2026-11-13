"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";

// Passwordless: customers get a one-time code by email. Works for sign up AND log in, and for accounts created at checkout.
export default function LoginForm() {
  const [step, setStep] = useState("email"), [email, setEmail] = useState(""), [code, setCode] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const router = useRouter();
  async function send(e) {
    e.preventDefault(); setErr(""); setBusy(true);
    const { error } = await browserClient().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
    setBusy(false); if (error) return setErr(error.message); setStep("code");
  }
  async function verify(e) {
    e.preventDefault(); setErr(""); setBusy(true);
    const { error } = await browserClient().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
    setBusy(false); if (error) return setErr("That code didn't work. Check it and try again, or request a new one.");
    router.replace("/account"); router.refresh();
  }
  if (step === "email") return (
    <form className="form" onSubmit={send}>
      <div className="field"><label htmlFor="e">Email</label><input id="e" type="email" required autoComplete="email" value={email} onChange={(x) => setEmail(x.target.value)} /><p className="hint">New here? Same step: we'll create your account. No password needed.</p></div>
      {err && <p className="msg-err" role="alert">{err}</p>}
      <button className="btn formbtn" disabled={busy}>{busy ? "Sending…" : "Email me a code"}</button>
    </form>
  );
  return (
    <form className="form" onSubmit={verify}>
      <p className="msg-ok">We sent a code to <b>{email}</b>. It can take a minute. Check spam too.</p>
      <div className="field"><label htmlFor="c">Code</label><input id="c" required inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code} onChange={(x) => setCode(x.target.value)} /></div>
      {err && <p className="msg-err" role="alert">{err}</p>}
      <button className="btn formbtn" disabled={busy}>{busy ? "Checking…" : "Log in"}</button>
      <button type="button" className="link" style={{ justifySelf: "start" }} onClick={() => { setStep("email"); setCode(""); }}>Use a different email</button>
    </form>
  );
}
