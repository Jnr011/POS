import type { TourPageGroup } from '../types/onboarding';

export const adminTourGroups: TourPageGroup[] = [
  {
    route: '/dashboard',
    label: 'Dashboard',
    steps: [
      {
        target: '[data-tour="dashboard-stats"]',
        title: 'Dashboard Overview',
        content: 'Quick-glance metrics — today\'s revenue, orders, low stock alerts, and inventory value.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="dashboard-chart"]',
        title: 'Sales Trend',
        content: 'A 7-day sales trend chart to spot patterns and compare daily performance.',
        placement: 'left',
      },
      {
        target: '[data-tour="dashboard-actions"]',
        title: 'Quick Actions',
        content: 'Jump directly to POS, Inventory, Reports, or User Management from here.',
        placement: 'top',
      },
      {
        target: '[data-tour="dashboard-transactions"]',
        title: 'Recent Transactions',
        content: 'See the latest sales at a glance, plus low-stock and expiring-item alerts.',
        placement: 'top',
      },
    ],
  },
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
        content: 'Search by receipt number, attendant name, or product. Filter by payment method.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="sales-table"]',
        title: 'Sales Records',
        content: 'Browse all recorded sales. Click any row to expand and see item details, totals, and tendered amounts.',
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
        title: 'Inventory Stats',
        content: 'Quick stats: low stock, expiring soon, out of stock, and total products. Click to filter.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="inventory-toolbar"]',
        title: 'Search & Manage',
        content: 'Search products, filter by category, and use bulk actions. The "Add Product" button opens the creation form.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="inventory-table"]',
        title: 'Product Table',
        content: 'View all products with sortable columns. Edit product details, adjust stock levels, or delete products.',
        placement: 'top',
      },
    ],
  },
  {
    route: '/reports',
    label: 'Reports',
    steps: [
      {
        target: '[data-tour="reports-period"]',
        title: 'Date Range',
        content: 'Select any date range or use preset periods to analyze your sales data.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="reports-metrics"]',
        title: 'Key Metrics',
        content: 'Total revenue, order count, average order value, and quick links to detailed reports.',
        placement: 'top',
      },
      {
        target: '[data-tour="reports-charts"]',
        title: 'Charts & Breakdown',
        content: 'Visualize sales trends, top-performing products, and payment method breakdowns.',
        placement: 'top',
      },
    ],
  },
  {
    route: '/admin/users',
    label: 'User Management',
    steps: [
      {
        target: '[data-tour="users-header"]',
        title: 'User Management',
        content: 'Manage all users — view active/inactive status, search by name or email.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="users-add"]',
        title: 'Add Sales Rep',
        content: 'Click to create a new sales representative. A temporary PIN is generated for their first login.',
        placement: 'left',
      },
      {
        target: '[data-tour="users-list"]',
        title: 'User List',
        content: 'View administrators and sales reps. Deactivate users who no longer need access.',
        placement: 'top',
      },
    ],
  },
  {
    route: '/admin/settings',
    label: 'Settings',
    steps: [
      {
        target: '[data-tour="settings-tabs"]',
        title: 'Settings Tabs',
        content: 'Configure your pharmacy: Store Info, Tax rates, Receipt customization, and Backup & Sync.',
        placement: 'right',
      },
      {
        target: '[data-tour="settings-content"]',
        title: 'Settings Content',
        content: 'Each tab provides relevant configuration options. Changes are saved locally and synced when online.',
        placement: 'left',
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
        target: '[data-tour="profile-account"]',
        title: 'Account Info',
        content: 'Update your name and email address at any time.',
        placement: 'top',
      },
      {
        target: '[data-tour="profile-pin"]',
        title: 'Change PIN',
        content: 'Change your 5-digit login PIN here for security purposes.',
        placement: 'top',
      },
    ],
  },
];
