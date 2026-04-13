export type NavLink = {
  label: string;
  path: string;
  icon: string;
};

export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Offers', path: '/offer', icon: 'shopping_bag' },
  { label: 'Requests', path: '/request', icon: 'concierge' },
  { label: 'History', path: '/history', icon: 'receipt_long' },
  { label: 'Profile', path: '/profile', icon: 'account_circle' },
];
