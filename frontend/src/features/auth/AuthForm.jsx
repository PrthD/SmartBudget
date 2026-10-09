import { useState } from 'react';
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
import { SLOW_WAIT_STAGES, useWaitStage } from '@/hooks/use-wait-stage';
import { useAuth } from './hooks';
import { PasswordInput } from './PasswordInput';
import { LoginSchema, RegisterSchema } from './schemas';

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
  const waitStage = useWaitStage(pending, SLOW_WAIT_STAGES);

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
      {waitStage > 0 && (
        <Alert role="status">
          <Loader2 className="animate-spin" />
          <AlertDescription>
            {waitStage === 1
              ? 'Hang tight, this is taking a little longer than usual.'
              : 'Still working on it. This can occasionally take up to a minute.'}
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
            {pending
              ? isRegister
                ? 'Creating your account…'
                : 'Signing in…'
              : isRegister
                ? 'Create account'
                : 'Sign in'}
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
