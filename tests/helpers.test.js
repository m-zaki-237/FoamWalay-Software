import { describe, it, expect } from 'vitest';
import { formatMoney, parseIntegerPKR } from '../server/utils/money';

describe('Money & Calculation Helper Utilities', () => {
  it('formats integer PKR currency strings correctly', () => {
    expect(formatMoney(15000)).toBe('Rs. 15,000');
    expect(formatMoney(0)).toBe('Rs. 0');
    expect(formatMoney(1250500)).toBe('Rs. 1,250,500');
    expect(formatMoney(null)).toBe('Rs. 0');
  });

  it('parses valid integer PKR values correctly', () => {
    expect(parseIntegerPKR('18500')).toBe(18500);
    expect(parseIntegerPKR(12000)).toBe(12000);
    expect(parseIntegerPKR('-50')).toBe(0);
    expect(parseIntegerPKR('abc')).toBe(0);
  });

  it('correctly calculates Revenue, COGS, and Gross Profit', () => {
    const unitPrice = 18500;
    const unitCost = 14000;
    const qty = 2;

    const revenue = unitPrice * qty;
    const cogs = unitCost * qty;
    const grossProfit = revenue - cogs;

    expect(revenue).toBe(37000);
    expect(cogs).toBe(28000);
    expect(grossProfit).toBe(9000);
  });

  it('correctly calculates Inventory Cost Value and Retail Value', () => {
    const products = [
      { stock: 10, price: 15000, costPrice: 10000 },
      { stock: 5, price: 20000, costPrice: 15000 }
    ];

    const totalCostVal = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
    const totalRetailVal = products.reduce((acc, p) => acc + (p.stock * p.price), 0);

    expect(totalCostVal).toBe(10 * 10000 + 5 * 15000); // 100,000 + 75,000 = 175,000
    expect(totalRetailVal).toBe(10 * 15000 + 5 * 20000); // 150,000 + 100,000 = 250,000
  });
});
