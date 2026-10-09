import { Link } from 'react-router';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useInsights, useRefreshInsights } from './api';

const TONES = {
  positive: { icon: CheckCircle2, className: 'text-success' },
  warning: { icon: AlertTriangle, className: 'text-warning' },
  info: { icon: Info, className: 'text-primary' },
};

export function InsightsCard({ className }) {
  const { data, isLoading } = useInsights();
  const refresh = useRefreshInsights();
  const isAi = data?.source === 'ai';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary size-4" /> Insights
          {data && (
            <Badge variant="outline" className="font-normal">
              {isAi ? 'AI' : 'Smart rules'}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {data?.generatedAt
            ? `This month · updated ${formatRelative(data.generatedAt)}`
            : 'This month at a glance'}
        </CardDescription>
        {data?.ai?.configured && data.ai.enabled && (
          <CardAction>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => refresh.mutate()}
                  disabled={refresh.isPending}
                  aria-label="Regenerate insights"
                >
                  {refresh.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Regenerate</TooltipContent>
            </Tooltip>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : data ? (
          <>
            <div className="space-y-1">
              <p className="font-medium">{data.report.headline}</p>
              <p className="text-muted-foreground text-sm">
                {data.report.summary}
              </p>
            </div>
            {data.report.insights.length > 0 && (
              <ul className="space-y-3">
                {data.report.insights.map((insight) => {
                  const tone = TONES[insight.tone] ?? TONES.info;
                  return (
                    <li key={insight.title} className="flex gap-3">
                      <tone.icon
                        className={cn('mt-0.5 size-4 shrink-0', tone.className)}
                      />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {insight.detail}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {data.report.actions?.length > 0 && (
              <div className="bg-muted/50 rounded-md p-3">
                <p className="mb-1.5 text-xs font-medium tracking-wide uppercase">
                  Suggested next steps
                </p>
                <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-sm">
                  {data.report.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.ai?.configured && !data.ai.enabled && (
              <p className="text-muted-foreground text-xs">
                Want a personalised AI briefing?{' '}
                <Link
                  to="/settings?tab=ai"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Turn on AI insights
                </Link>
                .
              </p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
