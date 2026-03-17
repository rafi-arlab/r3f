/**
 * Progress bar for collected beans. Bar only, no text (text is on the pour button).
 */
export function BeanProgressBar({ visible, collected, total }) {
  if (!visible) return null;
  const progress = total > 0 ? Math.min(1, collected / total) : 0;

  return (
    <div className="bean-progress" aria-valuenow={collected} aria-valuemin={0} aria-valuemax={total} role="progressbar">
      <div className="bean-progress__bar">
        <div className="bean-progress__fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
