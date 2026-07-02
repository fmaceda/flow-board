import { useAuthStore } from '@/store/auth.store';

/**
 * Returns the currently authenticated user from the Zustand store.
 * null means the user is not yet loaded or not logged in.
 */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}
