import type { MobileSlide } from '../types/onboarding';

export const adminMobileSlides: MobileSlide[] = [
  {
    title: 'Welcome to POS',
    description: 'This quick tour will show you the key features. You can replay it anytime from the Settings page.',
    icon: 'LayoutDashboard',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    title: 'Dashboard',
    description: 'View revenue, orders, low stock alerts, and inventory value at a glance. Quick actions let you jump anywhere.',
    icon: 'BarChart3',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    title: 'Point of Sale',
    description: 'Search products, build a cart, and process payments. Cash, card, and mobile money supported.',
    icon: 'ShoppingCart',
    color: 'from-purple-500 to-pink-400',
  },
  {
    title: 'Sales History',
    description: 'Browse past transactions, filter by payment method, and expand rows for item-level details.',
    icon: 'Receipt',
    color: 'from-orange-500 to-amber-400',
  },
  {
    title: 'Inventory',
    description: 'Manage products, track stock levels, and get alerts for low stock or expiring items.',
    icon: 'Package',
    color: 'from-rose-500 to-red-400',
  },
  {
    title: 'Reports',
    description: 'Analyze sales trends, top products, payment breakdowns, and activity logs with date-range filtering.',
    icon: 'TrendingUp',
    color: 'from-indigo-500 to-violet-400',
  },
  {
    title: 'User Management',
    description: 'Add or deactivate sales reps. New reps get a temporary PIN they change on first login.',
    icon: 'Users',
    color: 'from-cyan-500 to-blue-400',
  },
  {
    title: 'Settings & Profile',
    description: 'Configure store info, tax rates, and receipts in Settings. Update your name and PIN in Profile.',
    icon: 'Settings',
    color: 'from-slate-500 to-gray-400',
  },
];

export const salesMobileSlides: MobileSlide[] = [
  {
    title: 'Welcome to POS',
    description: 'This quick tour will show you what you need to know. You can replay it anytime from your Profile page.',
    icon: 'LayoutDashboard',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    title: 'Point of Sale',
    description: 'Search products, add them to the cart, and process payments. Cash, card, and mobile money are all supported.',
    icon: 'ShoppingCart',
    color: 'from-purple-500 to-pink-400',
  },
  {
    title: 'Sales History',
    description: 'View all transactions you\'ve processed. Expand any row to see what was sold and payment details.',
    icon: 'Receipt',
    color: 'from-orange-500 to-amber-400',
  },
  {
    title: 'Inventory',
    description: 'Check product availability and stock levels. The inventory is read-only for sales reps.',
    icon: 'Package',
    color: 'from-rose-500 to-red-400',
  },
  {
    title: 'Profile',
    description: 'Update your name or change your 5-digit PIN from your profile page at any time.',
    icon: 'User',
    color: 'from-indigo-500 to-violet-400',
  },
];
