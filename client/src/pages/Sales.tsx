import { useState, useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { usePrinter } from '../hooks/usePrinter';
import { SaleRepository } from '../db/repository';
import { formatCurrency } from '../lib/currency';
import type { Product, CartItem, Sale } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { PageHeader } from '../components/PageHeader';
import {
  ShoppingCart, Search, X, Plus, Minus, Trash2,
  Package, Clock, Banknote, CreditCard, Smartphone,
  CheckCircle2, Pause, Play, Printer, Usb,
  AlertCircle, ArrowLeft, CircleDollarSign,
} from 'lucide-react';

// ─── Checkout Dialog (Multi-Step) ─────────────────────────────────────────────

type PaymentMethod = 'cash' | 'card' | 'mobile_money';

function CheckoutDialog({
  open, onOpenChange, grandTotal, subtotal, tax, cartCount,
  onConfirm, paymentMethod, setPaymentMethod, amountTendered, setAmountTendered,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  grandTotal: number;
  subtotal: number;
  tax: number;
  cartCount: number;
  onConfirm: () => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  amountTendered: string;
  setAmountTendered: (v: string) => void;
}) {
  const [step, setStep] = useState<'method' | 'amount' | 'confirm'>('method');
  const tendered = parseFloat(amountTendered || '0');
  const remaining = grandTotal - tendered;
  const changeDue = Math.max(0, tendered - grandTotal);
  const isExact = Math.abs(tendered - grandTotal) < 0.01;
  const isUnderpaid = tendered > 0 && tendered < grandTotal;
  const isOverpaid = tendered > grandTotal;

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setStep('method');
      setAmountTendered('');
    }
  }, [open]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'cash') {
      setStep('amount');
    } else {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'amount') setStep('method');
    if (step === 'confirm' && paymentMethod !== 'cash') setStep('method');
  };

  const handlePay = () => {
    onConfirm();
    onOpenChange(false);
  };

  const paymentIcons: Record<PaymentMethod, typeof Banknote> = {
    cash: Banknote,
    card: CreditCard,
    mobile_money: Smartphone,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {step !== 'method' && (
                <Button variant="ghost" size="icon" className="size-6 -ml-1" onClick={handleBack}>
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              {step === 'method' && 'Payment Method'}
              {step === 'amount' && 'Enter Amount'}
              {step === 'confirm' && 'Confirm Payment'}
            </DialogTitle>
            {step !== 'method' && (
              <Badge variant="secondary" className="text-[10px]">
                Step {step === 'amount' ? '2' : '3'} of 3
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Total due - always visible */}
        <div className="text-center py-2 rounded-lg bg-muted/50">
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(grandTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total due for {cartCount} item{cartCount !== 1 ? 's' : ''}</p>
        </div>

        {/* Step 1: Select payment method */}
        {step === 'method' && (
          <div className="space-y-2 pt-2">
            {([
              { value: 'cash' as const, label: 'Cash', desc: 'Pay with cash' },
              { value: 'card' as const, label: 'Card', desc: 'Debit or credit card' },
              { value: 'mobile_money' as const, label: 'Mobile', desc: 'Mobile payment' },
            ]).map(({ value, label, desc }) => {
              const Icon = paymentIcons[value];
              return (
                <button
                  key={value}
                  onClick={() => handleMethodSelect(value)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Enter amount (cash only) */}
        {step === 'amount' && (
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Amount tendered</label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amountTendered}
                  onChange={e => setAmountTendered(e.target.value)}
                  step="0.01"
                  min="0"
                  className="pl-10 text-center text-xl font-bold h-14"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[grandTotal, Math.ceil(grandTotal), Math.ceil(grandTotal / 5) * 5].map((amt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmountTendered(amt.toFixed(2))}
                  className="tabular-nums text-xs"
                >
                  {i === 0 ? 'Exact' : i === 1 ? 'Round up' : formatCurrency(amt)}
                </Button>
              ))}
            </div>

            {/* Status message */}
            {tendered > 0 && (
              <div className={[
                'rounded-lg p-3 text-sm',
                isExact && 'bg-accent/10 text-accent',
                isUnderpaid && 'bg-destructive/10 text-destructive',
                isOverpaid && 'bg-primary/10 text-primary',
              ].join(' ')}>
                {isExact && (
                  <p className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> Exact amount — no change due
                  </p>
                )}
                {isUnderpaid && (
                  <p className="font-medium flex items-center gap-2">
                    <AlertCircle className="size-4" /> {formatCurrency(remaining)} more needed to complete this sale
                  </p>
                )}
                {isOverpaid && (
                  <p className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> Change to return: {formatCurrency(changeDue)}
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={() => setStep('confirm')}
              disabled={tendered < grandTotal}
              className="w-full"
            >
              {isUnderpaid ? `Enter ${formatCurrency(remaining)} more` : 'Continue'}
            </Button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-3 pt-2">
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment method</span>
                <span className="font-medium capitalize">{paymentMethod.replace('_', ' ')}</span>
              </div>
              {paymentMethod === 'cash' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount tendered</span>
                    <span className="font-medium tabular-nums">{formatCurrency(tendered)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Change due</span>
                    <span className="font-medium tabular-nums">{formatCurrency(changeDue)}</span>
                  </div>
                </>
              )}
            </div>

            <Button onClick={handlePay} className="w-full gap-2">
              <CheckCircle2 className="size-4" /> Confirm Payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Receipt Dialog ───────────────────────────────────────────────────────────

function ReceiptDialog({
  open, onOpenChange, sale, onPrint,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sale: Sale | null;
  onPrint: (sale: Sale) => void;
}) {
  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-accent" /> Sale Complete
          </DialogTitle>
          <DialogDescription>Transaction processed successfully</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="text-center pb-3 border-b border-border">
            <p className="text-3xl font-bold tabular-nums">{formatCurrency(sale.grand_total)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(sale.date).toLocaleString()}
            </p>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="truncate mr-2">{item.name} x{item.quantity}</span>
                <span className="tabular-nums shrink-0">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-2 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(sale.total_price)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax (10%)</span>
              <span className="tabular-nums">{formatCurrency(sale.tax)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(sale.grand_total)}</span>
            </div>
          </div>

          <div className="border-t border-border pt-2 flex justify-between text-sm">
            <span className="text-muted-foreground capitalize">{sale.payment_method.replace('_', ' ')}</span>
            {sale.payment_method === 'cash' && (
              <span className="text-muted-foreground">
                Tendered: {formatCurrency(sale.amount_tendered)} | Change: {formatCurrency(sale.change_due)}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onPrint(sale)} className="flex-1 gap-2">
            <Printer className="size-4" /> Print Receipt
          </Button>
          <Button onClick={() => onOpenChange(false)} className="flex-1">Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Sales Component ─────────────────────────────────────────────────────

function Sales() {
  const { products, loading, refetch } = useProducts();
  const {
    items: cart, addItem, removeItem, clearCart,
    incrementQuantity, decrementQuantity,
    holdSale, recallSale, deleteHeldSale, getHeldSales,
    totalItems, totalAmount,
  } = useCartStore();
  const user = useAuthStore(s => s.user);
  const printer = usePrinter();

  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Payment
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money'>('cash');
  const [amountTendered, setAmountTendered] = useState('');

  // Receipt
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // Held sales
  const [showHeld, setShowHeld] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────

  const categories = useMemo(() => [...new Set(products.map(p => p.category))].sort(), [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (categoryFilter !== 'all') list = list.filter(p => p.category === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list;
  }, [products, search, categoryFilter]);

  const subtotal = totalAmount();
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;
  const cartCount = totalItems();
  const changeDue = Math.max(0, parseFloat(amountTendered || '0') - grandTotal);

  const heldSales = useMemo(() => getHeldSales(), [showHeld]);
  const heldCount = Object.keys(heldSales).length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowPayment(true);
  };

  const handleConfirmPayment = async () => {
    if (!user || cart.length === 0) return;
    try {
      const sale = await SaleRepository.processSale(
        cart as CartItem[],
        user.id,
        paymentMethod,
        parseFloat(amountTendered) || grandTotal,
      );
      setLastSale(sale);
      clearCart();
      setShowPayment(false);
      setAmountTendered('');
      setPaymentMethod('cash');
      refetch();
      setShowReceipt(true);
    } catch (error: any) {
      toast.error(error.message || 'Error processing sale');
    }
  };

  const handleHold = () => {
    if (cart.length === 0) return;
    holdSale();
    toast.success('Sale held');
  };

  const handleRecall = (id: string) => {
    recallSale(id);
    setShowHeld(false);
    toast.success('Sale recalled');
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-24" />
      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-28 rounded-md" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="w-80 h-96 rounded-xl" />
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* Page header */}
      <PageHeader
        icon={<ShoppingCart className="size-4 text-primary" />}
        title="Sales"
        description="Point of Sale Terminal"
        actions={
          <Button
            variant={printer.status.connected ? 'default' : 'outline'}
            size="sm"
            onClick={printer.status.connected ? printer.disconnect : printer.connect}
            className="gap-2"
          >
            {printer.status.connected ? (
              <>
                <span className="size-2 rounded-full bg-accent animate-pulse" />
                <Printer className="size-4" /> Connected
              </>
            ) : (
              <>
                <Usb className="size-4" /> Connect Printer
              </>
            )}
          </Button>
        }
      />

      <div className="flex gap-6 items-start">

        {/* ── Products panel ── */}
        <div className="flex-1 space-y-4">

          {/* Search + filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchRef}
                placeholder="Search products... (press /)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Product grid */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {products.length === 0 ? 'No products available' : 'No products match your search'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map(product => {
                const inCart = cart.find(i => i.id === product.id);
                const low = product.stock_quantity <= (product.min_stock ?? 10);
                const oos = product.stock_quantity === 0;

                return (
                  <Card
                    key={product.id}
                    className={[
                      'overflow-hidden transition-all duration-200 relative',
                      inCart && 'ring-2 ring-primary/30',
                    ].join(' ')}
                  >
                    <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 z-10">
                      {product.category}
                    </Badge>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-medium text-sm leading-tight pr-12">{product.name}</h3>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-lg font-bold tabular-nums">{formatCurrency(product.price)}</p>
                          <p className={[
                            'text-xs tabular-nums',
                            oos ? 'text-destructive font-medium' :
                            low ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                          ].join(' ')}>
                            {oos ? 'Out of stock' : `${product.stock_quantity} in stock`}
                          </p>
                        </div>

                        {inCart ? (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline" size="icon"
                              className="size-7"
                              onClick={() => decrementQuantity(product.id)}
                              disabled={inCart.quantity <= 1}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-7 text-center text-sm font-semibold tabular-nums">
                              {inCart.quantity}
                            </span>
                            <Button
                              variant="outline" size="icon"
                              className="size-7"
                              onClick={() => incrementQuantity(product.id)}
                              disabled={inCart.quantity >= product.stock_quantity}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addItem(product)}
                            disabled={oos}
                            className="gap-1.5"
                          >
                            <Plus className="size-3" /> Add
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Cart panel (sticky) ── */}
        <div className="w-80 shrink-0 sticky top-6 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="size-4 text-muted-foreground" /> Cart
                </span>
                {cartCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5">{cartCount}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {cart.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <ShoppingCart className="size-8 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Cart is empty</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Add products to get started</p>
                </div>
              ) : (
                <>
                  {/* Cart items */}
                  <div className="max-h-[50vh] overflow-y-auto divide-y divide-border">
                    {cart.map(item => {
                      const atMax = item.quantity >= item.stock_quantity;
                      return (
                        <div key={item.id} className="px-4 py-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(item.price)} each</p>
                            </div>
                            <Button
                              variant="ghost" size="icon"
                              className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline" size="icon"
                                className="size-6"
                                onClick={() => decrementQuantity(item.id)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="size-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={e => {
                                  const v = parseInt(e.target.value, 10);
                                  if (!isNaN(v)) useCartStore.getState().updateQuantity(item.id, v);
                                }}
                                className="h-6 w-12 text-center text-xs tabular-nums px-1"
                                min={1}
                                max={item.stock_quantity}
                              />
                              <Button
                                variant="outline" size="icon"
                                className="size-6"
                                onClick={() => incrementQuantity(item.id)}
                                disabled={atMax}
                              >
                                <Plus className="size-3" />
                              </Button>
                              {atMax && (
                                <span className="text-[10px] text-muted-foreground ml-1">max</span>
                              )}
                            </div>
                            <span className="text-sm font-semibold tabular-nums">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-border px-4 py-3 space-y-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tax (10%)</span>
                      <span className="tabular-nums">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-1">
                      <span>Total</span>
                      <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-border px-4 py-3 space-y-2">
                    <Button onClick={handleCheckout} className="w-full gap-2">
                      <Banknote className="size-4" /> Pay {formatCurrency(grandTotal)}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm"
                        className="flex-1 gap-1.5"
                        onClick={handleHold}
                      >
                        <Pause className="size-3" /> Hold
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => setShowHeld(true)}
                        disabled={heldCount === 0}
                      >
                        <Play className="size-3" /> Recall ({heldCount})
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { clearCart(); toast.info('Cart cleared'); }}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ══ Dialogs ═══════════════════════════════════════════════════════════ */}

      {/* Multi-step checkout dialog */}
      <CheckoutDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        grandTotal={grandTotal}
        subtotal={subtotal}
        tax={tax}
        cartCount={cartCount}
        onConfirm={handleConfirmPayment}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        amountTendered={amountTendered}
        setAmountTendered={setAmountTendered}
      />

      {/* Receipt dialog */}
      <ReceiptDialog
        open={showReceipt}
        onOpenChange={setShowReceipt}
        sale={lastSale}
        onPrint={s => printer.printReceipt(s)}
      />

      {/* Held sales dialog */}
      <Dialog open={showHeld} onOpenChange={setShowHeld}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="size-4 text-muted-foreground" /> Held Sales
            </DialogTitle>
          </DialogHeader>
            {Object.keys(heldSales).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No held sales</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(heldSales).map(([id, items]) => {
                  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
                  return (
                    <div key={id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-muted-foreground">
                          {items.map(i => i.name).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-sm font-semibold tabular-nums">{formatCurrency(total)}</span>
                        <Button size="sm" variant="ghost" className="gap-1" onClick={() => handleRecall(id)}>
                          <Play className="size-3" /> Recall
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { deleteHeldSale(id); setShowHeld(false); }}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Sales;
