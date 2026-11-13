export default function Loading() {
  return (
    <div className="ldg" role="status" aria-live="polite">
      <img src="/logo.png" alt="" width="816" height="208" />
      <div className="ldg-bar"><i /></div>
      <p>Loading</p>
    </div>
  );
}
