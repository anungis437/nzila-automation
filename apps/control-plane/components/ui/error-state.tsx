import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
}

export function ErrorState({ title = "Something went wrong", message }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}
