import { useState, useCallback } from 'react';

export interface LoadingState<T = any> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
}

export interface UseLoadingStateReturn<T = any> {
  state: LoadingState<T>;
  setLoading: () => void;
  setSuccess: (data: T) => void;
  setError: (error: string) => void;
  reset: () => void;
}

/**
 * Custom hook for managing loading, error, and data states
 * Provides helper methods for common state transitions
 */
export function useLoadingState<T = any>(
  initialData: T | null = null
): UseLoadingStateReturn<T> {
  const [state, setState] = useState<LoadingState<T>>({
    isLoading: false,
    error: null,
    data: initialData,
  });

  const setLoading = useCallback(() => {
    setState({
      isLoading: true,
      error: null,
      data: null,
    });
  }, []);

  const setSuccess = useCallback((data: T) => {
    setState({
      isLoading: false,
      error: null,
      data,
    });
  }, []);

  const setError = useCallback((error: string) => {
    setState({
      isLoading: false,
      error,
      data: null,
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: initialData,
    });
  }, [initialData]);

  return {
    state,
    setLoading,
    setSuccess,
    setError,
    reset,
  };
}

export default useLoadingState;
