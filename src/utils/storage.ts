import { Customer, Vendor, Product, Quotation } from '../types';
import { INITIAL_CUSTOMERS, INITIAL_VENDORS, INITIAL_PRODUCTS, INITIAL_QUOTATIONS } from '../data/initialData';

const KEYS = {
  CUSTOMERS: 'quote_sys_customers',
  VENDORS: 'quote_sys_vendors',
  PRODUCTS: 'quote_sys_products',
  QUOTATIONS: 'quote_sys_quotations',
};

// 取得客戶列表
export const getStoredCustomers = (): Customer[] => {
  const data = localStorage.getItem(KEYS.CUSTOMERS);
  if (!data) {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    return INITIAL_CUSTOMERS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_CUSTOMERS;
  }
};

export const saveCustomers = (customers: Customer[]): void => {
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
};

// 取得廠商列表
export const getStoredVendors = (): Vendor[] => {
  const data = localStorage.getItem(KEYS.VENDORS);
  if (!data) {
    localStorage.setItem(KEYS.VENDORS, JSON.stringify(INITIAL_VENDORS));
    return INITIAL_VENDORS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_VENDORS;
  }
};

export const saveVendors = (vendors: Vendor[]): void => {
  localStorage.setItem(KEYS.VENDORS, JSON.stringify(vendors));
};

// 取得產品列表
export const getStoredProducts = (): Product[] => {
  const data = localStorage.getItem(KEYS.PRODUCTS);
  if (!data) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_PRODUCTS;
  }
};

export const saveProducts = (products: Product[]): void => {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
};

// 取得報價單列表
export const getStoredQuotations = (): Quotation[] => {
  const data = localStorage.getItem(KEYS.QUOTATIONS);
  if (!data) {
    localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
    return INITIAL_QUOTATIONS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_QUOTATIONS;
  }
};

export const saveQuotations = (quotations: Quotation[]): void => {
  localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(quotations));
};

// 重設所有範例資料
export const resetAllData = (): void => {
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  localStorage.setItem(KEYS.VENDORS, JSON.stringify(INITIAL_VENDORS));
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(KEYS.QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
};

// 自動編號產生器
export const generateNextId = (prefix: string, existingIds: string[]): string => {
  let maxNum = 0;
  const regex = new RegExp(`^${prefix}-?(?:\\d{6}-)?(\\d+)$`);

  for (const id of existingIds) {
    const match = id.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}-${String(nextNum).padStart(3, '0')}`;
};

export const generateNextQuotationId = (quotations: Quotation[]): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const datePrefix = `QUO-${year}${month}`;

  let maxNum = 0;
  const regex = new RegExp(`^${datePrefix}-(\\d+)$`);

  for (const q of quotations) {
    const match = q.id.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${datePrefix}-${String(nextNum).padStart(3, '0')}`;
};

// 驗證工具
export const isValidEmail = (email: string): boolean => {
  if (!email || !email.trim()) return false;
  // 現代 RFC 5322 基本驗證正規表達式
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

export const isValidPhone = (phone: string): boolean => {
  if (!phone || !phone.trim()) return false;
  // 支援手機 09xx-xxx-xxx、09xxxxxxxx 或 市話 02-xxxx-xxxx / 0x-xxxxxxx / 帶分機等格式
  const phoneRegex = /^0\d{1,2}-?\d{3,4}-?\d{3,4}(?:#\d+)?$/;
  return phoneRegex.test(phone.trim().replace(/\s+/g, ''));
};

// 金額格式化
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('zh-TW').format(num);
};
