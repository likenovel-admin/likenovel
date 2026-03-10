interface FullPageLoaderProps {
  isLoading: boolean;
  label?: string;
  progressText?: string;
}

export default function FullPageLoader({
  isLoading,
  label,
  progressText,
}: FullPageLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      <div className="flex flex-col items-center gap-3">
        <div className="h-16 w-16 animate-spin rounded-full border-8 border-gray-200 border-t-blue-600" />
        {label ? <p className="text-sm font-medium text-[#1F2124]">{label}</p> : null}
        {progressText ? <p className="text-xs text-[#5F6675]">{progressText}</p> : null}
      </div>
    </div>
  );
}
