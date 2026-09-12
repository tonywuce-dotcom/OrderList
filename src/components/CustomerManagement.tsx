import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { isValidEmail, isValidPhone, generateNextId } from '../utils/storage';

interface CustomerManagementProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onSelectCustomerForQuote?: (customerId: string) => void;
}

interface FormState {
  id: string;
  companyName: string;
  contactPerson: string;
  contactPersonEnglish: string;
  englishName: string;
  department: string;
  jobTitle: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  notes: string;
}

const emptyFormState: FormState = {
  id: '',
  companyName: '',
  contactPerson: '',
  contactPersonEnglish: '',
  englishName: '',
  department: '',
  jobTitle: '',
  phone: '',
  email: '',
  address: '',
  paymentTerms: '',
  notes: '',
};

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  onSaveCustomer,
  onDeleteCustomer,
  onSelectCustomerForQuote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyFormState);
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 搜尋過濾
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.id.toLowerCase().includes(term) ||
        c.companyName.toLowerCase().includes(term) ||
        c.contactPerson.toLowerCase().includes(term) ||
        (c.contactPersonEnglish && c.contactPersonEnglish.toLowerCase().includes(term)) ||
        (c.englishName && c.englishName.toLowerCase().includes(term)) ||
        c.phone.includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.address.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  // 表單驗證邏輯
  const validateForm = (data: FormState) => {
    const errs: { [key: string]: string } = {};

    if (!data.companyName.trim()) {
      errs.companyName = '請輸入公司名稱（必填）';
    }

    if (!data.contactPerson.trim()) {
      errs.contactPerson = '請輸入聯絡窗口姓名（必填）';
    }

    if (!data.phone.trim()) {
      errs.phone = '請輸入聯絡電話（必填）';
    } else if (!isValidPhone(data.phone)) {
      errs.phone = '電話格式不正確，請輸入如 02-12345678 或 0912-345-678';
    }

    if (!data.email.trim()) {
      errs.email = '請輸入電子郵件（必填）';
    } else if (!isValidEmail(data.email)) {
      errs.email = '電子郵件格式不正確，例如：service@example.com';
    }

    if (!data.address.trim()) {
      errs.address = '請輸入營業或送貨住址（必填）';
    }

    return errs;
  };

  // 開啟新增視窗
  const handleOpenCreate = () => {
    const nextId = generateNextId(
      'CUST',
      customers.map((c) => c.id)
    );
    setFormData({
      ...emptyFormState,
      id: nextId,
      paymentTerms: '月結 30 天',
    });
    setErrors({});
    setTouched(false);
    setIsEditing(false);
    setShowModal(true);
  };

  // 開啟編輯視窗
  const handleOpenEdit = (customer: Customer) => {
    setFormData({
      id: customer.id,
      companyName: customer.companyName,
      contactPerson: customer.contactPerson,
      contactPersonEnglish: customer.contactPersonEnglish || '',
      englishName: customer.englishName || '',
      department: customer.department || '',
      jobTitle: customer.jobTitle || '',
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      paymentTerms: customer.paymentTerms || '',
      notes: customer.notes || '',
    });
    setErrors({});
    setTouched(false);
    setIsEditing(true);
    setShowModal(true);
  };

  // 欄位輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nextData = { ...formData, [name]: value };
    setFormData(nextData);

    if (touched) {
      setErrors(validateForm(nextData));
    }
  };

  // 儲存送出
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const formErrors = validateForm(formData);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    const customerToSave: Customer = {
      id: formData.id,
      companyName: formData.companyName.trim(),
      contactPerson: formData.contactPerson.trim(),
      contactPersonEnglish: formData.contactPersonEnglish.trim() || undefined,
      englishName: formData.englishName.trim() || undefined,
      department: formData.department.trim() || undefined,
      jobTitle: formData.jobTitle.trim() || undefined,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      paymentTerms: formData.paymentTerms.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      createdAt: isEditing
        ? customers.find((c) => c.id === formData.id)?.createdAt || new Date().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    };

    onSaveCustomer(customerToSave);
    setShowModal(false);
  };

  // 刪除確認
  const handleDelete = (customer: Customer) => {
    if (window.confirm(`確定要刪除客戶「${customer.companyName} (${customer.id})」嗎？此動作無法復原。`)) {
      onDeleteCustomer(customer.id);
      if (detailCustomer?.id === customer.id) {
        setDetailCustomer(null);
      }
    }
  };

  return (
    <div className="container-fluid py-4" id="section-customer-management">
      {/* 標題與操作區 */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center text-primary" id="customer-mgmt-title">
            <i className="fa-solid fa-users me-2"></i>
            客戶管理
          </h2>
          <p className="text-muted small mb-0">管理企業客戶通訊錄、聯絡窗口、付款條件與收發地址資訊。</p>
        </div>
        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center shadow-sm"
          onClick={handleOpenCreate}
          id="btn-add-customer"
        >
          <i className="fa-solid fa-user-plus me-2"></i>
          新增客戶
        </button>
      </div>

      {/* 搜尋與篩選列 */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="輸入客戶代碼、公司名稱、窗口、電話、Email 搜尋..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="input-search-customers"
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
            <div className="col-12 col-md-6 col-lg-8 text-md-end text-muted small">
              目前共計 <span className="fw-bold text-dark">{filteredCustomers.length}</span> 筆客戶資料
              {searchTerm && `（包含關鍵字「${searchTerm}」）`}
            </div>
          </div>
        </div>
      </div>

      {/* 客戶列表 (桌面表格 / 手機卡片) */}
      {filteredCustomers.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <div className="text-muted mb-3">
              <i className="fa-regular fa-folder-open display-4 opacity-50"></i>
            </div>
            <h5 className="text-secondary fw-semibold">尚無符合條件的客戶資料</h5>
            <p className="text-muted small mb-3">您可以嘗試更換搜尋關鍵字，或點擊下方按鈕立即新增客戶。</p>
            <button className="btn btn-outline-primary btn-sm" onClick={handleOpenCreate}>
              <i className="fa-solid fa-plus me-1"></i>
              立即新增客戶
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" id="table-customers">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ width: '120px' }}>客戶代碼</th>
                  <th scope="col">公司名稱</th>
                  <th scope="col">聯絡窗口</th>
                  <th scope="col">電話</th>
                  <th scope="col">Email</th>
                  <th scope="col" className="d-none d-lg-table-cell">付款條件</th>
                  <th scope="col" className="text-end" style={{ width: '180px' }}>操作功能</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} id={`customer-row-${customer.id}`}>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace px-2 py-1">
                        {customer.id}
                      </span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{customer.companyName}</div>
                      {customer.englishName && (
                        <div className="text-muted small text-truncate" style={{ maxWidth: '240px' }}>
                          {customer.englishName}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className="fa-regular fa-user text-muted me-2"></i>
                        <div>
                          <span className="fw-semibold text-dark">{customer.contactPerson}</span>
                          {customer.contactPersonEnglish && (
                            <span className="text-muted ms-1 small">({customer.contactPersonEnglish})</span>
                          )}
                          {(customer.jobTitle || customer.department) && (
                            <span className="text-muted small d-block">
                              {[customer.department, customer.jobTitle].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <a href={`tel:${customer.phone}`} className="text-decoration-none text-dark">
                        <i className="fa-solid fa-phone text-muted me-1 small"></i>
                        {customer.phone}
                      </a>
                    </td>
                    <td>
                      <a href={`mailto:${customer.email}`} className="text-decoration-none text-muted small text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                        <i className="fa-regular fa-envelope me-1"></i>
                        {customer.email}
                      </a>
                    </td>
                    <td className="d-none d-lg-table-cell">
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {customer.paymentTerms || '未指定'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          title="查看詳細資訊"
                          onClick={() => setDetailCustomer(customer)}
                          id={`btn-detail-customer-${customer.id}`}
                        >
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          title="編輯資料"
                          onClick={() => handleOpenEdit(customer)}
                          id={`btn-edit-customer-${customer.id}`}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        {onSelectCustomerForQuote && (
                          <button
                            type="button"
                            className="btn btn-outline-success"
                            title="為此客戶建立報價單"
                            onClick={() => onSelectCustomerForQuote(customer.id)}
                            id={`btn-quote-customer-${customer.id}`}
                          >
                            <i className="fa-solid fa-receipt"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          title="刪除客戶"
                          onClick={() => handleDelete(customer)}
                          id={`btn-delete-customer-${customer.id}`}
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

      {/* 新增 / 編輯 客戶 Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
          role="dialog"
          aria-modal="true"
          id="modal-customer-form"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className={`fa-solid ${isEditing ? 'fa-user-pen' : 'fa-user-plus'} me-2`}></i>
                  {isEditing ? `編輯客戶資料（${formData.id}）` : '新增客戶資料'}
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
                className={touched ? 'was-validated' : ''}
                id="form-customer"
              >
                <div className="modal-body p-4">
                  <div className="alert alert-info py-2 px-3 small mb-3 d-flex align-items-center">
                    <i className="fa-solid fa-circle-info me-2 fs-5"></i>
                    <span>標註「*」號之項目為必填欄位，系統將即時進行格式防呆驗證。</span>
                  </div>

                  <div className="row g-3">
                    {/* 客戶代碼 (自動產生) */}
                    <div className="col-12 col-md-4">
                      <label htmlFor="customer-id" className="form-label fw-semibold small text-muted">
                        客戶代碼 <span className="badge bg-secondary ms-1">系統自動編號</span>
                      </label>
                      <input
                        type="text"
                        className="form-control font-monospace bg-light"
                        id="customer-id"
                        name="id"
                        value={formData.id}
                        readOnly
                      />
                    </div>

                    {/* 公司名稱* */}
                    <div className="col-12 col-md-8">
                      <label htmlFor="customer-companyName" className="form-label fw-semibold small">
                        公司名稱 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${touched && errors.companyName ? 'is-invalid' : ''}`}
                        id="customer-companyName"
                        name="companyName"
                        placeholder="請輸入公司完整登記名稱"
                        value={formData.companyName}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.companyName || '請輸入公司名稱'}</div>
                    </div>

                    {/* 英文名稱 */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="customer-englishName" className="form-label fw-semibold small">
                        英文名稱
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="customer-englishName"
                        name="englishName"
                        placeholder="例如：InnoTech Corp."
                        value={formData.englishName}
                        onChange={handleChange}
                      />
                    </div>

                    {/* 聯絡窗口* */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="customer-contactPerson" className="form-label fw-semibold small">
                        聯絡窗口姓名 (中文) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${touched && errors.contactPerson ? 'is-invalid' : ''}`}
                        id="customer-contactPerson"
                        name="contactPerson"
                        placeholder="請輸入主要對口窗口姓名"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.contactPerson || '請輸入聯絡窗口'}</div>
                    </div>

                    {/* 聯絡窗口英文姓名 */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="customer-contactPersonEnglish" className="form-label fw-semibold small">
                        連絡窗口英文姓名 (English Name)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="customer-contactPersonEnglish"
                        name="contactPersonEnglish"
                        placeholder="例如：Amy Lin, Kevin Chen"
                        value={formData.contactPersonEnglish}
                        onChange={handleChange}
                      />
                    </div>

                    {/* 部門 */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="customer-department" className="form-label fw-semibold small">
                        部門
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="customer-department"
                        name="department"
                        placeholder="例如：採購部、資訊課"
                        value={formData.department}
                        onChange={handleChange}
                      />
                    </div>

                    {/* 職稱 */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="customer-jobTitle" className="form-label fw-semibold small">
                        職稱
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="customer-jobTitle"
                        name="jobTitle"
                        placeholder="例如：經理、主管、採購專員"
                        value={formData.jobTitle}
                        onChange={handleChange}
                      />
                    </div>

                    {/* 聯絡電話* */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="customer-phone" className="form-label fw-semibold small">
                        電話 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className={`form-control ${touched && errors.phone ? 'is-invalid' : ''}`}
                        id="customer-phone"
                        name="phone"
                        placeholder="例如：02-12345678 或 0912-345-678"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.phone || '請輸入有效聯絡電話'}</div>
                    </div>

                    {/* Email* */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="customer-email" className="form-label fw-semibold small">
                        電子郵件 (Email) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className={`form-control ${touched && errors.email ? 'is-invalid' : ''}`}
                        id="customer-email"
                        name="email"
                        placeholder="例如：contact@company.com.tw"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.email || '請輸入有效電子郵件'}</div>
                    </div>

                    {/* 住址* */}
                    <div className="col-12">
                      <label htmlFor="customer-address" className="form-label fw-semibold small">
                        住址（通訊 / 送貨地點） <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${touched && errors.address ? 'is-invalid' : ''}`}
                        id="customer-address"
                        name="address"
                        placeholder="請輸入郵遞區號及完整地址"
                        value={formData.address}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.address || '請輸入住址'}</div>
                    </div>

                    {/* 付款條件 */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="customer-paymentTerms" className="form-label fw-semibold small">
                        付款條件
                      </label>
                      <select
                        className="form-select"
                        id="customer-paymentTerms"
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleChange}
                      >
                        <option value="">請選擇付款條件</option>
                        <option value="先付款後出貨">先付款後出貨 (Advance Payment)</option>
                        <option value="月結 30 天 (Net 30)">月結 30 天 (Net 30)</option>
                        <option value="月結 60 天 (Net 60)">月結 60 天 (Net 60)</option>
                        <option value="次月結 45 天 (Net 45)">次月結 45 天 (Net 45)</option>
                        <option value="電匯即期 (Cash On Delivery)">電匯即期 (COD)</option>
                        <option value="訂金 30%，驗收後付清餘款">訂金 30%，驗收後付清餘款</option>
                        <option value="收到發票後 15 天內匯款">收到發票後 15 天內匯款</option>
                      </select>
                    </div>

                    {/* 備註 */}
                    <div className="col-12">
                      <label htmlFor="customer-notes" className="form-label fw-semibold small">
                        備註說明
                      </label>
                      <textarea
                        className="form-control"
                        id="customer-notes"
                        name="notes"
                        rows={2}
                        placeholder="例如：特約折扣、指定交貨時間或發票開立注意事項"
                        value={formData.notes}
                        onChange={handleChange}
                      ></textarea>
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
                  <button type="submit" className="btn btn-primary px-4" id="btn-submit-customer">
                    <i className="fa-solid fa-floppy-disk me-1"></i>
                    {isEditing ? '儲存變更' : '確定新增'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 客戶明細檢視 Modal */}
      {detailCustomer && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
          role="dialog"
          aria-modal="true"
          id="modal-customer-detail"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <div className="d-flex align-items-center">
                  <span className="badge bg-primary me-2 font-monospace">{detailCustomer.id}</span>
                  <h5 className="modal-title fw-bold mb-0">客戶詳細資料</h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDetailCustomer(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-12 border-bottom pb-3">
                    <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                      <div>
                        <h4 className="fw-bold text-dark mb-1">{detailCustomer.companyName}</h4>
                        {detailCustomer.englishName && (
                          <div className="text-muted small">{detailCustomer.englishName}</div>
                        )}
                      </div>
                      <span className="badge bg-light text-secondary border px-3 py-2">
                        建立日期：{detailCustomer.createdAt}
                      </span>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3 h-100">
                      <h6 className="fw-bold text-primary mb-3">
                        <i className="fa-solid fa-address-card me-2"></i>聯絡資訊
                      </h6>
                      <div className="mb-2">
                        <span className="text-muted small d-block">聯絡窗口</span>
                        <strong className="text-dark">{detailCustomer.contactPerson}</strong>
                        {detailCustomer.contactPersonEnglish && (
                          <span className="text-muted ms-1 small">({detailCustomer.contactPersonEnglish})</span>
                        )}
                        {(detailCustomer.department || detailCustomer.jobTitle) && (
                          <span className="text-muted ms-2 small">
                            {[detailCustomer.department, detailCustomer.jobTitle].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                      <div className="mb-2">
                        <span className="text-muted small d-block">電話</span>
                        <a href={`tel:${detailCustomer.phone}`} className="text-decoration-none text-dark fw-semibold">
                          <i className="fa-solid fa-phone text-primary me-1 small"></i>
                          {detailCustomer.phone}
                        </a>
                      </div>
                      <div>
                        <span className="text-muted small d-block">電子郵件</span>
                        <a href={`mailto:${detailCustomer.email}`} className="text-decoration-none text-dark">
                          <i className="fa-regular fa-envelope text-primary me-1 small"></i>
                          {detailCustomer.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3 h-100">
                      <h6 className="fw-bold text-primary mb-3">
                        <i className="fa-solid fa-building-circle-check me-2"></i>商務條件與地址
                      </h6>
                      <div className="mb-2">
                        <span className="text-muted small d-block">付款條件</span>
                        <span className="badge bg-secondary-subtle text-secondary border">
                          {detailCustomer.paymentTerms || '依一般月結條件'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted small d-block">住址</span>
                        <p className="text-dark mb-0">
                          <i className="fa-solid fa-location-dot text-danger me-1 small"></i>
                          {detailCustomer.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {detailCustomer.notes && (
                    <div className="col-12">
                      <div className="p-3 border rounded-3 bg-white">
                        <span className="text-muted small d-block fw-semibold mb-1">
                          <i className="fa-regular fa-clipboard me-1 text-muted"></i>內部備註
                        </span>
                        <p className="text-secondary mb-0 small">{detailCustomer.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer bg-light">
                {onSelectCustomerForQuote && (
                  <button
                    type="button"
                    className="btn btn-success me-auto"
                    onClick={() => {
                      const id = detailCustomer.id;
                      setDetailCustomer(null);
                      onSelectCustomerForQuote(id);
                    }}
                  >
                    <i className="fa-solid fa-receipt me-1"></i>
                    開立報價單
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    const c = detailCustomer;
                    setDetailCustomer(null);
                    handleOpenEdit(c);
                  }}
                >
                  <i className="fa-solid fa-pen-to-square me-1"></i>
                  編輯此客戶
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDetailCustomer(null)}
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
