import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Loader2, LogIn, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DotGridBackground } from '@/components/ui/dot-grid-background';
import logo from '@/assets/logo-full.webp';

export function LoginPage() {
  const { isAuthenticated, isLoggingIn, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4">
      <DotGridBackground className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.75)_0%,transparent_100%)]" />

      <div className="relative w-full max-w-sm">
        <div
          className="absolute -inset-8 -z-10 rounded-[2rem] bg-primary/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
            aria-hidden="true"
          />

          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 inline-flex items-center rounded-lg bg-white/95 px-3.5 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_24px_-4px_rgba(0,230,118,0.5)]">
              <img src={logo} alt="Booklynk EV" className="h-7 w-auto" />
            </div>
            <h1 className="font-display text-lg font-semibold text-foreground">Admin Portal</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to view leads and payments
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-lg border border-input bg-background/60 py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-input bg-background/60 py-2.5 pl-10 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_-6px_rgba(0,230,118,0.6)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingIn ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" aria-hidden="true" />
              )}
              Sign in
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-white/5 pt-5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Restricted to authorized Booklynk EV staff
          </div>
        </div>
      </div>
    </div>
  );
}
