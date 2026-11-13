export default function Loading() {
  return (
    <div className="ldg" role="status" aria-live="polite">
      <img src="/logo.png" alt="" width="908" height="160" />
      <div className="ldg-bar"><i /></div>
      <p>Loading</p>
    </div>
  );
}
