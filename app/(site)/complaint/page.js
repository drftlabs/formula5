import Link from "next/link";
import MessageForm from "@/components/MessageForm";
export const metadata = { title: "Raise a complaint" };
export default function Complaint() {
  return (
    <div className="page"><div className="wrap" style={{ maxWidth: 720 }}>
      <div className="crumbs"><Link href="/">Home</Link><span>Complaint</span></div>
      <h1 className="page-title">Raise a <em>complaint</em></h1>
      <p className="lead">Something went wrong? Tell us and we'll make it right. We acknowledge every complaint within 48 hours. See our <Link className="link" href="/policies/grievance">Grievance Redressal</Link> policy.</p>
      <MessageForm type="complaint" />
    </div></div>
  );
}
