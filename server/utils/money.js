/**
 * Utility functions for currency (PKR integer values)
 */

/**
 * Format integer PKR into currency string e.g. 12500 -> "Rs. 12,500"
 * @param {number} amount 
 * @returns {string}
 */
function formatMoney(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs. 0';
  }
  const numeric = Math.round(Number(amount));
  const formatted = numeric.toLocaleString('en-PK');
  return `Rs. ${formatted}`;
}

/**
 * Ensures amount is a valid integer >= 0
 * @param {any} val 
 * @returns {number}
 */
function parseIntegerPKR(val) {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

module.exports = {
  formatMoney,
  parseIntegerPKR
};
