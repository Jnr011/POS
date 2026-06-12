import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  heldSaleId: string | null;
  addItem: (product: Product) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  incrementQuantity: (id: number) => void;
  decrementQuantity: (id: number) => void;
  clearCart: () => void;
  holdSale: () => string;
  recallSale: (id: string) => void;
  deleteHeldSale: (id: string) => void;
  getHeldSales: () => Record<string, CartItem[]>;
  totalItems: () => number;
  totalAmount: () => number;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      heldSaleId: null,

      addItem: (product) => set((state) => {
        const existing = state.items.find(i => i.id === product.id);
        if (existing) {
          const maxQty = product.stock_quantity;
          if (existing.quantity >= maxQty) return state;
          return {
            items: state.items.map(i =>
              i.id === product.id ? { ...i, quantity: Math.min(i.quantity + 1, maxQty) } : i
            ),
          };
        }
        return { items: [...state.items, {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          stock_quantity: product.stock_quantity,
          quantity: 1,
        }] };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id),
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(i =>
          i.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock_quantity)) } : i
        ),
      })),

      incrementQuantity: (id) => set((state) => ({
        items: state.items.map(i =>
          i.id === id ? { ...i, quantity: Math.min(i.quantity + 1, i.stock_quantity) } : i
        ),
      })),

      decrementQuantity: (id) => set((state) => ({
        items: state.items.map(i =>
          i.id === id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i
        ),
      })),

      clearCart: () => set({ items: [], heldSaleId: null }),

      holdSale: () => {
        const id = generateId();
        const held = get().getHeldSales();
        held[id] = get().items;
        localStorage.setItem('heldSales', JSON.stringify(held));
        set({ items: [], heldSaleId: null });
        return id;
      },

      recallSale: (id) => {
        const held = get().getHeldSales();
        const items = held[id];
        if (items) {
          set({ items, heldSaleId: id });
          delete held[id];
          localStorage.setItem('heldSales', JSON.stringify(held));
        }
      },

      deleteHeldSale: (id) => {
        const held = get().getHeldSales();
        delete held[id];
        localStorage.setItem('heldSales', JSON.stringify(held));
      },

      getHeldSales: () => {
        try {
          return JSON.parse(localStorage.getItem('heldSales') || '{}');
        } catch {
          return {};
        }
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalAmount: () => get().items.reduce((sum, i) => sum + (i.price * i.quantity), 0),
    }),
    {
      name: 'pos-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
