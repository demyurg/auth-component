import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

export const useLocalStorageWithSubscription = <T>(key: string, raw = false) => {
  const queryClient = useQueryClient();

  const setValue = useCallback((value: T | null) => {
    queryClient.setQueryData(['localStorage', key], value);
    if (value !== null) {
      // Если raw=true, сохраняем как есть (для примитивов)
      localStorage.setItem(key, raw ? String(value) : JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  }, [key, queryClient, raw])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        const newValue = event.newValue;
        if (newValue === null) {
          queryClient.setQueryData(['localStorage', key], null);
        } else {
          // Если raw=true, возвращаем как есть
          if (raw) {
            queryClient.setQueryData(['localStorage', key], newValue as T);
          } else {
            try {
              queryClient.setQueryData(['localStorage', key], JSON.parse(newValue) as T);
            } catch {
              queryClient.setQueryData(['localStorage', key], newValue as T);
            }
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    }
  }, [key, queryClient, raw]);

  return {
    ...useQuery({
      queryKey: ['localStorage', key],
      queryFn: () => {
        const item = localStorage.getItem(key);
        if (item === null) {
          return null
        }
        // Если raw=true, возвращаем как есть
        if (raw) {
          return item as T;
        }
        try {
          return JSON.parse(item) as T;
        } catch {
          return item as T
        }
      },
      staleTime: Infinity,
      retry: false,
    }),
    setValue
  };
};