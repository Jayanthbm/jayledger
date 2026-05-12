import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';

interface UseAsyncOperationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  showErrorToast?: boolean;
}

export const useAsyncOperation = <T, Args extends unknown[]>(
  operation: (...args: Args) => Promise<T>,
  options: UseAsyncOperationOptions<T> = {},
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<T | null>(null);

  // Use a ref for options to avoid stable function reference issues
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const execute = useCallback(
    async (...args: Args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await operation(...args);
        setData(result);
        if (optionsRef.current.onSuccess) {
          optionsRef.current.onSuccess(result);
        }
        return result;
      } catch (err) {
        setError(err);
        logger.error('[useAsyncOperation]', err);
        if (optionsRef.current.onError) {
          optionsRef.current.onError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [operation], // Only operation is a dependency now
  );

  return { execute, loading, error, data, setData };
};
