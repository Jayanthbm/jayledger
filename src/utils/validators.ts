export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export const validateAmount = (amount: string | number): ValidationResult => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return { valid: false, errors: { amount: 'Amount must be greater than 0' } };
  }
  if (num > 999999999) {
    return { valid: false, errors: { amount: 'Amount is too large' } };
  }
  return { valid: true, errors: {} };
};

export const validateTransaction = (data: {
  amount: string | number;
  description: string;
  categoryId: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  const amountResult = validateAmount(data.amount);
  if (!amountResult.valid) errors.amount = amountResult.errors.amount;

  if (data.description && data.description.length > 500) {
    errors.description = 'Description is too long';
  }

  if (!data.categoryId) {
    errors.categoryId = 'Category is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateGoal = (data: {
  name: string;
  targetAmount: string | number;
  currentAmount: string | number;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = 'Goal name is required';
  }

  const targetResult = validateAmount(data.targetAmount);
  if (!targetResult.valid) errors.targetAmount = targetResult.errors.amount;

  const currentResult =
    typeof data.currentAmount === 'number' ? data.currentAmount : parseFloat(data.currentAmount);
  if (isNaN(currentResult) || currentResult < 0) {
    errors.currentAmount = 'Current amount cannot be negative';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateBudget = (data: {
  name: string;
  categories: string[];
  amount: string | number;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = 'Budget name is required';
  }

  if (!data.categories || data.categories.length === 0) {
    errors.categories = 'At least one category is required';
  }

  const amountResult = validateAmount(data.amount);
  if (!amountResult.valid) errors.amount = amountResult.errors.amount;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
