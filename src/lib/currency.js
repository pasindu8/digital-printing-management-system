export function formatCurrency(amount) {
  const number = Number(amount) || 0;
  return `Rs. ${number.toFixed(2)}`;
}
