import type { TourPageGroup } from '../types/onboarding';

export const salesTourGroups: TourPageGroup[] = [
  {
    route: '/pos',
    label: 'Point of Sale',
    steps: [
      {
        target: '[data-tour="pos-search"]',
        title: 'Search Products',
        content: 'Find products by name or category. Press the "/" key to quickly focus the search bar.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="pos-products"]',
        title: 'Product Grid',
        content: 'Browse available products. Click "Add" to add an item to the cart. Switch between card and list view.',
        placement: 'top',
      },
      {
        target: '[data-tour="pos-cart"]',
        title: 'Shopping Cart',
        content: 'Review selected items, adjust quantities, and see the running total with tax.',
        placement: 'left',
      },
      {
        target: '[data-tour="pos-checkout"]',
        title: 'Checkout',
        content: 'Click "Pay" to open the checkout dialog, choose a payment method, and complete the sale.',
        placement: 'top',
      },
    ],
  },
  {
    route: '/sales',
    label: 'Sales History',
    steps: [
      {
        target: '[data-tour="sales-search"]',
        title: 'Search & Filter',
        content: 'Search your past sales by receipt number or product name. Filter by payment method.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="sales-table"]',
        title: 'Your Sales',
        content: 'View all transactions you\'ve processed. Click any row to expand item details.',
        placement: 'top',
      },
    ],
  },
  {
    route: '/inventory',
    label: 'Inventory',
    steps: [
      {
        target: '[data-tour="inventory-stats"]',
        title: 'Stock Overview',
        content: 'Check product availability, expiring items, and low stock alerts at a glance.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="inventory-toolbar"]',
        title: 'Browse Products',
        content: 'Search and filter products by name or category to quickly find what you need.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="inventory-table"]',
        title: 'Product List',
        content: 'View product details including price and stock level. (Editing is available for admins only.)',
        placement: 'top',
      },
    ],
  },
  {
    route: '/profile',
    label: 'Profile',
    steps: [
      {
        target: '[data-tour="profile-header"]',
        title: 'Your Profile',
        content: 'View your name, role, and email. Use the "Sign Out" button to end your session.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="profile-pin"]',
        title: 'Change PIN',
        content: 'Update your 5-digit login PIN here. It\'s a good idea to change it regularly.',
        placement: 'top',
      },
    ],
  },
];
