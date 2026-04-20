import { useState, useCallback } from 'react';
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

  const execute = useCallback(
    async (...args: Args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await operation(...args);
        setData(result);
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        return result;
      } catch (err) {
        setError(err);
        logger.error('[useAsyncOperation]', err);
        if (options.onError) {
          options.onError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [operation, options],
  );

  return { execute, loading, error, data, setData };
};
