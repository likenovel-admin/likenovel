interface FullPageLoaderProps {
  isLoading: boolean;
}

export default function FullPageLoader({ isLoading }: FullPageLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-50">
      <div className="h-16 w-16 border-8 border-t-8 border-gray-200 rounded-full animate-spin border-t-blue-600" />
    </div>
  );
}
