import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LogoMark } from '@/components/common/Logo';
import { useCurrentUser } from '@/features/auth/hooks';
import { browserTimeZone } from '@/lib/dates';
import { CurrencySelect, TimeZoneSelect } from './PreferenceFields';
import { useUpdateProfile } from './api';

function OnboardingForm({ user, onFinish, pending }) {
  const [currency, setCurrency] = useState(user.preferences.currency);
  // Accounts from v1 may already hold dates stored in the old default zone;
  // only brand-new accounts default to the browser's zone.
  const [timezone, setTimezone] = useState(() =>
    Date.now() - new Date(user.createdAt).getTime() < 86_400_000
      ? browserTimeZone()
      : user.preferences.timezone
  );
  const [aiEnabled, setAiEnabled] = useState(false);
  const finish = () => onFinish({ currency, timezone, aiEnabled });

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="onboarding-currency">Currency</Label>
          <CurrencySelect
            id="onboarding-currency"
            value={currency}
            onChange={setCurrency}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="onboarding-timezone">Time zone</Label>
          <TimeZoneSelect
            id="onboarding-timezone"
            value={timezone}
            onChange={setTimezone}
          />
          <p className="text-muted-foreground text-xs">
            Decides when your days, weeks and months begin.
          </p>
        </div>
        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <div className="space-y-1">
            <Label htmlFor="onboarding-ai">AI features</Label>
            <p className="text-muted-foreground text-xs">
              Receipt scanning and AI insights via Google Gemini. Only summaries
              are shared — never your name or email. You can change this any
              time.
            </p>
          </div>
          <Switch
            id="onboarding-ai"
            checked={aiEnabled}
            onCheckedChange={setAiEnabled}
          />
        </div>
      </div>
      <DialogFooter>
        <Button className="w-full" onClick={finish} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Get started
        </Button>
      </DialogFooter>
    </>
  );
}

/** First sign-in: confirm currency/time zone and opt in to AI (or not). */
export function OnboardingDialog() {
  const user = useCurrentUser();
  const update = useUpdateProfile({ successMessage: null });
  const [dismissed, setDismissed] = useState(false);
  const open = Boolean(user?.isFirstTimeLogin) && !dismissed;

  const finish = async (preferences) => {
    setDismissed(true);
    await update.mutateAsync({
      onboarded: true,
      ...(preferences ? { preferences } : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && finish()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <LogoMark className="mb-2 size-10" />
          <DialogTitle>
            Welcome to SmartBudget
            {user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </DialogTitle>
          <DialogDescription>
            Two quick settings and you're ready to go.
          </DialogDescription>
        </DialogHeader>
        {user && (
          <OnboardingForm
            user={user}
            onFinish={finish}
            pending={update.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
