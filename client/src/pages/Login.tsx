import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { UserRepository, StoreRepository } from '../db/repository';
import { resetDevDatabase } from '../db/seed';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { PinInput } from '../components/PinInput';
import { ChangePinDialog } from '../components/ChangePinDialog';
import { LogIn, Store, Eye, EyeOff, AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const LAST_EMAIL_KEY = 'pos_last_email';

// ─── Shared primitives ────────────────────────────────────────────────────────

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/[0.07] px-3.5 py-3">
      <AlertCircle className="mt-px size-4 shrink-0 text-destructive" />
      <p className="text-sm text-destructive leading-snug">{message}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
  );
}

function PinRevealField({
  label,
  value,
  onChange,
  reveal,
  onToggleReveal,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  reveal: boolean;
  onToggleReveal: () => void;
  autoFocus?: boolean;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <PinInput value={value} onChange={onChange} reveal={reveal} length={5} autoFocus={autoFocus} />
        <button
          type="button"
          onClick={onToggleReveal}
          tabIndex={-1}
          aria-label={reveal ? 'Hide PIN' : 'Show PIN'}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </Field>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginForm() {
  const [email, setEmail]     = useState(() => localStorage.getItem(LAST_EMAIL_KEY) || '');
  const [pin, setPin]         = useState('');
  const [showPin, setShowPin] = useState(false);
  const [mustChangePin, setMustChangePin] = useState(false);
  const emailRef              = useRef<HTMLInputElement>(null);
  const { login, error, loading } = useAuth();
  const storeLogin = useAuthStore(s => s.login);
  const navigate   = useNavigate();

  useEffect(() => {
    if (!email) emailRef.current?.focus();
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await login(email, pin);
    console.log('[LoginForm] Login result:', { mustChangePin: user?.mustChangePin, role: user?.role, name: user?.name });
    if (user) {
      localStorage.setItem(LAST_EMAIL_KEY, email);
      storeLogin(user);
      if (user.mustChangePin) {
        console.log('[LoginForm] mustChangePin is TRUE — showing dialog');
        setMustChangePin(true);
      } else {
        console.log('[LoginForm] mustChangePin is falsy — navigating to POS');
        toast.success(`Welcome back, ${user.name}!`);
        navigate(user.role === 'admin' ? '/dashboard' : '/pos');
      }
    }
  };

  const handlePinChanged = () => {
    setMustChangePin(false);
    const user = useAuthStore.getState().user;
    if (user) {
      toast.success(`Welcome, ${user.name}!`);
      navigate(user.role === 'admin' ? '/dashboard' : '/pos');
    }
  };

  return (
    <>
      <PageHeader title="Sign in" description="Enter your email and PIN to continue." />

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input
            ref={emailRef}
            id="email"
            type="email"
            placeholder="you@pharmacy.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            required
            className="h-11"
          />
        </Field>

        <PinRevealField
          label="PIN"
          value={pin}
          onChange={setPin}
          reveal={showPin}
          onToggleReveal={() => setShowPin(v => !v)}
          autoFocus={!!email}
        />

        <Button
          type="submit"
          disabled={loading || pin.length !== 5}
          className="w-full h-11 gap-2 mt-2"
        >
          {loading ? <><Spinner /> Signing in…</> : <><LogIn className="size-4" /> Sign in</>}
        </Button>
      </form>

      <ChangePinDialog
        open={mustChangePin}
        onOpenChange={setMustChangePin}
        onCompleted={handlePinChanged}
      />
    </>
  );
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────

function SetupWizardForm({ onComplete }: { onComplete: () => void }) {
  const [storeName,   setStoreName]   = useState('');
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [pin,         setPin]         = useState('');
  const [confirmPin,  setConfirmPin]  = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  const { register: registerUser } = useAuth();
  const storeLogin = useAuthStore(s => s.login);
  const navigate   = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 5)     { setError('PIN must be exactly 5 digits.');   return; }
    if (pin !== confirmPin)   { setError('PINs do not match.');               return; }

    setLoading(true);
    try {
      await StoreRepository.set('storeName', storeName);
      const user = await registerUser({ name, email, pin, role: 'admin' });
      if (user) {
        localStorage.setItem(LAST_EMAIL_KEY, email);
        storeLogin(user);
        toast.success('Pharmacy setup complete!');
        navigate('/dashboard');
      }
    } catch {
      setError('Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Set up your pharmacy"
        description="Create the admin account to get started."
      />

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Pharmacy name" htmlFor="storeName">
          <Input
            id="storeName"
            placeholder="e.g. City Pharmacy"
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            autoComplete="organization"
            required
            className="h-11"
          />
        </Field>

        <Field label="Your name" htmlFor="adminName">
          <Input
            id="adminName"
            placeholder="Jane Doe"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="name"
            required
            className="h-11"
          />
        </Field>

        <Field label="Email" htmlFor="adminEmail">
          <Input
            id="adminEmail"
            type="email"
            placeholder="admin@pharmacy.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="h-11"
          />
        </Field>

        <PinRevealField
          label="PIN (5 digits)"
          value={pin}
          onChange={setPin}
          reveal={false}
          onToggleReveal={() => {}}
        />

        <PinRevealField
          label="Confirm PIN"
          value={confirmPin}
          onChange={setConfirmPin}
          reveal={showConfirm}
          onToggleReveal={() => setShowConfirm(v => !v)}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 gap-2 mt-2"
        >
          {loading
            ? <><Spinner /> Setting up…</>
            : <><Store className="size-4" /> Create admin account</>}
        </Button>
      </form>
    </>
  );
}

// ─── Root export — switches between login and setup ───────────────────────────

function Login() {
  const [isSetup, setIsSetup] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    UserRepository.getAdminCount().then(count => {
      if (count === 0) setIsSetup(true);
    });
  }, []);

  const handleReset = async () => {
    if (!confirm('This will wipe ALL local and server data and reload fresh. Continue?')) return;
    setResetting(true);
    try {
      await resetDevDatabase();
    } catch {
      toast.error('Reset failed — check console');
      setResetting(false);
    }
  };

  return (
    <>
      {isSetup
        ? <SetupWizardForm onComplete={() => setIsSetup(false)} />
        : <LoginForm />}

      {import.meta.env.DEV && (
        <div className="mt-8 pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={resetting}
            className="gap-1.5 text-xs text-muted-foreground hover:text-destructive w-full"
          >
            <RotateCcw className="size-3" />
            {resetting ? 'Resetting…' : 'Reset Dev Database'}
          </Button>
        </div>
      )}
    </>
  );
}

export default Login;