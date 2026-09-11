import { GlobalErrorSurface } from "@/hooks/useErrorBoundary";

export default function NotFound() {
  return <GlobalErrorSurface kind="not-found" />;
}
