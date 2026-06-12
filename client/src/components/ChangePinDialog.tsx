import { useState } from 'react';
import { UserRepository } from '../db/repository';
import { hashPin } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { PinInput } from '../components/PinInput';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface ChangePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}

function ChangePinDialog({ open, onOpenChange, onCompleted }: ChangePinDialogProps) {
  const user = useAuthStore(s => s.user);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPin.length !== 5) {
      setError('PIN must be exactly 5 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setSaving(true);
    try {
      const newPinHash = await hashPin(newPin);
      await UserRepository.updatePin(user!.id, newPinHash);

      const updatedUser = { ...user!, pinHash: newPinHash, mustChangePin: false };
      useAuthStore.setState({ user: updatedUser });
      localStorage.setItem('authUser', JSON.stringify(updatedUser));

      toast.success('PIN updated successfully');
      onCompleted();
      setNewPin('');
      setConfirmPin('');
      setError('');
    } catch {
      setError('Failed to update PIN');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-full bg-warning/10 flex items-center justify-center">
              <KeyRound className="size-5 text-warning" />
            </div>
          </div>
          <DialogTitle>Change Your PIN</DialogTitle>
          <DialogDescription>
            You must change your temporary PIN before continuing. Choose a PIN you'll remember.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/[0.07] px-3.5 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">New PIN (5 digits)</label>
            <div className="flex items-center gap-3 justify-center">
              <PinInput
                value={newPin}
                onChange={setNewPin}
                reveal={showNew}
                length={5}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm new PIN</label>
            <div className="flex items-center gap-3 justify-center">
              <PinInput
                value={confirmPin}
                onChange={setConfirmPin}
                reveal={showConfirm}
                length={5}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={saving || newPin.length !== 5 || confirmPin.length !== 5}
            className="w-full gap-2"
          >
            {saving ? 'Updating...' : 'Update PIN & Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ChangePinDialog };
