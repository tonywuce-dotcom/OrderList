import React, { useState, useMemo, useEffect } from 'react';
import { Quotation, QuotationItem, Customer, Product } from '../types';
import { generateNextQuotationId, formatCurrency, isValidPhone } from '../utils/storage';
import { QuotationPrintView } from './QuotationPrintView';

interface QuotationManagementProps {
  quotations: Quotation[];
  customers: Customer[];
  products: Product[];
  onSaveQuotation: (quotation: Quotation) => void;
  onDeleteQuotation: (id: string) => void;
  initialCustomerIdForNewQuote?: string | null;
  onClearInitialCustomer?: () => void;
}

interface ItemRow {
  tempId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  description: string;
  quantity: number;
  subtotal: number;
}

interface FormState {
  id: string;
  customerId: string;
  salesPerson: string;
  salesPhone: string;
  address: string;
  paymentTerms: string;
  quotationDate: string;
  validDays: number;
  taxIncluded: boolean;
  notes: string;
  status: 'draft' | 'sent' | 'confirmed' | 'rejected';
  items: ItemRow[];
}

export const QuotationManagement: React.FC<QuotationManagementProps> = ({
  quotations,
  customers,
  products,
  onSaveQuotation,
  onDeleteQuotation,
  initialCustomerIdForNewQuote,
  onClearInitialCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailQuotation, setDetailQuotation] = useState<Quotation | null>(null);
  const [printQuotation, setPrintQuotation] = useState<Quotation | null>(null);

  const [formData, setFormData] = useState<FormState>({
    id: '',
    customerId: '',
    salesPerson: '張偉成',
    salesPhone: '0912-345-678',
    address: '',
    paymentTerms: '先付款後出貨',
    quotationDate: new Date().toISOString().split('T')[0],
    validDays: 30,
    taxIncluded: true,
    notes: '報價包含標準保固服務，確認回簽後生效。',
    status: 'draft',
    items: [],
  });

  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 搜尋與篩選
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter && q.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      return (
        q.id.toLowerCase().includes(term) ||
        q.customerName.toLowerCase().includes(term) ||
        q.salesPerson.toLowerCase().includes(term) ||
        q.address.toLowerCase().includes(term) ||
        q.items.some((i) => i.productName.toLowerCase().includes(term))
      );
    });
  }, [quotations, searchTerm, statusFilter]);

  // 動態計算金額
  const calculatedAmounts = useMemo(() => {
    const totalAmount = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = formData.taxIncluded ? Math.round(totalAmount * 0.05) : 0;
    const grandTotal = totalAmount + taxAmount;
    return { totalAmount, taxAmount, grandTotal };
  }, [formData.items, formData.taxIncluded]);

  // 當由外部觸發指定客戶建立報價單時
  useEffect(() => {
    if (initialCustomerIdForNewQuote) {
      handleOpenCreate(initialCustomerIdForNewQuote);
      if (onClearInitialCustomer) {
        onClearInitialCustomer();
      }
    }
  }, [initialCustomerIdForNewQuote]);

  // 驗證邏輯
  const validateForm = (data: FormState) => {
    const errs: { [key: string]: string } = {};

    if (!data.customerId) {
      errs.customerId = '請選擇報價客戶（必填）';
    }

    if (!data.salesPerson.trim()) {
      errs.salesPerson = '請輸入報價人員姓名（必填）';
    }

    if (!data.salesPhone.trim()) {
      errs.salesPhone = '請輸入連絡電話（必填）';
    } else if (!isValidPhone(data.salesPhone)) {
      errs.salesPhone = '電話格式不正確，如 02-12345678 或 0912-345-678';
    }

    if (!data.address.trim()) {
      errs.address = '請輸入送貨或報價住址（必填）';
    }

    if (!data.items || data.items.length === 0) {
      errs.items = '請至少加入一筆報價產品項目！';
    } else {
      const hasEmptyProduct = data.items.some((item) => !item.productId);
      if (hasEmptyProduct) {
        errs.items = '報價項目中尚有未選擇產品的項目列，請完成選取或刪除該列。';
      }
      const hasInvalidQty = data.items.some((item) => item.quantity <= 0 || isNaN(item.quantity));
      if (hasInvalidQty) {
        errs.items = '報價項目數量必須大於 0。';
      }
    }

    return errs;
  };

  // 開啟新增報價單
  const handleOpenCreate = (prefillCustomerId?: string) => {
    const nextId = generateNextQuotationId(quotations);
    let targetCustomerId = prefillCustomerId || (customers.length > 0 ? customers[0].id : '');
    let targetAddress = '';
    let targetPaymentTerms = '先付款後出貨';

    if (targetCustomerId) {
      const c = customers.find((cust) => cust.id === targetCustomerId);
      if (c) {
        targetAddress = c.address;
        if (c.paymentTerms) {
          targetPaymentTerms = c.paymentTerms;
        }
      }
    }

    // 預設給一個項目列
    const initialItems: ItemRow[] = [];
    if (products.length > 0) {
      const firstProd = products[0];
      initialItems.push({
        tempId: `ITEM-${Date.now()}-1`,
        productId: firstProd.id,
        productName: firstProd.name,
        unitPrice: firstProd.price,
        description: firstProd.description || firstProd.specification || '',
        quantity: 1,
        subtotal: firstProd.price * 1,
      });
    }

    setFormData({
      id: nextId,
      customerId: targetCustomerId,
      salesPerson: '張偉成',
      salesPhone: '0912-345-678',
      address: targetAddress,
      paymentTerms: targetPaymentTerms,
      quotationDate: new Date().toISOString().split('T')[0],
      validDays: 30,
      taxIncluded: true,
      notes: '報價包含標準原廠保固與測試調校，確認簽核後約 3-7 個工作天內出貨。',
      status: 'draft',
      items: initialItems,
    });

    setErrors({});
    setTouched(false);
    setIsEditing(false);
    setShowModal(true);
  };

  // 開啟編輯
  const handleOpenEdit = (quote: Quotation) => {
    setFormData({
      id: quote.id,
      customerId: quote.customerId,
      salesPerson: quote.salesPerson,
      salesPhone: quote.salesPhone,
      address: quote.address,
      paymentTerms: quote.paymentTerms || '先付款後出貨',
      quotationDate: quote.quotationDate,
      validDays: quote.validDays,
      taxIncluded: quote.taxIncluded,
      notes: quote.notes || '',
      status: quote.status,
      items: quote.items.map((i) => ({
        tempId: i.id || `ITEM-${Math.random()}`,
        productId: i.productId,
        productName: i.productName,
        unitPrice: i.unitPrice,
        description: i.description,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
    });

    setErrors({});
    setTouched(false);
    setIsEditing(true);
    setShowModal(true);
  };

  // 當客戶下拉改變時，自動帶入該客戶地址與付款條件
  const handleCustomerChange = (customerId: string) => {
    const selectedCust = customers.find((c) => c.id === customerId);
    setFormData((prev) => ({
      ...prev,
      customerId,
      address: selectedCust ? selectedCust.address : prev.address,
      paymentTerms: selectedCust?.paymentTerms ? selectedCust.paymentTerms : prev.paymentTerms,
    }));
  };

  // 新增報價項目列
  const handleAddItemRow = () => {
    const newTempId = `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const defaultProduct = products.length > 0 ? products[0] : null;

    const newItem: ItemRow = {
      tempId: newTempId,
      productId: defaultProduct ? defaultProduct.id : '',
      productName: defaultProduct ? defaultProduct.name : '',
      unitPrice: defaultProduct ? defaultProduct.price : 0,
      description: defaultProduct ? defaultProduct.description || defaultProduct.specification || '' : '',
      quantity: 1,
      subtotal: defaultProduct ? defaultProduct.price : 0,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  // 刪除報價項目列
  const handleRemoveItemRow = (tempId: string) => {
    if (formData.items.length <= 1) {
      alert('報價單至少必須保留一筆產品項目！');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.tempId !== tempId),
    }));
  };

  // 當報價項目的產品下拉改變時，自動帶出單價與說明
  const handleItemProductChange = (tempId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.tempId === tempId) {
          const unitPrice = product ? product.price : 0;
          const description = product ? product.description || product.specification || '' : '';
          const productName = product ? product.name : '';
          return {
            ...item,
            productId,
            productName,
            unitPrice,
            description,
            subtotal: unitPrice * item.quantity,
          };
        }
        return item;
      }),
    }));
  };

  // 修改單價
  const handleItemPriceChange = (tempId: string, priceVal: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.tempId === tempId) {
          const unitPrice = Math.max(0, priceVal);
          return {
            ...item,
            unitPrice,
            subtotal: unitPrice * item.quantity,
          };
        }
        return item;
      }),
    }));
  };

  // 修改數量
  const handleItemQuantityChange = (tempId: string, qtyVal: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.tempId === tempId) {
          const quantity = Math.max(1, qtyVal);
          return {
            ...item,
            quantity,
            subtotal: item.unitPrice * quantity,
          };
        }
        return item;
      }),
    }));
  };

  // 修改項目說明
  const handleItemDescChange = (tempId: string, descVal: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.tempId === tempId) {
          return { ...item, description: descVal };
        }
        return item;
      }),
    }));
  };

  // 儲存報價單
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const formErrors = validateForm(formData);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    const matchedCustomer = customers.find((c) => c.id === formData.customerId);

    const itemsToSave: QuotationItem[] = formData.items.map((row, index) => ({
      id: `ITEM-${index + 1}`,
      productId: row.productId,
      productName: row.productName,
      unitPrice: row.unitPrice,
      description: row.description,
      quantity: row.quantity,
      subtotal: row.subtotal,
    }));

    const quotationToSave: Quotation = {
      id: formData.id,
      customerId: formData.customerId,
      customerName: matchedCustomer?.companyName || '未知客戶',
      customerContact: matchedCustomer ? `${matchedCustomer.contactPerson} (${matchedCustomer.jobTitle || '聯絡人'})` : undefined,
      salesPerson: formData.salesPerson.trim(),
      salesPhone: formData.salesPhone.trim(),
      address: formData.address.trim(),
      paymentTerms: formData.paymentTerms.trim() || undefined,
      quotationDate: formData.quotationDate,
      validDays: Number(formData.validDays) || 30,
      items: itemsToSave,
      totalAmount: calculatedAmounts.totalAmount,
      taxIncluded: formData.taxIncluded,
      taxAmount: calculatedAmounts.taxAmount,
      grandTotal: calculatedAmounts.grandTotal,
      notes: formData.notes.trim() || undefined,
      status: formData.status,
      createdAt: isEditing
        ? quotations.find((q) => q.id === formData.id)?.createdAt || new Date().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    };

    onSaveQuotation(quotationToSave);
    setShowModal(false);
  };

  const handleDelete = (quote: Quotation) => {
    if (window.confirm(`確定要刪除報價單「${quote.id}（${quote.customerName}）」嗎？此動作無法復原。`)) {
      onDeleteQuotation(quote.id);
      if (detailQuotation?.id === quote.id) {
        setDetailQuotation(null);
      }
    }
  };

  // 狀態標籤渲染 helper
  const renderStatusBadge = (status: Quotation['status']) => {
    switch (status) {
      case 'draft':
        return <span className="badge bg-secondary">草稿</span>;
      case 'sent':
        return <span className="badge bg-primary">已送出</span>;
      case 'confirmed':
        return <span className="badge bg-success">客戶已確認</span>;
      case 'rejected':
        return <span className="badge bg-danger">已作廢</span>;
      default:
        return <span className="badge bg-light text-dark">未知</span>;
    }
  };

  return (
    <div className="container-fluid py-4" id="section-quotation-management">
      {/* 標題與新增按鈕 */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center text-primary" id="quotation-mgmt-title">
            <i className="fa-solid fa-receipt me-2"></i>
            報價單管理
          </h2>
          <p className="text-muted small mb-0">建立與查詢企業客戶報價單，支援多產品動態項次、單價自動連動與自動總計。</p>
        </div>
        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center shadow-sm"
          onClick={() => handleOpenCreate()}
          id="btn-add-quotation"
        >
          <i className="fa-solid fa-plus me-2"></i>
          開立新報價單
        </button>
      </div>

      {/* 搜尋與狀態篩選列 */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* 關鍵字搜尋 */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="搜尋單號、客戶、業務員、品名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="input-search-quotations"
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm('')}
                    title="清空搜尋"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </div>

            {/* 狀態下拉篩選 */}
            <div className="col-12 col-md-6 col-lg-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                id="select-status-filter"
              >
                <option value="">全部狀態 ({quotations.length})</option>
                <option value="draft">草稿</option>
                <option value="sent">已送出</option>
                <option value="confirmed">客戶已確認</option>
                <option value="rejected">已作廢</option>
              </select>
            </div>

            <div className="col-12 col-lg-5 text-lg-end text-muted small">
              目前共計 <span className="fw-bold text-dark">{filteredQuotations.length}</span> 張報價單
            </div>
          </div>
        </div>
      </div>

      {/* 報價單列表 */}
      {filteredQuotations.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <div className="text-muted mb-3">
              <i className="fa-regular fa-file-lines display-4 opacity-50"></i>
            </div>
            <h5 className="text-secondary fw-semibold">尚無符合條件的報價單</h5>
            <p className="text-muted small mb-3">您可以嘗試更換搜尋條件，或立即建立第一張報價單。</p>
            <button className="btn btn-outline-primary btn-sm" onClick={() => handleOpenCreate()}>
              <i className="fa-solid fa-plus me-1"></i>
              立即開立報價單
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" id="table-quotations">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ width: '150px' }}>報價單號</th>
                  <th scope="col">客戶名稱</th>
                  <th scope="col">報價人員 / 電話</th>
                  <th scope="col" className="d-none d-xl-table-cell">報價 / 送貨住址</th>
                  <th scope="col" className="d-none d-lg-table-cell">報價日期</th>
                  <th scope="col" className="text-center">品項數</th>
                  <th scope="col" className="text-end">報價總計 (含稅)</th>
                  <th scope="col" className="text-center">狀態</th>
                  <th scope="col" className="text-end" style={{ width: '200px' }}>操作功能</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((quote) => (
                  <tr key={quote.id} id={`quotation-row-${quote.id}`}>
                    <td>
                      <span className="badge bg-light text-primary border font-monospace px-2 py-1 fw-bold">
                        {quote.id}
                      </span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{quote.customerName}</div>
                      {quote.customerContact && (
                        <div className="text-muted small">{quote.customerContact}</div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className="fa-solid fa-user-tie text-muted me-2"></i>
                        <div>
                          <span className="fw-semibold text-dark">{quote.salesPerson}</span>
                          <a
                            href={`tel:${quote.salesPhone}`}
                            className="text-decoration-none text-muted small d-block"
                          >
                            <i className="fa-solid fa-phone me-1 text-muted small"></i>
                            {quote.salesPhone}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="d-none d-xl-table-cell">
                      <div
                        className="text-muted small text-truncate"
                        style={{ maxWidth: '240px' }}
                        title={quote.address}
                      >
                        <i className="fa-solid fa-location-dot text-danger me-1 small"></i>
                        {quote.address}
                      </div>
                    </td>
                    <td className="d-none d-lg-table-cell">
                      <span className="text-secondary small">
                        <i className="fa-regular fa-calendar me-1"></i>
                        {quote.quotationDate}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-secondary border">
                        {quote.items.length} 項
                      </span>
                    </td>
                    <td className="text-end font-monospace fw-bold text-primary fs-6">
                      {formatCurrency(quote.grandTotal)}
                    </td>
                    <td className="text-center">{renderStatusBadge(quote.status)}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          title="查看詳細明細"
                          onClick={() => setDetailQuotation(quote)}
                          id={`btn-detail-quote-${quote.id}`}
                        >
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-info"
                          title="正式單據預覽與列印"
                          onClick={() => setPrintQuotation(quote)}
                          id={`btn-print-quote-${quote.id}`}
                        >
                          <i className="fa-solid fa-print"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="編輯報價單"
                          onClick={() => handleOpenEdit(quote)}
                          id={`btn-edit-quote-${quote.id}`}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="刪除報價單"
                          onClick={() => handleDelete(quote)}
                          id={`btn-delete-quote-${quote.id}`}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 新增 / 編輯 報價單 Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', overflowY: 'auto' }}
          role="dialog"
          aria-modal="true"
          id="modal-quotation-form"
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable my-2 my-md-4"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
          >
            <div
              className="modal-content border-0 shadow-lg"
              style={{ maxHeight: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column' }}
            >
              <div className="modal-header bg-primary text-white flex-shrink-0">
                <h5 className="modal-title fw-bold">
                  <i className={`fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-plus'} me-2`}></i>
                  {isEditing ? `編輯報價單（${formData.id}）` : '開立新報價單'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              <form
                onSubmit={handleSubmit}
                noValidate
                className={`d-flex flex-column flex-grow-1 overflow-hidden ${touched ? 'was-validated' : ''}`}
                id="form-quotation"
                style={{ minHeight: 0 }}
              >
                <div className="modal-body p-3 p-md-4 overflow-y-auto flex-grow-1" style={{ minHeight: 0 }}>
                  {/* 欄位錯誤提示區 */}
                  {touched && Object.keys(errors).length > 0 && (
                    <div className="alert alert-danger py-2 px-3 small mb-3">
                      <div className="fw-bold mb-1">
                        <i className="fa-solid fa-triangle-exclamation me-1"></i>
                        表單未完成填寫，請檢查以下項目：
                      </div>
                      <ul className="mb-0 ps-3">
                        {Object.values(errors).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="row g-3 mb-4">
                    {/* 報價單號 */}
                    <div className="col-12 col-md-3">
                      <label htmlFor="quotation-id" className="form-label fw-semibold small text-muted">
                        報價單號 <span className="badge bg-secondary ms-1">自動編號</span>
                      </label>
                      <input
                        type="text"
                        className="form-control font-monospace bg-light"
                        id="quotation-id"
                        name="id"
                        value={formData.id}
                        readOnly
                      />
                    </div>

                    {/* 客戶名稱* (下拉選單來自客戶管理) */}
                    <div className="col-12 col-md-5">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label htmlFor="quotation-customerId" className="form-label fw-semibold small mb-0">
                          客戶名稱 <span className="text-danger">*</span>
                        </label>
                        <small className="text-muted">自動帶入住址與付款條件</small>
                      </div>
                      <select
                        className={`form-select ${touched && errors.customerId ? 'is-invalid' : ''}`}
                        id="quotation-customerId"
                        value={formData.customerId}
                        onChange={(e) => handleCustomerChange(e.target.value)}
                        required
                      >
                        <option value="">請選擇客戶...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.companyName} ({c.id}) - {c.contactPerson}
                          </option>
                        ))}
                      </select>
                      <div className="invalid-feedback">{errors.customerId || '請選擇客戶'}</div>
                    </div>

                    {/* 報價日期 */}
                    <div className="col-12 col-md-2">
                      <label htmlFor="quotation-date" className="form-label fw-semibold small">
                        報價日期
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="quotation-date"
                        value={formData.quotationDate}
                        onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                      />
                    </div>

                    {/* 報價狀態 */}
                    <div className="col-12 col-md-2">
                      <label htmlFor="quotation-status" className="form-label fw-semibold small">
                        單據狀態
                      </label>
                      <select
                        className="form-select"
                        id="quotation-status"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as FormState['status'],
                          })
                        }
                      >
                        <option value="draft">草稿</option>
                        <option value="sent">已送出</option>
                        <option value="confirmed">客戶已確認</option>
                        <option value="rejected">已作廢</option>
                      </select>
                    </div>

                    {/* 報價人員名稱* */}
                    <div className="col-12 col-md-3">
                      <label htmlFor="quotation-salesPerson" className="form-label fw-semibold small">
                        報價人員名稱 <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <i className="fa-solid fa-user-tie text-muted"></i>
                        </span>
                        <input
                          type="text"
                          className={`form-control ${touched && errors.salesPerson ? 'is-invalid' : ''}`}
                          id="quotation-salesPerson"
                          placeholder="例如：張偉成"
                          value={formData.salesPerson}
                          onChange={(e) => setFormData({ ...formData, salesPerson: e.target.value })}
                          required
                        />
                        <div className="invalid-feedback">{errors.salesPerson || '請輸入報價人員'}</div>
                      </div>
                    </div>

                    {/* 連絡電話* */}
                    <div className="col-12 col-md-3">
                      <label htmlFor="quotation-salesPhone" className="form-label fw-semibold small">
                        連絡電話 <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <i className="fa-solid fa-phone text-muted"></i>
                        </span>
                        <input
                          type="tel"
                          className={`form-control ${touched && errors.salesPhone ? 'is-invalid' : ''}`}
                          id="quotation-salesPhone"
                          placeholder="例如：0912-345-678 或 02-12345678"
                          value={formData.salesPhone}
                          onChange={(e) => setFormData({ ...formData, salesPhone: e.target.value })}
                          required
                        />
                        <div className="invalid-feedback">{errors.salesPhone || '請輸入有效連絡電話'}</div>
                      </div>
                    </div>

                    {/* 付款方式/條件 (新增先付款後出貨) */}
                    <div className="col-12 col-md-3">
                      <label htmlFor="quotation-paymentTerms" className="form-label fw-semibold small">
                        付款方式 / 條件
                      </label>
                      <select
                        className="form-select"
                        id="quotation-paymentTerms"
                        value={formData.paymentTerms}
                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      >
                        <option value="先付款後出貨">先付款後出貨 (Advance Payment)</option>
                        <option value="月結 30 天">月結 30 天 (Net 30)</option>
                        <option value="月結 60 天">月結 60 天 (Net 60)</option>
                        <option value="電匯預付享 2% 現金折扣">電匯預付享 2% 現金折扣</option>
                        <option value="出貨前付清">出貨前付清 (T/T in Advance)</option>
                        <option value="貨到付款">貨到付款 (COD)</option>
                      </select>
                    </div>

                    {/* 有效天數 */}
                    <div className="col-12 col-md-3">
                      <label htmlFor="quotation-validDays" className="form-label fw-semibold small">
                        報價有效天數
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          className="form-control"
                          id="quotation-validDays"
                          value={formData.validDays}
                          onChange={(e) =>
                            setFormData({ ...formData, validDays: parseInt(e.target.value, 10) || 30 })
                          }
                        />
                        <span className="input-group-text">天</span>
                      </div>
                    </div>

                    {/* 報價 / 送貨住址* */}
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label htmlFor="quotation-address" className="form-label fw-semibold small mb-0">
                          報價 / 送貨住址 <span className="text-danger">*</span>
                        </label>
                        {formData.customerId && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-decoration-none p-0"
                            onClick={() => {
                              const c = customers.find((cust) => cust.id === formData.customerId);
                              if (c) {
                                setFormData((prev) => ({ ...prev, address: c.address }));
                              }
                            }}
                          >
                            <i className="fa-solid fa-arrows-rotate me-1"></i>重新帶入客戶登記地址
                          </button>
                        )}
                      </div>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <i className="fa-solid fa-location-dot text-danger"></i>
                        </span>
                        <input
                          type="text"
                          className={`form-control ${touched && errors.address ? 'is-invalid' : ''}`}
                          id="quotation-address"
                          placeholder="請輸入報價收件或送貨地址"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          required
                        />
                        <div className="invalid-feedback">{errors.address || '請輸入送貨或報價住址'}</div>
                      </div>
                    </div>
                  </div>

                  {/* 報價動態多筆項目區塊 */}
                  <div className="card border mb-3">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                      <span className="fw-bold text-dark">
                        <i className="fa-solid fa-list-check me-2 text-primary"></i>
                        報價項目清單（動態新增多品項）
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center"
                        onClick={handleAddItemRow}
                        id="btn-add-item-row"
                      >
                        <i className="fa-solid fa-plus me-1"></i>
                        新增項目列
                      </button>
                    </div>

                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table table-bordered table-sm align-middle mb-0">
                          <thead className="table-light text-center small">
                            <tr>
                              <th style={{ width: '40px' }}>#</th>
                              <th style={{ minWidth: '220px' }}>產品*（下拉連動售價與說明）</th>
                              <th style={{ minWidth: '180px' }}>項目說明</th>
                              <th style={{ width: '130px' }}>單價 (NT$)</th>
                              <th style={{ width: '100px' }}>數量</th>
                              <th style={{ width: '130px' }}>複價 (自動計算)</th>
                              <th style={{ width: '60px' }}>刪除</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.items.map((row, index) => (
                              <tr key={row.tempId}>
                                <td className="text-center font-monospace text-muted small">{index + 1}</td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={row.productId}
                                    onChange={(e) => handleItemProductChange(row.tempId, e.target.value)}
                                    required
                                  >
                                    <option value="">選擇產品...</option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({p.id}) - 售價 {formatCurrency(p.price)}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="產品說明或規格微調"
                                    value={row.description}
                                    onChange={(e) => handleItemDescChange(row.tempId, e.target.value)}
                                  />
                                </td>
                                <td>
                                  <div className="input-group input-group-sm">
                                    <span className="input-group-text">$</span>
                                    <input
                                      type="number"
                                      min="0"
                                      className="form-control text-end font-monospace"
                                      value={row.unitPrice}
                                      onChange={(e) =>
                                        handleItemPriceChange(row.tempId, parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </div>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min="1"
                                    className="form-control form-control-sm text-center font-monospace"
                                    value={row.quantity}
                                    onChange={(e) =>
                                      handleItemQuantityChange(row.tempId, parseInt(e.target.value, 10) || 1)
                                    }
                                  />
                                </td>
                                <td className="text-end font-monospace fw-bold text-dark">
                                  {formatCurrency(row.subtotal)}
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm p-1"
                                    title="刪除此項目"
                                    onClick={() => handleRemoveItemRow(row.tempId)}
                                    disabled={formData.items.length <= 1}
                                  >
                                    <i className="fa-solid fa-trash-can"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* 金額統計與稅額切換 */}
                  <div className="row g-3 justify-content-between align-items-center">
                    <div className="col-12 col-md-6">
                      <div className="form-check form-switch mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="taxSwitch"
                          checked={formData.taxIncluded}
                          onChange={(e) => setFormData({ ...formData, taxIncluded: e.target.checked })}
                        />
                        <label className="form-check-label fw-semibold small" htmlFor="taxSwitch">
                          外加 5% 營業稅 (VAT)
                        </label>
                      </div>

                      <div className="mb-2">
                        <label htmlFor="quotation-notes" className="form-label fw-semibold small">
                          報價約定條款 / 備註
                        </label>
                        <textarea
                          className="form-control"
                          id="quotation-notes"
                          rows={2}
                          placeholder="例如付款方式、保固服務、交期說明..."
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        ></textarea>
                      </div>
                    </div>

                    {/* 金額計算彙總卡片 */}
                    <div className="col-12 col-md-5">
                      <div className="card bg-light border-0 shadow-sm p-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted small">項目複價總計 (未稅)：</span>
                          <span className="font-monospace fw-semibold">
                            {formatCurrency(calculatedAmounts.totalAmount)}
                          </span>
                        </div>
                        {formData.taxIncluded && (
                          <div className="d-flex justify-content-between mb-2 text-muted small">
                            <span>營業稅 (5%)：</span>
                            <span className="font-monospace">
                              {formatCurrency(calculatedAmounts.taxAmount)}
                            </span>
                          </div>
                        )}
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold fs-6 text-primary">最終總價 (Grand Total)：</span>
                          <span className="fw-bold fs-4 text-primary font-monospace">
                            {formatCurrency(calculatedAmounts.grandTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary px-4" id="btn-submit-quotation">
                    <i className="fa-solid fa-floppy-disk me-1"></i>
                    {isEditing ? '儲存變更' : '確認建立報價單'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 報價單明細檢視 Modal */}
      {detailQuotation && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
          role="dialog"
          aria-modal="true"
          id="modal-quotation-detail"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <div className="d-flex align-items-center">
                  <span className="badge bg-primary me-2 font-monospace">{detailQuotation.id}</span>
                  <h5 className="modal-title fw-bold mb-0">報價單明細檢視</h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDetailQuotation(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-12 d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom pb-3">
                    <div>
                      <h4 className="fw-bold text-dark mb-1">{detailQuotation.customerName}</h4>
                      <div className="text-muted small">
                        聯絡窗口：{detailQuotation.customerContact || '未填寫'}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="mb-1">{renderStatusBadge(detailQuotation.status)}</div>
                      <small className="text-muted">報價日期：{detailQuotation.quotationDate}</small>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded">
                      <small className="text-muted d-block">送貨 / 報價地址</small>
                      <div className="text-dark fw-semibold mt-1">
                        <i className="fa-solid fa-location-dot text-danger me-1"></i>
                        {detailQuotation.address}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded">
                      <small className="text-muted d-block">經辦業務人員與聯絡電話</small>
                      <div className="text-dark fw-semibold mt-1">
                        <i className="fa-solid fa-user-tie text-primary me-1"></i>
                        {detailQuotation.salesPerson}（{detailQuotation.salesPhone}）
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded">
                      <small className="text-muted d-block">付款方式 / 條件</small>
                      <div className="text-dark fw-semibold mt-1">
                        <i className="fa-solid fa-credit-card text-success me-1"></i>
                        {detailQuotation.paymentTerms || '先付款後出貨'}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded">
                      <small className="text-muted d-block">報價有效期限</small>
                      <div className="text-dark fw-semibold mt-1">
                        <i className="fa-regular fa-clock text-warning me-1"></i>
                        自開單起 {detailQuotation.validDays} 天內有效
                      </div>
                    </div>
                  </div>
                </div>

                {/* 項目表格 */}
                <div className="table-responsive mb-3 border rounded">
                  <table className="table table-sm table-striped align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th style={{ width: '40px' }} className="text-center">#</th>
                        <th>產品名稱</th>
                        <th>規格說明</th>
                        <th className="text-end" style={{ width: '100px' }}>單價</th>
                        <th className="text-center" style={{ width: '60px' }}>數量</th>
                        <th className="text-end" style={{ width: '120px' }}>複價</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailQuotation.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="text-center font-monospace small">{idx + 1}</td>
                          <td className="fw-semibold">{item.productName}</td>
                          <td className="text-muted small">{item.description || '-'}</td>
                          <td className="text-end font-monospace">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-center font-monospace">{item.quantity}</td>
                          <td className="text-end font-monospace fw-bold">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 總結 */}
                <div className="row justify-content-end">
                  <div className="col-12 col-md-5">
                    <div className="p-3 bg-light rounded">
                      <div className="d-flex justify-content-between mb-1 small text-muted">
                        <span>複價加總小計：</span>
                        <span>{formatCurrency(detailQuotation.totalAmount)}</span>
                      </div>
                      {detailQuotation.taxIncluded && (
                        <div className="d-flex justify-content-between mb-1 small text-muted">
                          <span>營業稅 (5%)：</span>
                          <span>{formatCurrency(detailQuotation.taxAmount)}</span>
                        </div>
                      )}
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <strong className="text-primary">總計金額：</strong>
                        <strong className="text-primary fs-5 font-monospace">
                          {formatCurrency(detailQuotation.grandTotal)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {detailQuotation.notes && (
                  <div className="mt-3 p-3 bg-white border rounded">
                    <small className="text-muted d-block fw-semibold mb-1">約定備註：</small>
                    <p className="small text-secondary mb-0">{detailQuotation.notes}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-info text-white me-auto"
                  onClick={() => {
                    const q = detailQuotation;
                    setDetailQuotation(null);
                    setPrintQuotation(q);
                  }}
                >
                  <i className="fa-solid fa-print me-1"></i>
                  列印 / 預覽正式單據
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    const q = detailQuotation;
                    setDetailQuotation(null);
                    handleOpenEdit(q);
                  }}
                >
                  <i className="fa-solid fa-pen-to-square me-1"></i>
                  編輯此報價單
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDetailQuotation(null)}
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 列印預覽彈窗 */}
      {printQuotation && (
        <QuotationPrintView
          quotation={printQuotation}
          onClose={() => setPrintQuotation(null)}
        />
      )}
    </div>
  );
};
