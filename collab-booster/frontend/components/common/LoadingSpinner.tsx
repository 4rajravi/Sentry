export function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-zinc-600">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500/70 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
