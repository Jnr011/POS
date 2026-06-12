import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UserRepository, generatePin } from '../db/repository';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/ui/empty-state';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Users, UserPlus, UserX,
  Shield, Crown, Search, Copy, Check, KeyRound,
} from 'lucide-react';
import type { User } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

function UserManagement() {
  const currentUser = useAuthStore((s) => s.user);
  const { register } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addStep, setAddStep] = useState<'form' | 'pin'>('form');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [generatedPin, setGeneratedPin] = useState('');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    const all = await UserRepository.getAll();
    setUsers(all);
  };

  useEffect(() => {
    loadUsers().finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const admins = filtered.filter(u => u.role === 'admin');
  const salesReps = filtered.filter(u => u.role === 'sales');

  const openAddDialog = () => {
    setNewUserName('');
    setNewUserEmail('');
    setGeneratedPin('');
    setCopied(false);
    setAddStep('form');
    setShowAdd(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const pin = generatePin();
      const user = await register({
        name: newUserName,
        email: newUserEmail,
        pin,
        role: 'sales',
      });
      if (user) {
        setGeneratedPin(pin);
        setAddStep('pin');
        await loadUsers();
      }
    } catch {
      toast.error('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(generatedPin);
      setCopied(true);
      toast.success('PIN copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDeactivate = async (user: User) => {
    try {
      await UserRepository.deactivate(user.id);
      toast.success(`${user.name} deactivated`);
      await loadUsers();
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<Users className="size-4 text-primary" />}
        title="User Management"
        description={`${users.filter(u => u.isActive).length} active user${users.filter(u => u.isActive).length !== 1 ? 's' : ''}`}
        actions={
          <Button size="sm" onClick={openAddDialog} className="gap-1.5">
            <UserPlus className="size-3.5" />
            Add Sales Rep
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5 text-muted-foreground/50" />}
          title="No users found"
          description={search ? 'Try a different search' : 'Add your first sales rep to get started'}
          action={
            !search ? (
              <Button size="sm" onClick={openAddDialog} className="gap-1.5">
                <UserPlus className="size-3.5" />
                Add Sales Rep
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {admins.length > 0 && (
            <UserSection title="Administrators" icon={<Crown className="size-3.5 text-warning" />}>
              {admins.map(user => (
                <UserRow
                  key={user.id}
                  user={user}
                  isCurrentUser={user.id === currentUser?.id}
                  onDeactivate={handleDeactivate}
                />
              ))}
            </UserSection>
          )}

          {salesReps.length > 0 && (
            <UserSection title="Sales Representatives" icon={<Shield className="size-3.5 text-primary" />}>
              {salesReps.map(user => (
                <UserRow
                  key={user.id}
                  user={user}
                  isCurrentUser={user.id === currentUser?.id}
                  onDeactivate={handleDeactivate}
                />
              ))}
            </UserSection>
          )}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          {addStep === 'form' ? (
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add Sales Representative</DialogTitle>
                <DialogDescription>
                  A temporary PIN will be generated. Share it with the rep — they'll change it on first login.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@pharmacy.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={creating} className="gap-1.5">
                  <UserPlus className="size-3.5" />
                  {creating ? 'Creating...' : 'Create Rep'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Check className="size-4 text-accent" />
                  </div>
                  Rep Created
                </DialogTitle>
                <DialogDescription>
                  Share this temporary PIN with <strong>{newUserName}</strong>. They'll be required to change it on first login.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm font-medium">{newUserEmail}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Temporary PIN</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-mono font-bold tracking-[0.3em]">{generatedPin}</span>
                      <button
                        type="button"
                        onClick={handleCopyPin}
                        className="size-8 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
                        aria-label="Copy PIN"
                      >
                        {copied
                          ? <Check className="size-4 text-accent" />
                          : <Copy className="size-4 text-muted-foreground" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowAdd(false)} className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          {icon}
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <div className="divide-y">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function UserRow({ user, isCurrentUser, onDeactivate }: { user: User; isCurrentUser: boolean; onDeactivate: (u: User) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={cn(
          'size-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
          user.role === 'admin' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary',
        )}>
          {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            {isCurrentUser && (
              <Badge variant="outline" className="text-[10px] border-0 px-1.5 py-0 bg-primary/10 text-primary">
                You
              </Badge>
            )}
            {user.mustChangePin && (
              <Badge variant="outline" className="text-[10px] border-0 px-1.5 py-0 bg-warning/10 text-warning gap-1">
                <KeyRound className="size-2.5" />
                PIN needed
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-medium border-0 px-1.5 py-0',
            user.isActive ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive',
          )}
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
        <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
          {user.updatedAt ? format(new Date(user.updatedAt), 'MMM d, yyyy') : '—'}
        </span>
        {user.isActive && !isCurrentUser && user.role === 'sales' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeactivate(user)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            aria-label={`Deactivate ${user.name}`}
          >
            <UserX className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
