import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Loader2, ShieldAlert, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useAuth, useCurrentUser } from '@/features/auth/hooks';
import { PasswordInput } from '@/features/auth/PasswordInput';
import { useAiStatus } from '@/features/ai/api';
import { email, newPassword } from '@/features/auth/schemas';
import { downloadFile } from '@/lib/csv';
import { compressImage } from '@/lib/image';
import { CurrencySelect, TimeZoneSelect } from './PreferenceFields';
import {
  exportData,
  useAvatar,
  useChangeEmail,
  useChangePassword,
  useDeleteAccount,
  useUpdateProfile,
} from './api';

function ProfileTab({ user }) {
  const update = useUpdateProfile({ successMessage: 'Profile updated' });
  const avatar = useAvatar();
  const fileInput = useRef(null);
  const form = useForm({
    resolver: zodResolver(
      z.object({ name: z.string().trim().min(1, 'Name is required').max(80) })
    ),
    values: { name: user.name },
  });

  const onPickPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      avatar.mutate(await compressImage(file, { maxSize: 256, square: true }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>How you appear in SmartBudget.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={onPickPhoto}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInput.current?.click()}
              disabled={avatar.isPending}
            >
              {avatar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Upload photo
            </Button>
            {user.hasPhoto && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => avatar.mutate(null)}
                disabled={avatar.isPending}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
        <Form {...form}>
          <form
            id="profile-form"
            onSubmit={form.handleSubmit((values) => update.mutate(values))}
            className="max-w-sm"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="border-t">
        <Button
          type="submit"
          form="profile-form"
          disabled={update.isPending || !form.formState.isDirty}
        >
          {update.isPending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}

function PreferencesTab({ user }) {
  const update = useUpdateProfile();
  const [currency, setCurrency] = useState(user.preferences.currency);
  const [timezone, setTimezone] = useState(user.preferences.timezone);
  const dirty =
    currency !== user.preferences.currency ||
    timezone !== user.preferences.timezone;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Currency and time zone used across the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-xl gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pref-currency">Currency</Label>
          <CurrencySelect
            id="pref-currency"
            value={currency}
            onChange={setCurrency}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pref-timezone">Time zone</Label>
          <TimeZoneSelect
            id="pref-timezone"
            value={timezone}
            onChange={setTimezone}
          />
        </div>
        {timezone !== user.preferences.timezone && (
          <Alert className="sm:col-span-2">
            <ShieldAlert />
            <AlertTitle>
              Existing dates are read in the new time zone
            </AlertTitle>
            <AlertDescription>
              Entries you already logged keep their stored moment in time.
              Moving several hours west can make them appear a day earlier.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="border-t">
        <Button
          onClick={() => update.mutate({ preferences: { currency, timezone } })}
          disabled={!dirty || update.isPending}
        >
          {update.isPending && <Loader2 className="size-4 animate-spin" />}
          Save preferences
        </Button>
      </CardFooter>
    </Card>
  );
}

function EmailCard({ user }) {
  const change = useChangeEmail();
  const form = useForm({
    resolver: zodResolver(
      z.object({
        email,
        currentPassword: z.string().min(1, 'Enter your current password'),
      })
    ),
    defaultValues: { email: user.email, currentPassword: '' },
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email</CardTitle>
        <CardDescription>
          Used to sign in. Confirm with your current password.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            await change.mutateAsync(values);
            form.reset({ email: values.email, currentPassword: '' });
          })}
          noValidate
        >
          <CardContent className="grid max-w-xl gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="mt-6 border-t">
            <Button type="submit" disabled={change.isPending}>
              {change.isPending && <Loader2 className="size-4 animate-spin" />}
              Update email
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function PasswordCard() {
  const change = useChangePassword();
  const form = useForm({
    resolver: zodResolver(
      z
        .object({
          currentPassword: z.string().min(1, 'Enter your current password'),
          newPassword,
          confirm: z.string(),
        })
        .refine((v) => v.newPassword === v.confirm, {
          path: ['confirm'],
          message: "Passwords don't match",
        })
    ),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Changing it signs you out on all other devices.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            async ({ currentPassword, newPassword: next }) => {
              await change.mutateAsync({ currentPassword, newPassword: next });
              form.reset();
            }
          )}
          noValidate
        >
          <CardContent className="grid max-w-xl gap-4 sm:grid-cols-2">
            {[
              ['currentPassword', 'Current password', 'current-password'],
              ['newPassword', 'New password', 'new-password'],
              ['confirm', 'Confirm new password', 'new-password'],
            ].map(([name, label, autoComplete]) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem
                    className={
                      name === 'currentPassword'
                        ? 'sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]'
                        : ''
                    }
                  >
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete={autoComplete} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
          <CardFooter className="mt-6 border-t">
            <Button type="submit" disabled={change.isPending}>
              {change.isPending && <Loader2 className="size-4 animate-spin" />}
              Change password
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function PrivacyTab({ user }) {
  const update = useUpdateProfile();
  const { data: aiStatus } = useAiStatus();
  const remove = useDeleteAccount();
  const { forceLogout } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      const data = await exportData();
      downloadFile(
        'smartbudget-export.json',
        JSON.stringify(data, null, 2),
        'application/json'
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI features</CardTitle>
          <CardDescription>
            Smart add (natural language and receipts) and personalised insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-6 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="ai-toggle">Use AI (Google Gemini)</Label>
              <p className="text-muted-foreground text-sm">
                When on, the text or receipt you submit to Smart add — and an
                anonymous summary of your monthly totals for insights — is sent
                to Google's Gemini API. Your name and email are never shared. On
                Gemini's free tier, Google may use submitted content to improve
                its products.
              </p>
              <p className="text-muted-foreground text-sm">
                When off, SmartBudget uses built-in rules for both features.
                Nothing leaves our servers.
              </p>
            </div>
            <Switch
              id="ai-toggle"
              checked={user.preferences.aiEnabled}
              disabled={update.isPending || aiStatus?.configured === false}
              onCheckedChange={(aiEnabled) =>
                update.mutate({ preferences: { aiEnabled } })
              }
            />
          </div>
          {aiStatus?.configured === false && (
            <Alert>
              <ShieldAlert />
              <AlertTitle>AI isn&apos;t available on this server</AlertTitle>
              <AlertDescription>
                No Gemini API key is configured, so Smart add and Insights use
                the built-in rules.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>
            Download everything SmartBudget stores about you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export as JSON
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Delete account</CardTitle>
          <CardDescription>
            Permanently deletes your account and all of your data. This can't be
            undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              All expenses, income, budgets and goals are deleted immediately.
              Enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await remove.mutateAsync(password);
              toast.success('Your account was deleted.');
              forceLogout();
            }}
            className="space-y-4"
          >
            <PasswordInput
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-label="Password"
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!password || remove.isPending}
              >
                {remove.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Delete forever
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const TABS = ['profile', 'preferences', 'security', 'ai'];

export function SettingsPage() {
  const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'profile';
  if (!user) return null;

  return (
    // Forms read best in a narrower column than the data pages.
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, preferences and account security."
      />
      <Tabs
        value={tab}
        onValueChange={(value) => setParams({ tab: value }, { replace: true })}
      >
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="ai">AI &amp; privacy</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <ProfileTab user={user} />
        </TabsContent>
        <TabsContent value="preferences" className="mt-4">
          <PreferencesTab
            key={`${user.preferences.currency}-${user.preferences.timezone}`}
            user={user}
          />
        </TabsContent>
        <TabsContent value="security" className="mt-4 space-y-6">
          <EmailCard user={user} />
          <PasswordCard />
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <PrivacyTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
