import { useEffect, useState } from 'react';

interface AutoSaveOptions {
  key: string;
  defaultValue: any;
  debounceMs?: number;
}

export function useAutoSave<T>({ key, defaultValue, debounceMs = 1000 }: AutoSaveOptions) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        setIsSaving(true);
        localStorage.setItem(key, JSON.stringify(value));
        setIsSaving(false);
      } catch (error) {
        console.error(`Failed to save ${key} to localStorage:`, error);
        setIsSaving(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, key, debounceMs]);

  const updateValue = (newValue: T | ((prev: T) => T)) => {
    setValue(prev => typeof newValue === 'function' ? (newValue as Function)(prev) : newValue);
  };

  const resetToDefault = () => {
    setValue(defaultValue);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
  };

  return {
    value,
    setValue: updateValue,
    isSaving,
    resetToDefault
  };
}

// Hook for managing multiple user preferences
export function useUserPreferences() {
  const timeRange = useAutoSave<'24h' | '7d' | '30d'>({
    key: 'user-timeRange',
    defaultValue: '30d'
  });

  const activeView = useAutoSave<'overview' | 'behavior' | 'sources' | 'conversions'>({
    key: 'user-activeView',
    defaultValue: 'overview'
  });

  const theme = useAutoSave({
    key: 'user-theme',
    defaultValue: 'dark'
  });

  const dashboardLayout = useAutoSave({
    key: 'user-dashboardLayout',
    defaultValue: 'default'
  });

  const notificationsEnabled = useAutoSave({
    key: 'user-notificationsEnabled',
    defaultValue: true
  });

  return {
    timeRange,
    activeView,
    theme,
    dashboardLayout,
    notificationsEnabled
  };
}
