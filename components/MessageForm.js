"use client";
import { useFormState, useFormStatus } from "react-dom";
import { submitMessage } from "@/lib/actions/forms";

function Submit({ label }) { const { pending } = useFormStatus(); return <button className="btn formbtn" disabled={pending}>{pending ? "Sending…" : label}</button>; }

export default function MessageForm({ type }) {
  const [state, action] = useFormState(submitMessage, null);
  const complaint = type === "complaint";
  if (state?.ok) return <div className="msg-ok" role="status"><b>{complaint ? "Complaint received." : "Message sent."}</b><br />Your reference is <b>{state.ref}</b>. {complaint ? "We will acknowledge it within 48 hours and aim to resolve it within one month." : "We'll get back to you by email."} A copy of this reference has been emailed to you.</div>;
  return (
    <form className="form" action={action}>
      <input type="hidden" name="type" value={type} />
      <div className="hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="row">
        <div className="field"><label htmlFor="n">Full name</label><input id="n" name="name" required autoComplete="name" /></div>
        <div className="field"><label htmlFor="em">Email</label><input id="em" name="email" type="email" required autoComplete="email" /></div>
      </div>
      <div className="row">
        <div className="field"><label htmlFor="ph">Phone (optional)</label><input id="ph" name="phone" type="tel" autoComplete="tel" /></div>
        <div className="field"><label htmlFor="on">Order number {complaint ? "(if any)" : "(optional)"}</label><input id="on" name="order_number" placeholder="TK-1001" /></div>
      </div>
      {complaint ? (
        <div className="field"><label htmlFor="cat">Complaint about</label><select id="cat" name="category" required defaultValue=""><option value="" disabled>Select</option>{["Delivery delay", "Damaged or wrong item", "Product quality", "Refund or payment", "Return or exchange", "Website or account", "Customer service", "Other"].map((c) => <option key={c}>{c}</option>)}</select></div>
      ) : (
        <div className="field"><label htmlFor="su">Subject</label><input id="su" name="subject" required maxLength={160} /></div>
      )}
      <div className="field"><label htmlFor="m">{complaint ? "What happened?" : "Message"}</label><textarea id="m" name="message" required minLength={10} maxLength={5000} /></div>
      {state?.error && <p className="msg-err" role="alert">{state.error}</p>}
      <Submit label={complaint ? "Submit complaint" : "Send message"} />
    </form>
  );
}
