import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

const CHECK_INTERVAL_MS = 60_000;

/**
 * Calls `check` when the screen comes into view, when the app returns to the foreground,
 * and once a minute while it stays open, so screens left open overnight notice the new day.
 * Wrap `check` in useCallback.
 */
export function useDayChangeCheck(check: () => void): void {
  useFocusEffect(
    useCallback(() => {
      check();
      const interval = setInterval(check, CHECK_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [check])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        check();
      }
    });
    return () => subscription.remove();
  }, [check]);
}
