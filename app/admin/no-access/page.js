import SignOutBtn from "@/components/admin/SignOutBtn";

export default function NoAccess() {
  return (
    <div className="login"><div>
      <img src="/logo.png" alt="Taeken" width="56" style={{ marginBottom: 16 }} />
      <h1>No access</h1>
      <p className="sub" style={{ marginBottom: 18 }}>Your account doesn&apos;t have access to any admin tab yet. Ask the store owner to give your role some access (Settings → Team &amp; roles).</p>
      <SignOutBtn />
    </div></div>
  );
}
