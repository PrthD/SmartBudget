import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from './EmptyState';

export function ErrorState({ error, onRetry, className }) {
  return (
    <EmptyState
      className={className}
      icon={AlertTriangle}
      title="Couldn't load this"
      description={error?.message ?? 'Something went wrong.'}
      action={
        onRetry && (
          <Button variant="outline" size="sm" onClick={() => onRetry()}>
            Try again
          </Button>
        )
      }
    />
  );
}
