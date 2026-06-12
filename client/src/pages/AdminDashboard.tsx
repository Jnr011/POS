import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useReports } from '../hooks/useReports';
import { useAuth } from '../hooks/useAuth';
import { UserRepository } from '../db/repository';
import { User, InventoryStatus } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PinInput } from '../components/PinInput';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { StatCard } from '../components/StatCard';
import { PageHeader } from '../components/PageHeader';
import {
  Package,
  AlertTriangle,
  DollarSign,
  Users,
  TrendingUp,
  ClipboardList,
  UserPlus,
  UserX,
  Eye,
  EyeOff,
} from 'lucide-react';

function AdminDashboard() {
  const { reports, loading } = useReports();
  const { register } = useAuth();
  const inv = reports.inventory as InventoryStatus & {
    totalUsers?: number;
    totalRevenue?: number;
    totalSalesToday?: number;
  };

  const [salesReps, setSalesReps] = useState<User[]>([]);
  const [showAddRep, setShowAddRep] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [newRep, setNewRep] = useState({ name: '', email: '', pin: '', confirmPin: '' });
  const [creating, setCreating] = useState(false);

  const loadSalesReps = async () => {
    const all = await UserRepository.getAll();
    setSalesReps(all.filter(u => u.role === 'sales'));
  };

  useEffect(() => {
    if (!loading) loadSalesReps();
  }, [loading]);

  const handleCreateRep = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newRep.pin.length !== 5) {
      toast.error('PIN must be exactly 5 digits');
      return;
    }
    if (newRep.pin !== newRep.confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    setCreating(true);
    try {
      const user = await register({
        name: newRep.name,
        email: newRep.email,
        pin: newRep.pin,
        role: 'sales',
      });
      if (user) {
        toast.success(`Sales rep "${newRep.name}" created`);
        setShowAddRep(false);
        setNewRep({ name: '', email: '', pin: '', confirmPin: '' });
        await loadSalesReps();
      }
    } catch {
      toast.error('Failed to create sales rep');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (user: User) => {
    try {
      await UserRepository.deactivate(user.id);
      toast.success(`${user.name} deactivated`);
      await loadSalesReps();
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <div className="h-1 bg-[oklch(0.55_0.16_220/0.1)]" />
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={<ClipboardList className="size-4" />}
        title="Admin Dashboard"
        description="Pharmacy overview and key metrics"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={<Package className="size-4 text-primary" />}
          label="Total Products"
          value={inv?.totalProducts || 0}
          sub="Managed in inventory"
          accent="bg-primary"
        />
        <StatCard
          icon={<AlertTriangle className="size-4 text-warning" />}
          label="Low Stock Alerts"
          value={inv?.lowStockProducts || 0}
          sub="Items below threshold"
          accent="bg-warning"
        />
        <StatCard
          icon={<DollarSign className="size-4 text-success" />}
          label="Inventory Value"
          value={`GHS ${(inv?.totalValue || 0).toFixed(2)}`}
          sub="Total stock value"
          accent="bg-success"
        />
        <StatCard
          icon={<Users className="size-4 text-primary" />}
          label="Total Users"
          value={inv?.totalUsers || 0}
          sub="Active in system"
          accent="bg-primary"
        />
        <StatCard
          icon={<TrendingUp className="size-4 text-success" />}
          label="Total Revenue"
          value={`GHS ${(inv?.totalRevenue || 0).toFixed(2)}`}
          sub="All-time sales"
          accent="bg-success"
        />
        <StatCard
          icon={<ClipboardList className="size-4 text-primary" />}
          label="Today's Sales"
          value={`GHS ${(inv?.totalSalesToday || 0).toFixed(2)}`}
          sub="Today's revenue"
          accent="bg-primary"
        />
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h2 className="font-semibold">Manage Sales Reps</h2>
            </div>
            <Button size="sm" onClick={() => setShowAddRep(true)} className="gap-1.5">
              <UserPlus className="size-3.5" />
              Add Rep
            </Button>
          </div>
          {salesReps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No sales reps yet</p>
          ) : (
            <div className="space-y-2">
              {salesReps.map(rep => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{rep.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{rep.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      rep.isActive
                        ? 'bg-accent/10 text-accent'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {rep.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {rep.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivate(rep)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <UserX className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddRep} onOpenChange={setShowAddRep}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateRep}>
            <DialogHeader>
              <DialogTitle>Add Sales Rep</DialogTitle>
              <DialogDescription>
                Create a new sales representative account. They'll sign in with their email and 5-digit PIN.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="repName" className="text-sm font-medium">Full Name</label>
                <Input
                  id="repName"
                  placeholder="John Doe"
                  value={newRep.name}
                  onChange={(e) => setNewRep(prev => ({ ...prev, name: e.target.value }))}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="repEmail" className="text-sm font-medium">Email</label>
                <Input
                  id="repEmail"
                  type="email"
                  placeholder="john@pharmacy.com"
                  value={newRep.email}
                  onChange={(e) => setNewRep(prev => ({ ...prev, email: e.target.value }))}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PIN (5 digits)</label>
                <div className="flex items-center gap-3 justify-center">
                  <PinInput value={newRep.pin} onChange={(v) => setNewRep(prev => ({ ...prev, pin: v }))} reveal={showPin} length={5} />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm PIN</label>
                <div className="flex items-center gap-3 justify-center">
                  <PinInput value={newRep.confirmPin} onChange={(v) => setNewRep(prev => ({ ...prev, confirmPin: v }))} length={5} />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setShowAddRep(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="gap-1.5">
                <UserPlus className="size-3.5" />
                {creating ? 'Creating...' : 'Create Rep'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;
