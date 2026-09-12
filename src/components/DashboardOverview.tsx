import React from 'react';
import { Customer, Vendor, Product, Quotation, ActiveTab } from '../types';
import { formatCurrency } from '../utils/storage';

interface DashboardOverviewProps {
  customers: Customer[];
  vendors: Vendor[];
  products: Product[];
  quotations: Quotation[];
  onNavigate: (tab: ActiveTab) => void;
  onQuickNewQuote: () => void;
  onViewQuoteDetail: (quote: Quotation) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  customers,
  vendors,
  products,
  quotations,
  onNavigate,
  onQuickNewQuote,
  onViewQuoteDetail,
}) => {
  const totalQuotationAmount = quotations.reduce((acc, q) => acc + q.grandTotal, 0);
  const recentQuotations = [...quotations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);

  return (
    <div className="container-fluid py-4" id="section-dashboard">
      {/* 歡迎橫幅 */}
      <div className="card border-0 bg-white shadow-sm mb-4 overflow-hidden">
        <div
          className="p-4 p-md-5 text-white"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
          }}
        >
          <div className="row align-items-center">
            <div className="col-12 col-lg-8">
              <div className="d-inline-flex align-items-center bg-white bg-opacity-25 px-3 py-1 rounded-pill small mb-2">
                <i className="fa-solid fa-circle-check me-2 text-warning"></i>
                前端純原型系統 ｜ RWD 響應式佈局 ｜ 本地資料保存
              </div>
              <h1 className="fw-bold display-6 mb-2">歡迎使用 報價單管理系統</h1>
              <p className="lead fs-6 mb-3 text-white-50" style={{ maxWidth: '650px' }}>
                本系統提供標準化企業商務作業流程，支援客戶、廠商、產品目錄集中化管理，並具備動態多項目報價單開立、售價與說明自動連動、單價數量即時計算以及正式列印單據功能。
              </p>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-warning fw-bold px-4 py-2 shadow-sm"
                  onClick={onQuickNewQuote}
                  id="btn-dash-create-quote"
                >
                  <i className="fa-solid fa-plus me-1"></i>
                  立即開立報價單
                </button>
                <button
                  type="button"
                  className="btn btn-outline-light px-3 py-2"
                  onClick={() => onNavigate('quotations')}
                >
                  <i className="fa-solid fa-receipt me-1"></i>
                  瀏覽全部報價單
                </button>
              </div>
            </div>
            <div className="col-12 col-lg-4 d-none d-lg-block text-center">
              <i className="fa-solid fa-file-invoice-dollar display-1 text-white-50"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 四大核心指標卡片 */}
      <div className="row g-3 mb-4">
        {/* 客戶數 */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm h-100 p-3 bg-white cursor-pointer hover-card"
            onClick={() => onNavigate('customers')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            id="kpi-customers"
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small">客戶總數</span>
              <div className="bg-primary-subtle text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="fa-solid fa-users"></i>
              </div>
            </div>
            <div className="d-flex align-items-baseline justify-content-between">
              <h3 className="fw-bold mb-0 text-dark">{customers.length}</h3>
              <span className="badge bg-light text-primary border">前往客戶管理 →</span>
            </div>
            <small className="text-muted mt-2 d-block">管理聯絡窗口、付款條件與收件地址</small>
          </div>
        </div>

        {/* 廠商數 */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm h-100 p-3 bg-white cursor-pointer hover-card"
            onClick={() => onNavigate('vendors')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            id="kpi-vendors"
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small">供應廠商數</span>
              <div className="bg-success-subtle text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="fa-solid fa-truck-field"></i>
              </div>
            </div>
            <div className="d-flex align-items-baseline justify-content-between">
              <h3 className="fw-bold mb-0 text-dark">{vendors.length}</h3>
              <span className="badge bg-light text-success border">前往廠商管理 →</span>
            </div>
            <small className="text-muted mt-2 d-block">維護原廠代理商與進貨窗口資訊</small>
          </div>
        </div>

        {/* 產品數 */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm h-100 p-3 bg-white cursor-pointer hover-card"
            onClick={() => onNavigate('products')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            id="kpi-products"
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small">產品品項目錄</span>
              <div className="bg-warning-subtle text-warning-emphasis rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="fa-solid fa-boxes-stacked"></i>
              </div>
            </div>
            <div className="d-flex align-items-baseline justify-content-between">
              <h3 className="fw-bold mb-0 text-dark">{products.length}</h3>
              <span className="badge bg-light text-warning-emphasis border">前往產品目錄 →</span>
            </div>
            <small className="text-muted mt-2 d-block">成本、售價、規格與毛利率自動試算</small>
          </div>
        </div>

        {/* 報價單總額 */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card border-0 shadow-sm h-100 p-3 bg-white cursor-pointer hover-card"
            onClick={() => onNavigate('quotations')}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            id="kpi-quotations"
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-semibold small">累積報價總額 ({quotations.length} 筆)</span>
              <div className="bg-info-subtle text-info-emphasis rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="fa-solid fa-receipt"></i>
              </div>
            </div>
            <div className="d-flex align-items-baseline justify-content-between">
              <h3 className="fw-bold mb-0 text-primary font-monospace">{formatCurrency(totalQuotationAmount)}</h3>
              <span className="badge bg-light text-info-emphasis border">檢視單據 →</span>
            </div>
            <small className="text-muted mt-2 d-block">支援動態多品項與正式 A4 報價單列印</small>
          </div>
        </div>
      </div>

      {/* 下方兩欄：最近報價單列表 & 系統功能導覽手冊 */}
      <div className="row g-4">
        {/* 最近開立的報價單 */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
              <div className="fw-bold text-dark fs-6 d-flex align-items-center">
                <i className="fa-solid fa-clock-rotate-left text-primary me-2"></i>
                近期開立之報價單
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none"
                onClick={() => onNavigate('quotations')}
              >
                查看全部 ({quotations.length}) →
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>單號</th>
                      <th>客戶名稱</th>
                      <th>報價日期</th>
                      <th className="text-end">總計金額</th>
                      <th className="text-center">狀態</th>
                      <th className="text-end">明細</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentQuotations.map((quote) => (
                      <tr key={quote.id}>
                        <td>
                          <span className="badge bg-light text-dark border font-monospace">
                            {quote.id}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{quote.customerName}</div>
                          <small className="text-muted">{quote.salesPerson}</small>
                        </td>
                        <td className="small text-muted">{quote.quotationDate}</td>
                        <td className="text-end font-monospace fw-bold text-primary">
                          {formatCurrency(quote.grandTotal)}
                        </td>
                        <td className="text-center">
                          {quote.status === 'confirmed' ? (
                            <span className="badge bg-success">已確認</span>
                          ) : quote.status === 'sent' ? (
                            <span className="badge bg-primary">已送出</span>
                          ) : quote.status === 'rejected' ? (
                            <span className="badge bg-danger">已作廢</span>
                          ) : (
                            <span className="badge bg-secondary">草稿</span>
                          )}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => onViewQuoteDetail(quote)}
                          >
                            <i className="fa-solid fa-eye me-1"></i>
                            檢視
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 系統規格特點與防呆檢核說明 */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3 border-bottom">
              <div className="fw-bold text-dark fs-6 d-flex align-items-center">
                <i className="fa-solid fa-shield-halved text-success me-2"></i>
                系統規格與防呆驗證規範
              </div>
            </div>
            <div className="card-body p-3 small">
              <div className="mb-3">
                <h6 className="fw-bold text-primary mb-1">
                  <i className="fa-solid fa-hashtag me-1"></i>自動編號機制
                </h6>
                <p className="text-muted mb-0">
                  全模組均支援智慧自動流水號（客戶 <code>CUST-xxx</code>、廠商 <code>VEND-xxx</code>、產品 <code>PROD-xxx</code>、報價單 <code>QUO-年月-xxx</code>）。
                </p>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold text-primary mb-1">
                  <i className="fa-solid fa-check-double me-1"></i>表單驗證與防呆 (Validation)
                </h6>
                <p className="text-muted mb-0">
                  所有標註「*」必填欄位均綁定 Bootstrap 5 即時驗證樣式（<code>was-validated</code>、<code>invalid-feedback</code>），嚴格檢查 Email 格式與台灣電話號碼格式。
                </p>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold text-primary mb-1">
                  <i className="fa-solid fa-calculator me-1"></i>動態多筆項目與連動計算
                </h6>
                <p className="text-muted mb-0">
                  單筆報價單可隨選產品，自動帶入該產品售價與規格說明；輸入數量後自動即時連動計算複價，並支援外加 5% 營業稅總額計算。
                </p>
              </div>

              <div>
                <h6 className="fw-bold text-primary mb-1">
                  <i className="fa-solid fa-mobile-screen-button me-1"></i>RWD 響應式友善
                </h6>
                <p className="text-muted mb-0">
                  所有表格具備橫向滾動保護機制，於手機直式或平板桌機上皆不破版溢出。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
