import React from 'react';
import { Quotation } from '../types';
import { formatCurrency } from '../utils/storage';

interface QuotationPrintViewProps {
  quotation: Quotation;
  onClose: () => void;
}

export const QuotationPrintView: React.FC<QuotationPrintViewProps> = ({ quotation, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)' }}
      role="dialog"
      aria-modal="true"
      id="modal-quotation-print"
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          {/* 控制列 (列印時會隱藏) */}
          <div className="modal-header bg-dark text-white no-print py-2">
            <div className="d-flex align-items-center">
              <i className="fa-solid fa-print me-2 text-warning"></i>
              <span className="fw-bold">報價單正式單據預覽 / 列印</span>
              <span className="badge bg-light text-dark ms-2 font-monospace">{quotation.id}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary d-flex align-items-center"
                onClick={handlePrint}
                id="btn-trigger-print"
              >
                <i className="fa-solid fa-print me-1"></i>
                列印單據 (Print / PDF)
              </button>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
          </div>

          <div className="modal-body p-4 p-md-5 bg-light">
            {/* 正式報價單 A4 列印主體 */}
            <div
              id="print-area"
              className="bg-white p-4 p-md-5 rounded shadow-sm mx-auto border"
              style={{ maxWidth: '880px', color: '#1f2937' }}
            >
              {/* 報價單抬頭與公司標記 */}
              <div className="row align-items-center mb-4 pb-3 border-bottom border-2 border-primary">
                <div className="col-8">
                  <div className="d-flex align-items-center mb-2">
                    <div
                      className="bg-primary text-white rounded p-2 me-3 d-flex align-items-center justify-content-center"
                      style={{ width: '44px', height: '44px' }}
                    >
                      <i className="fa-solid fa-file-invoice-dollar fs-4"></i>
                    </div>
                    <div>
                      <h3 className="fw-bold mb-0 text-primary">智匯雲端數位商務股份有限公司</h3>
                      <small className="text-muted">Cloud Intelligent Business Solutions Ltd.</small>
                    </div>
                  </div>
                  <div className="small text-muted ps-1">
                    統一編號：88996633 ｜ 電話：(02) 2345-6789 ｜ 傳真：(02) 2345-6780
                    <br />
                    公司地址：台北市信義區信義路五段7號82樓
                  </div>
                </div>
                <div className="col-4 text-end">
                  <h2 className="fw-bold tracking-wider text-dark mb-1">專案報價單</h2>
                  <div className="badge bg-primary fs-6 font-monospace px-3 py-1">
                    {quotation.id}
                  </div>
                  <div className="text-muted small mt-1">
                    製單日期：{quotation.quotationDate}
                  </div>
                </div>
              </div>

              {/* 客戶與報價資訊表頭 */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded bg-light h-100">
                    <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">
                      <i className="fa-regular fa-building me-1"></i>客戶基本資料
                    </h6>
                    <table className="table table-sm table-borderless mb-0 small">
                      <tbody>
                        <tr>
                          <td className="text-muted fw-semibold" style={{ width: '85px' }}>客戶名稱：</td>
                          <td className="fw-bold text-dark">{quotation.customerName}</td>
                        </tr>
                        {quotation.customerContact && (
                          <tr>
                            <td className="text-muted fw-semibold">聯絡窗口：</td>
                            <td>{quotation.customerContact}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="text-muted fw-semibold">送貨地址：</td>
                          <td>{quotation.address}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded bg-light h-100">
                    <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">
                      <i className="fa-solid fa-user-check me-1"></i>報價人員及條件
                    </h6>
                    <table className="table table-sm table-borderless mb-0 small">
                      <tbody>
                        <tr>
                          <td className="text-muted fw-semibold" style={{ width: '85px' }}>報價專員：</td>
                          <td className="fw-bold text-dark">{quotation.salesPerson}</td>
                        </tr>
                        <tr>
                          <td className="text-muted fw-semibold">連絡電話：</td>
                          <td>{quotation.salesPhone}</td>
                        </tr>
                        <tr>
                          <td className="text-muted fw-semibold">付款條件：</td>
                          <td className="fw-semibold text-primary">{quotation.paymentTerms || '先付款後出貨'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted fw-semibold">有效天數：</td>
                          <td>自開立起 {quotation.validDays} 天內有效</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 報價明細表格 */}
              <div className="table-responsive mb-4">
                <table className="table table-bordered align-middle">
                  <thead className="table-primary text-dark">
                    <tr className="small text-center">
                      <th style={{ width: '50px' }}>項次</th>
                      <th className="text-start">產品名稱與規格說明</th>
                      <th style={{ width: '120px' }} className="text-end">單價 (NT$)</th>
                      <th style={{ width: '80px' }}>數量</th>
                      <th style={{ width: '130px' }} className="text-end">複價小計 (NT$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="text-center font-monospace small">{index + 1}</td>
                        <td>
                          <strong className="text-dark d-block">{item.productName}</strong>
                          {item.description && (
                            <small className="text-muted d-block">{item.description}</small>
                          )}
                        </td>
                        <td className="text-end font-monospace">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-center font-monospace fw-semibold">{item.quantity}</td>
                        <td className="text-end font-monospace fw-bold text-dark">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 金額統計總計 */}
              <div className="row g-3 justify-content-end mb-4">
                <div className="col-12 col-md-5">
                  <div className="p-3 border rounded bg-light">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">小計 (未稅)：</span>
                      <strong className="font-monospace">{formatCurrency(quotation.totalAmount)}</strong>
                    </div>
                    {quotation.taxIncluded && (
                      <div className="d-flex justify-content-between mb-2 text-muted">
                        <span>營業稅 (5% VAT)：</span>
                        <span className="font-monospace">{formatCurrency(quotation.taxAmount)}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between align-items-center fs-5">
                      <strong className="text-primary">總計金額：</strong>
                      <strong className="text-primary font-monospace fs-4">
                        {formatCurrency(quotation.grandTotal)}
                      </strong>
                    </div>
                    <div className="text-muted small text-end mt-1">
                      {quotation.taxIncluded ? '（含 5% 營業稅）' : '（未稅價格）'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 報價條款與備註 */}
              {quotation.notes && (
                <div className="p-3 border rounded bg-light mb-4">
                  <h6 className="fw-bold small text-dark mb-1">
                    <i className="fa-solid fa-circle-info me-1 text-primary"></i>約定條款與備註事項：
                  </h6>
                  <p className="small text-muted mb-0">{quotation.notes}</p>
                </div>
              )}

              {/* 簽章欄位 */}
              <div className="row g-4 pt-4 border-top">
                <div className="col-6">
                  <div className="p-3 border rounded text-center" style={{ minHeight: '120px' }}>
                    <small className="text-muted d-block mb-4">報價單位主管簽核 / 公司蓋章處</small>
                    <div className="border-bottom border-secondary border-dashed w-75 mx-auto mt-4"></div>
                    <small className="text-muted d-block mt-2">簽署日期：____ 年 ____ 月 ____ 日</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 border rounded text-center" style={{ minHeight: '120px' }}>
                    <small className="text-muted d-block mb-4">客戶確認回簽專區 (請簽名或蓋用印章回傳)</small>
                    <div className="border-bottom border-secondary border-dashed w-75 mx-auto mt-4"></div>
                    <small className="text-muted d-block mt-2">簽署日期：____ 年 ____ 月 ____ 日</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light no-print">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              關閉預覽
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              <i className="fa-solid fa-print me-1"></i>
              立即列印
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
