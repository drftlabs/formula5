"use client";
import { useTransition } from "react";
import { setMessageStatus } from "@/lib/actions/admin";
export default function MessageStatus({ id, status }) {
  const [pending, start] = useTransition();
  return <select className="in" style={{ width: 140 }} defaultValue={status} disabled={pending} onChange={(e) => start(() => setMessageStatus(id, e.target.value))}><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select>;
}
