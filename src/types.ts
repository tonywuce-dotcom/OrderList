export interface Customer {
  id: string; // 客戶代碼，例如 CUST-001
  companyName: string; // 公司名稱*
  contactPerson: string; // 聯絡窗口 (中文)*
  contactPersonEnglish?: string; // 連絡窗口英文姓名
  englishName?: string; // 公司英文名
  department?: string; // 部門
  jobTitle?: string; // 職稱
  phone: string; // 電話*
  email: string; // email*
  address: string; // 住址*
  paymentTerms?: string; // 付款條件
  notes?: string; // 備註
  createdAt: string;
}

export interface Vendor {
  id: string; // 廠商代碼，例如 VEND-001
  companyName: string; // 公司名稱*
  contactPerson: string; // 聯絡窗口 (中文)*
  contactPersonEnglish?: string; // 連絡窗口英文姓名
  englishName?: string; // 公司英文名
  department?: string; // 部門
  jobTitle?: string; // 職稱
  phone: string; // 電話*
  email: string; // email*
  address: string; // 住址*
  paymentTerms?: string; // 付款條件
  notes?: string; // 備註
  createdAt: string;
}

export interface Product {
  id: string; // 產品代碼，例如 PROD-001
  name: string; // 產品名稱*
  cost: number; // 成本*
  price: number; // 售價*
  unit?: string; // 單位 (件、台、組、個、箱等)
  imageUrl?: string; // 圖片
  brand?: string; // 廠牌
  specification?: string; // 規格
  description?: string; // 說明
  stockQuantity: number; // 庫存數量
  vendorId?: string; // 供應商 ID (對應廠商管理)
  vendorName?: string; // 供應商名稱
  createdAt: string;
}

export interface QuotationItem {
  id: string; // 項目唯一的臨時 ID
  productId: string; // 產品代碼*
  productName: string; // 產品名稱
  unitPrice: number; // 單價 (自動帶出可修改)
  description: string; // 說明 (自動帶出可修改)
  quantity: number; // 數量
  subtotal: number; // 複價 (單價 × 數量)
}

export interface Quotation {
  id: string; // 報價單號，例如 QUO-202609-001
  customerId: string; // 客戶名稱* (下拉選單)
  customerName: string; // 客戶公司名稱
  customerContact?: string; // 客戶聯絡人
  salesPerson: string; // 報價人員*
  salesPhone: string; // 連絡電話*
  address: string; // 住址*
  paymentTerms?: string; // 付款條件
  quotationDate: string; // 報價日期
  validDays: number; // 有效天數 (預設30天)
  items: QuotationItem[]; // 報價項目列表
  totalAmount: number; // 總價
  taxIncluded: boolean; // 是否含稅 (5%)
  taxAmount: number; // 稅額
  grandTotal: number; // 最終總額 (含稅/未稅)
  notes?: string; // 備註條款
  status: 'draft' | 'sent' | 'confirmed' | 'rejected'; // 狀態
  createdAt: string;
}

export type ActiveTab = 'dashboard' | 'customers' | 'vendors' | 'products' | 'quotations';
