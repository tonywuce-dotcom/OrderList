import { useState, useEffect } from 'react';
import { Customer, Vendor, Product, Quotation, ActiveTab } from './types';
import {
  getStoredCustomers,
  saveCustomers,
  getStoredVendors,
  saveVendors,
  getStoredProducts,
  saveProducts,
  getStoredQuotations,
  saveQuotations,
  resetAllData,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { CustomerManagement } from './components/CustomerManagement';
import { VendorManagement } from './components/VendorManagement';
import { ProductManagement } from './components/ProductManagement';
import { QuotationManagement } from './components/QuotationManagement';
import { QuotationPrintView } from './components/QuotationPrintView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [initialCustomerIdForQuote, setInitialCustomerIdForQuote] = useState<string | null>(null);
  const [viewingQuoteFromDash, setViewingQuoteFromDash] = useState<Quotation | null>(null);

  // 初始化載入 LocalStorage 資料
  useEffect(() => {
    setCustomers(getStoredCustomers());
    setVendors(getStoredVendors());
    setProducts(getStoredProducts());
    setQuotations(getStoredQuotations());
  }, []);

  // 客戶操作處理
  const handleSaveCustomer = (customer: Customer) => {
    const exists = customers.some((c) => c.id === customer.id);
    let nextList: Customer[];
    if (exists) {
      nextList = customers.map((c) => (c.id === customer.id ? customer : c));
    } else {
      nextList = [customer, ...customers];
    }
    setCustomers(nextList);
    saveCustomers(nextList);
  };

  const handleDeleteCustomer = (id: string) => {
    const nextList = customers.filter((c) => c.id !== id);
    setCustomers(nextList);
    saveCustomers(nextList);
  };

  // 廠商操作處理
  const handleSaveVendor = (vendor: Vendor) => {
    const exists = vendors.some((v) => v.id === vendor.id);
    let nextList: Vendor[];
    if (exists) {
      nextList = vendors.map((v) => (v.id === vendor.id ? vendor : v));
    } else {
      nextList = [vendor, ...vendors];
    }
    setVendors(nextList);
    saveVendors(nextList);
  };

  const handleDeleteVendor = (id: string) => {
    const nextList = vendors.filter((v) => v.id !== id);
    setVendors(nextList);
    saveVendors(nextList);
  };

  // 產品操作處理
  const handleSaveProduct = (product: Product) => {
    const exists = products.some((p) => p.id === product.id);
    let nextList: Product[];
    if (exists) {
      nextList = products.map((p) => (p.id === product.id ? product : p));
    } else {
      nextList = [product, ...products];
    }
    setProducts(nextList);
    saveProducts(nextList);
  };

  const handleDeleteProduct = (id: string) => {
    const nextList = products.filter((p) => p.id !== id);
    setProducts(nextList);
    saveProducts(nextList);
  };

  // 報價單操作處理
  const handleSaveQuotation = (quotation: Quotation) => {
    const exists = quotations.some((q) => q.id === quotation.id);
    let nextList: Quotation[];
    if (exists) {
      nextList = quotations.map((q) => (q.id === quotation.id ? quotation : q));
    } else {
      nextList = [quotation, ...quotations];
    }
    setQuotations(nextList);
    saveQuotations(nextList);
  };

  const handleDeleteQuotation = (id: string) => {
    const nextList = quotations.filter((q) => q.id !== id);
    setQuotations(nextList);
    saveQuotations(nextList);
  };

  // 重置資料
  const handleResetData = () => {
    resetAllData();
    setCustomers(getStoredCustomers());
    setVendors(getStoredVendors());
    setProducts(getStoredProducts());
    setQuotations(getStoredQuotations());
  };

  // 快捷跳轉開立報價單
  const handleQuickNewQuote = (customerId?: string) => {
    if (customerId) {
      setInitialCustomerIdForQuote(customerId);
    }
    setActiveTab('quotations');
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-slate-50" style={{ backgroundColor: '#f8fafc' }}>
      {/* 頂部導覽列 */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          customers: customers.length,
          vendors: vendors.length,
          products: products.length,
          quotations: quotations.length,
        }}
        onQuickNewQuote={() => handleQuickNewQuote()}
        onResetData={handleResetData}
      />

      {/* 主要內容檢視區 */}
      <main className="flex-grow-1">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            customers={customers}
            vendors={vendors}
            products={products}
            quotations={quotations}
            onNavigate={setActiveTab}
            onQuickNewQuote={() => handleQuickNewQuote()}
            onViewQuoteDetail={(quote) => setViewingQuoteFromDash(quote)}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerManagement
            customers={customers}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSelectCustomerForQuote={(customerId) => handleQuickNewQuote(customerId)}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorManagement
            vendors={vendors}
            products={products}
            onSaveVendor={handleSaveVendor}
            onDeleteVendor={handleDeleteVendor}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagement
            products={products}
            vendors={vendors}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'quotations' && (
          <QuotationManagement
            quotations={quotations}
            customers={customers}
            products={products}
            onSaveQuotation={handleSaveQuotation}
            onDeleteQuotation={handleDeleteQuotation}
            initialCustomerIdForNewQuote={initialCustomerIdForQuote}
            onClearInitialCustomer={() => setInitialCustomerIdForQuote(null)}
          />
        )}
      </main>

      {/* 從儀表板點選查看報價單時的列印/明細彈窗 */}
      {viewingQuoteFromDash && (
        <QuotationPrintView
          quotation={viewingQuoteFromDash}
          onClose={() => setViewingQuoteFromDash(null)}
        />
      )}

      {/* 頁腳 (Footer) */}
      <footer className="bg-white border-top py-3 mt-auto no-print">
        <div className="container-fluid px-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 text-muted small">
          <div>
            <span className="fw-semibold text-dark">報價單管理系統</span>
            <span className="mx-2">·</span>
            <span>純前端原型展示系統 (支援 RWD 響應式佈局)</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              <i className="fa-solid fa-circle-dot me-1"></i>LocalStorage 儲存中
            </span>
            <span>Bootstrap 5 & Font Awesome 6 本地套件</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
