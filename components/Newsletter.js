"use client";
import { useFormState, useFormStatus } from "react-dom";
import { subscribe } from "@/lib/actions/forms";

function Go() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending}>{pending ? "Subscribing…" : "Subscribe"}</button>; }
export default function Newsletter() {
  const [s, act] = useFormState(subscribe, {});
  if (s?.ok) return <p className="f5-nmsg" role="status">Thank you. You're on the list.</p>;
  return (
    <form className="f5-nform" action={act}>
      <label className="sr" htmlFor="nl-email">Email address</label>
      <input id="nl-email" name="email" type="email" placeholder="Your email address" autoComplete="email" required />
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <Go />
      {s?.error && <p className="f5-nmsg err" role="alert" style={{ flexBasis: "100%" }}>{s.error}</p>}
    </form>
  );
}
