export const formatIndianNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '₹0';
  const isNegative = num < 0;
  const absoluteValue = Math.abs(num);
  const formatted = absoluteValue.toLocaleString('en-IN');

  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
};
