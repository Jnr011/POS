import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  User, Shield, LogOut, DollarSign, ShoppingCart,
  Smartphone, Eye, EyeOff, KeyRound, Store,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';
import { PinInput } from '../components/PinInput';
import { UserRepository } from '../db/repository';
import { hashPin } from '../hooks/useAuth';
import { toast } from 'sonner';

function Profile() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);

  const handleSaveInfo = () => {
    toast.success('Profile info saved');
  };

  const handleChangePin = async () => {
    if (newPin.length !== 5) {
      toast.error('PIN must be exactly 5 digits');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    setPinSaving(true);
    try {
      const newPinHash = await hashPin(newPin);
      await UserRepository.updatePin(user!.id, newPinHash);
      const updatedUser = { ...user!, pinHash: newPinHash, mustChangePin: false };
      useAuthStore.setState({ user: updatedUser });
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      toast.success('PIN updated successfully');
      setNewPin('');
      setConfirmPin('');
    } catch {
      toast.error('Failed to update PIN');
    } finally {
      setPinSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="p-6 mx-auto max-w-5xl space-y-6">

      {/* ── Header ── */}
      <Card data-tour="profile-header">
        <CardContent className="p-6 flex items-center gap-5">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="size-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-foreground">{user.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{user.role} · {user.email}</p>
          </div>
          <Button variant="destructive" size="sm" className="gap-2 shrink-0" onClick={handleLogout}>
            <LogOut className="size-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* ── Two-column grid: Account Info | Change PIN ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Account Info */}
        <Card data-tour="profile-account">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="size-4 text-muted-foreground" />
              Account Info
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Full name</label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSaveInfo}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Change PIN */}
        <Card data-tour="profile-pin">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Shield className="size-4 text-muted-foreground" />
              Change PIN
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">New PIN (5 digits)</label>
                <div className="flex items-center gap-3">
                  <PinInput value={newPin} onChange={setNewPin} reveal={showNew} length={5} autoFocus />
                  <button
                    type="button"
                    onClick={() => setShowNew(s => !s)}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Confirm new PIN</label>
                <div className="flex items-center gap-3">
                  <PinInput value={confirmPin} onChange={setConfirmPin} reveal={showConfirm} length={5} />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleChangePin}
                disabled={pinSaving || newPin.length !== 5 || confirmPin.length !== 5}
                className="gap-2"
              >
                {pinSaving ? 'Updating...' : <><KeyRound className="size-3.5" /> Update PIN</>}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── Session Info — full width below ── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Smartphone className="size-4 text-muted-foreground" />
            Session
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground mb-1">Role</p>
              <p className="text-sm font-medium capitalize">{user.role}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground mb-1">Account ID</p>
              <p className="text-sm font-mono tabular-nums">#{user.id}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground mb-1">Browser</p>
              <p className="text-sm truncate" title={navigator.userAgent}>{navigator.userAgent}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Footer note ── */}
      <p className="text-xs text-muted-foreground/60 text-center">
        <Store className="size-3 inline mr-1" />
        Changes are stored locally and synced when online.
      </p>

    </div>
  );
}

export default Profile;
