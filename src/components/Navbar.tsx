import React, { useState } from 'react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  counts: {
    customers: number;
    vendors: number;
    products: number;
    quotations: number;
  };
  onQuickNewQuote: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  counts,
  onQuickNewQuote,
  onResetData,
}) => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    setIsNavCollapsed(true);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top py-2" id="main-nav">
      <div className="container-fluid px-3 px-lg-4">
        {/* LOGO & 系統標題 */}
        <button
          className="navbar-brand d-flex align-items-center border-0 bg-transparent text-white p-0 text-decoration-none"
          onClick={() => handleNavClick('dashboard')}
          id="btn-brand-home"
        >
          <div
            className="d-flex align-items-center justify-content-center bg-primary text-white rounded-3 shadow-sm me-2"
            style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
          >
            <i className="fa-solid fa-file-invoice-dollar fs-5"></i>
          </div>
          <div className="text-start">
            <span className="fw-bold fs-5 tracking-wide text-white d-block lh-1">報價單管理系統</span>
            <small className="text-white-50" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              Quotation Management System
            </small>
          </div>
        </button>

        {/* 手機版漢堡選單切換按鈕 */}
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          aria-label="切換選單"
          id="btn-navbar-toggle"
        >
          <i className="fa-solid fa-bars fs-4 text-white"></i>
        </button>

        {/* 導覽列內容 */}
        <div className={`collapse navbar-collapse ${isNavCollapsed ? '' : 'show'}`} id="navbar-content">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-1 pt-2 pt-lg-0">
            <li className="nav-item">
              <button
                className={`nav-link border-0 bg-transparent text-start w-100 px-3 py-2 rounded-2 ${
                  activeTab === 'dashboard' ? 'active fw-bold text-white bg-primary' : 'text-white-50'
                }`}
                onClick={() => handleNavClick('dashboard')}
                id="nav-tab-dashboard"
              >
                <i className="fa-solid fa-chart-pie me-2"></i>
                系統總覽
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link border-0 bg-transparent text-start w-100 px-3 py-2 rounded-2 d-flex align-items-center justify-content-between ${
                  activeTab === 'customers' ? 'active fw-bold text-white bg-primary' : 'text-white-50'
                }`}
                onClick={() => handleNavClick('customers')}
                id="nav-tab-customers"
              >
                <span>
                  <i className="fa-solid fa-users me-2"></i>
                  客戶管理
                </span>
                <span className="badge bg-secondary rounded-pill ms-2">{counts.customers}</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link border-0 bg-transparent text-start w-100 px-3 py-2 rounded-2 d-flex align-items-center justify-content-between ${
                  activeTab === 'vendors' ? 'active fw-bold text-white bg-primary' : 'text-white-50'
                }`}
                onClick={() => handleNavClick('vendors')}
                id="nav-tab-vendors"
              >
                <span>
                  <i className="fa-solid fa-truck-field me-2"></i>
                  廠商管理
                </span>
                <span className="badge bg-secondary rounded-pill ms-2">{counts.vendors}</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link border-0 bg-transparent text-start w-100 px-3 py-2 rounded-2 d-flex align-items-center justify-content-between ${
                  activeTab === 'products' ? 'active fw-bold text-white bg-primary' : 'text-white-50'
                }`}
                onClick={() => handleNavClick('products')}
                id="nav-tab-products"
              >
                <span>
                  <i className="fa-solid fa-boxes-stacked me-2"></i>
                  產品管理
                </span>
                <span className="badge bg-secondary rounded-pill ms-2">{counts.products}</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link border-0 bg-transparent text-start w-100 px-3 py-2 rounded-2 d-flex align-items-center justify-content-between ${
                  activeTab === 'quotations' ? 'active fw-bold text-white bg-primary' : 'text-white-50'
                }`}
                onClick={() => handleNavClick('quotations')}
                id="nav-tab-quotations"
              >
                <span>
                  <i className="fa-solid fa-receipt me-2"></i>
                  報價單管理
                </span>
                <span className="badge bg-primary rounded-pill ms-2">{counts.quotations}</span>
              </button>
            </li>
          </ul>

          {/* 右側快捷操作按鈕 */}
          <div className="d-flex flex-wrap align-items-center gap-2 pt-2 pt-lg-0">
            <button
              className="btn btn-sm btn-outline-light d-flex align-items-center"
              onClick={() => {
                if (window.confirm('確定要將系統資料重置為預設範例資料嗎？')) {
                  onResetData();
                  setIsNavCollapsed(true);
                }
              }}
              title="重置系統為預設展示資料"
              id="btn-reset-demo"
            >
              <i className="fa-solid fa-rotate-left me-1"></i>
              重設範例
            </button>
            <button
              className="btn btn-sm btn-primary d-flex align-items-center shadow-sm"
              onClick={() => {
                onQuickNewQuote();
                setIsNavCollapsed(true);
              }}
              id="btn-quick-new-quote"
            >
              <i className="fa-solid fa-plus me-1"></i>
              開立報價單
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
