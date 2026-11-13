export const Star = ({ off }) => <svg viewBox="0 0 24 24" className={off ? "off" : ""}><path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.8 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8L12 3z" /></svg>;

// Five gold stars; the last one is filled partially for decimals (e.g. 4.6).
export const Stars = ({ value = 0 }) => (
  <span className="stars" role="img" aria-label={`${value} out of 5`}>
    {[0, 1, 2, 3, 4].map((n) => { const f = Math.max(0, Math.min(1, value - n)); return <i key={n} style={{ "--f": f * 100 + "%" }}><Star /></i>; })}
  </span>
);
