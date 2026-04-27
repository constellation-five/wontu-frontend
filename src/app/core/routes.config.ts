export const PROTECTED_ROUTES: readonly string[] = ['/profile', '/history'];

export function isProtectedRoute(url: string): boolean {
  if (!url) return false;
  const path = url.split('?')[0].split('#')[0];
  return PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}
