import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
  size?: number;
}

export function LoadingIndicator({ message, size = 48 }: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
      <Loader2 className="animate-spin text-primary" style={{ width: size, height: size }} />
      {message && <p className="text-lg">{message}</p>}
    </div>
  );
}
