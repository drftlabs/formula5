import "./admin.css";
export const metadata = { title: "Formula 5 Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function AdminRoot({ children }) { return <div className="adm">{children}</div>; }
