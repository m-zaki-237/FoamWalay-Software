/**
 * Client currency and date formatting utilities
 */

export function formatMoney(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs. 0';
  }
  const numeric = Math.round(Number(amount));
  return `Rs. ${numeric.toLocaleString('en-PK')}`;
}

export function formatDate(dateStr, includeTime = false) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return d.toLocaleDateString('en-PK', options);
}

export function formatDateInput(dateObj = new Date()) {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
