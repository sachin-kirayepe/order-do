export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 rounded-xl ${className}`}
    >
      <div className="absolute inset-0 shimmer" />
    </div>
  );
}
