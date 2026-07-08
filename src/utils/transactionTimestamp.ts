import { format } from 'date-fns';

const timestampDatePattern = /^(\d{4}-\d{2}-\d{2})[T ]/;
const timezoneSuffixPattern = /(Z|[+-]\d{2}:?\d{2})$/i;

export const toSupabaseTransactionTimestamp = (timestamp: string): string => {
  if (!timezoneSuffixPattern.test(timestamp)) {
    return timestamp.replace(' ', 'T');
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS");
};

export const getTransactionDate = (timestamp: string): string => {
  const localMatch = timestamp.match(timestampDatePattern);
  if (localMatch) {
    return localMatch[1];
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp.split('T')[0];
  }

  return format(date, 'yyyy-MM-dd');
};
