import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from './AuthProvider';
import { AuthForm } from './AuthForm';

function renderForm(mode, auth) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ status: 'anonymous', ...auth }}>
        <AuthForm mode={mode} />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('AuthForm', () => {
  it('validates before calling the API', async () => {
    const register = vi.fn();
    renderForm('register', { register });
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' })
    );

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('signs in and surfaces server errors', async () => {
    const login = vi
      .fn()
      .mockRejectedValueOnce(new Error('Invalid email or password.'));
    renderForm('login', { login });
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'whatever1');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'whatever1',
    });
    expect(
      await screen.findByText('Invalid email or password.')
    ).toBeInTheDocument();
  });

  it('lets the user reveal the password', async () => {
    renderForm('login', { login: vi.fn() });
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(
      screen.getByRole('button', { name: 'Show password' })
    );
    expect(input).toHaveAttribute('type', 'text');
  });
});
