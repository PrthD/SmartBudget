import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from './hooks';
import { PasswordInput } from './PasswordInput';
import { LoginSchema, RegisterSchema } from './schemas';

// The API sleeps on Render's free tier; the first request can take ~30s.
const SLOW_SERVER_MS = 4000;

function useSlowNotice(pending) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!pending) return undefined;
    const timer = setTimeout(() => setSlow(true), SLOW_SERVER_MS);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [pending]);
  return pending && slow;
}

/** Sign-in and sign-up share one form; `mode` decides fields and wording. */
export function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const auth = useAuth();
  const [error, setError] = useState(null);
  const form = useForm({
    resolver: zodResolver(isRegister ? RegisterSchema : LoginSchema),
    defaultValues: isRegister
      ? { name: '', email: '', password: '' }
      : { email: '', password: '' },
  });
  const pending = form.formState.isSubmitting;
  const slow = useSlowNotice(pending);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await (isRegister ? auth.register(values) : auth.login(values));
    } catch (err) {
      setError(err.message);
    }
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isRegister
            ? 'Start managing your money in minutes.'
            : 'Sign in to continue to SmartBudget.'}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {slow && (
        <Alert>
          <Loader2 className="animate-spin" />
          <AlertDescription>
            Waking up the server — this can take up to 30 seconds the first
            time.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {isRegister && (
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      placeholder="Your full name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete={
                      isRegister ? 'new-password' : 'current-password'
                    }
                    {...field}
                  />
                </FormControl>
                {isRegister && (
                  <FormDescription>
                    At least 8 characters with a letter and a number.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground text-center text-sm">
        {isRegister ? 'Already have an account? ' : "Don't have an account? "}
        <Link
          to={isRegister ? '/login' : '/signup'}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          {isRegister ? 'Sign in' : 'Create one'}
        </Link>
      </p>
    </div>
  );
}

export const LoginPage = () => <AuthForm mode="login" />;
export const RegisterPage = () => <AuthForm mode="register" />;
