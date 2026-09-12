import React, { useState, useMemo } from 'react';
import { Vendor, Product } from '../types';
import { isValidEmail, isValidPhone, generateNextId } from '../utils/storage';

interface VendorManagementProps {
  vendors: Vendor[];
  products: Product[];
  onSaveVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string) => void;
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

export const VendorManagement: React.FC<VendorManagementProps> = ({
  vendors,
  products,
  onSaveVendor,
  onDeleteVendor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyFormState);
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 搜尋篩選
  const filteredVendors = useMemo(() => {
    if (!searchTerm.trim()) return vendors;
    const term = searchTerm.toLowerCase();
    return vendors.filter(
      (v) =>
        v.id.toLowerCase().includes(term) ||
        v.companyName.toLowerCase().includes(term) ||
        v.contactPerson.toLowerCase().includes(term) ||
        (v.contactPersonEnglish && v.contactPersonEnglish.toLowerCase().includes(term)) ||
        (v.englishName && v.englishName.toLowerCase().includes(term)) ||
        v.phone.includes(term) ||
        v.email.toLowerCase().includes(term) ||
        v.address.toLowerCase().includes(term)
    );
  }, [vendors, searchTerm]);

  // 廠商提供產品數統計
  const vendorProductCountMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      if (p.vendorId) {
        map.set(p.vendorId, (map.get(p.vendorId) || 0) + 1);
      }
    });
    return map;
  }, [products]);

  // 欄位驗證
  const validateForm = (data: FormState) => {
    const errs: { [key: string]: string } = {};

    if (!data.companyName.trim()) {
      errs.companyName = '請輸入廠商公司名稱（必填）';
    }

    if (!data.contactPerson.trim()) {
      errs.contactPerson = '請輸入廠商聯絡窗口姓名（必填）';
    }

    if (!data.phone.trim()) {
      errs.phone = '請輸入聯絡電話（必填）';
    } else if (!isValidPhone(data.phone)) {
      errs.phone = '電話格式不正確，請輸入如 03-5789900 或 0912-345-678';
    }

    if (!data.email.trim()) {
      errs.email = '請輸入電子郵件（必填）';
    } else if (!isValidEmail(data.email)) {
      errs.email = '電子郵件格式不正確，例如：sales@vendor.com.tw';
    }

    if (!data.address.trim()) {
      errs.address = '請輸入廠商住址（必填）';
    }

    return errs;
  };

  // 開啟新增
  const handleOpenCreate = () => {
    const nextId = generateNextId(
      'VEND',
      vendors.map((v) => v.id)
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

  // 開啟編輯
  const handleOpenEdit = (vendor: Vendor) => {
    setFormData({
      id: vendor.id,
      companyName: vendor.companyName,
      contactPerson: vendor.contactPerson,
      contactPersonEnglish: vendor.contactPersonEnglish || '',
      englishName: vendor.englishName || '',
      department: vendor.department || '',
      jobTitle: vendor.jobTitle || '',
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      paymentTerms: vendor.paymentTerms || '',
      notes: vendor.notes || '',
    });
    setErrors({});
    setTouched(false);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nextData = { ...formData, [name]: value };
    setFormData(nextData);

    if (touched) {
      setErrors(validateForm(nextData));
    }
  };

  // 儲存廠商
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const formErrors = validateForm(formData);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    const vendorToSave: Vendor = {
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
        ? vendors.find((v) => v.id === formData.id)?.createdAt || new Date().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    };

    onSaveVendor(vendorToSave);
    setShowModal(false);
  };

  // 刪除處理
  const handleDelete = (vendor: Vendor) => {
    const productCount = vendorProductCountMap.get(vendor.id) || 0;
    let message = `確定要刪除廠商「${vendor.companyName} (${vendor.id})」嗎？此動作無法復原。`;
    if (productCount > 0) {
      message = `警告：目前有 ${productCount} 項產品以此廠商為供應商！\n若刪除此廠商，相關產品將失去供應商參照。\n\n仍要確定刪除「${vendor.companyName}」嗎？`;
    }

    if (window.confirm(message)) {
      onDeleteVendor(vendor.id);
      if (detailVendor?.id === vendor.id) {
        setDetailVendor(null);
      }
    }
  };

  return (
    <div className="container-fluid py-4" id="section-vendor-management">
      {/* 標題與操作區 */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center text-primary" id="vendor-mgmt-title">
            <i className="fa-solid fa-truck-field me-2"></i>
            廠商管理
          </h2>
          <p className="text-muted small mb-0">維護產品原廠代理商、供應商資訊、進貨窗口與付款合作約定。</p>
        </div>
        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center shadow-sm"
          onClick={handleOpenCreate}
          id="btn-add-vendor"
        >
          <i className="fa-solid fa-plus me-2"></i>
          新增廠商
        </button>
      </div>

      {/* 搜尋列 */}
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
                  placeholder="輸入廠商代碼、公司名稱、窗口、電話搜尋..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="input-search-vendors"
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
              目前共計 <span className="fw-bold text-dark">{filteredVendors.length}</span> 間廠商資料
              {searchTerm && `（包含關鍵字「${searchTerm}」）`}
            </div>
          </div>
        </div>
      </div>

      {/* 廠商列表 */}
      {filteredVendors.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <div className="text-muted mb-3">
              <i className="fa-regular fa-building display-4 opacity-50"></i>
            </div>
            <h5 className="text-secondary fw-semibold">尚無符合條件的廠商資料</h5>
            <p className="text-muted small mb-3">您可以嘗試更換搜尋關鍵字，或點擊下方按鈕立即新增供應商。</p>
            <button className="btn btn-outline-primary btn-sm" onClick={handleOpenCreate}>
              <i className="fa-solid fa-plus me-1"></i>
              立即新增廠商
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" id="table-vendors">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ width: '120px' }}>廠商代碼</th>
                  <th scope="col">廠商公司名稱</th>
                  <th scope="col">聯絡窗口</th>
                  <th scope="col">電話</th>
                  <th scope="col">Email</th>
                  <th scope="col" className="text-center d-none d-lg-table-cell">供應產品數</th>
                  <th scope="col" className="text-end" style={{ width: '160px' }}>操作功能</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => {
                  const productCount = vendorProductCountMap.get(vendor.id) || 0;
                  return (
                    <tr key={vendor.id} id={`vendor-row-${vendor.id}`}>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace px-2 py-1">
                          {vendor.id}
                        </span>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{vendor.companyName}</div>
                        {vendor.englishName && (
                          <div className="text-muted small text-truncate" style={{ maxWidth: '240px' }}>
                            {vendor.englishName}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="fa-solid fa-user-tie text-muted me-2"></i>
                          <div>
                            <span className="fw-semibold text-dark">{vendor.contactPerson}</span>
                            {vendor.contactPersonEnglish && (
                              <span className="text-muted ms-1 small">({vendor.contactPersonEnglish})</span>
                            )}
                            {(vendor.jobTitle || vendor.department) && (
                              <span className="text-muted small d-block">
                                {[vendor.department, vendor.jobTitle].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <a href={`tel:${vendor.phone}`} className="text-decoration-none text-dark">
                          <i className="fa-solid fa-phone text-muted me-1 small"></i>
                          {vendor.phone}
                        </a>
                      </td>
                      <td>
                        <a href={`mailto:${vendor.email}`} className="text-decoration-none text-muted small text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                          <i className="fa-regular fa-envelope me-1"></i>
                          {vendor.email}
                        </a>
                      </td>
                      <td className="text-center d-none d-lg-table-cell">
                        <span className={`badge rounded-pill ${productCount > 0 ? 'bg-primary-subtle text-primary border' : 'bg-light text-muted border'}`}>
                          {productCount} 項產品
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            title="查看詳細資訊"
                            onClick={() => setDetailVendor(vendor)}
                            id={`btn-detail-vendor-${vendor.id}`}
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="編輯資料"
                            onClick={() => handleOpenEdit(vendor)}
                            id={`btn-edit-vendor-${vendor.id}`}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="刪除廠商"
                            onClick={() => handleDelete(vendor)}
                            id={`btn-delete-vendor-${vendor.id}`}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 新增 / 編輯 廠商 Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
          role="dialog"
          aria-modal="true"
          id="modal-vendor-form"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className={`fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-plus'} me-2`}></i>
                  {isEditing ? `編輯廠商資料（${formData.id}）` : '新增廠商資料'}
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
                id="form-vendor"
              >
                <div className="modal-body p-4">
                  <div className="alert alert-info py-2 px-3 small mb-3 d-flex align-items-center">
                    <i className="fa-solid fa-circle-info me-2 fs-5"></i>
                    <span>標註「*」號之項目為必填欄位，送出時將自動驗證格式。</span>
                  </div>

                  <div className="row g-3">
                    {/* 廠商代碼 (自動產生) */}
                    <div className="col-12 col-md-4">
                      <label htmlFor="vendor-id" className="form-label fw-semibold small text-muted">
                        廠商代碼 <span className="badge bg-secondary ms-1">系統自動編號</span>
                      </label>
                      <input
                        type="text"
                        className="form-control font-monospace bg-light"
                        id="vendor-id"
                        name="id"
                        value={formData.id}
                        readOnly
                      />
                    </div>

                    {/* 公司名稱* */}
                    <div className="col-12 col-md-8">
                      <label htmlFor="vendor-companyName" className="form-label fw-semibold small">
                        公司名稱 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${touched && errors.companyName ? 'is-invalid' : ''}`}
                        id="vendor-companyName"
                        name="companyName"
                        placeholder="請輸入廠商公司名稱"
                        value={formData.companyName}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.companyName || '請輸入公司名稱'}</div>
                    </div>

                    {/* 英文名稱 */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="vendor-englishName" className="form-label fw-semibold small">
                        英文名稱
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="vendor-englishName"
                        name="englishName"
                        placeholder="例如：Apex Optics Corp."
                        value={formData.englishName}
                        onChange={handleChange}
                      />
                    </div>

                    {/* 聯絡窗口* */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="vendor-contactPerson" className="form-label fw-semibold small">
                        聯絡窗口姓名 (中文) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${touched && errors.contactPerson ? 'is-invalid' : ''}`}
                        id="vendor-contactPerson"
                        name="contactPerson"
                        placeholder="請輸入業務或窗口姓名"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.contactPerson || '請輸入聯絡窗口'}</div>
                    </div>

                    {/* 聯絡窗口英文姓名 */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="vendor-contactPersonEnglish" className="form-label fw-semibold small">
                        連絡窗口英文姓名 (English Name)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="vendor-contactPersonEnglish"
                        name="contactPersonEnglish"
                        placeholder="例如：John Wang, Sandy Hsu"
                        value={formData.contactPersonEnglish}
                        onChange={handleChange}
                      />
                    </div>

                    {/* 部門 */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="vendor-department" className="form-label fw-semibold small">
                        部門
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="vendor-department"
                        name="department"
                        placeholder="例如：通路業務處、企業客戶組"
                        value={formData.department}
                        onChange={handleChange}
                      />
                    </div>

                    {/* 職稱 */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="vendor-jobTitle" className="form-label fw-semibold small">
                        職稱
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="vendor-jobTitle"
                        name="jobTitle"
                        placeholder="例如：業務總監、資深副理"
                        value={formData.jobTitle}
                        onChange={handleChange}
                      />
                    </div>

                    {/* 聯絡電話* */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="vendor-phone" className="form-label fw-semibold small">
                        電話 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className={`form-control ${touched && errors.phone ? 'is-invalid' : ''}`}
                        id="vendor-phone"
                        name="phone"
                        placeholder="例如：02-82265577 或 0912-345-678"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.phone || '請輸入有效聯絡電話'}</div>
                    </div>

                    {/* Email* */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="vendor-email" className="form-label fw-semibold small">
                        電子郵件 (Email) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className={`form-control ${touched && errors.email ? 'is-invalid' : ''}`}
                        id="vendor-email"
                        name="email"
                        placeholder="例如：service@vendor.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.email || '請輸入有效電子郵件'}</div>
                    </div>

                    {/* 住址* */}
                    <div className="col-12">
                      <label htmlFor="vendor-address" className="form-label fw-semibold small">
                        住址（公司登記地 / 發貨倉庫） <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${touched && errors.address ? 'is-invalid' : ''}`}
                        id="vendor-address"
                        name="address"
                        placeholder="請輸入完整公司或倉庫地址"
                        value={formData.address}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.address || '請輸入住址'}</div>
                    </div>

                    {/* 付款條件 */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="vendor-paymentTerms" className="form-label fw-semibold small">
                        付款條件
                      </label>
                      <select
                        className="form-select"
                        id="vendor-paymentTerms"
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleChange}
                      >
                        <option value="">請選擇付款條件</option>
                        <option value="先付款後出貨">先付款後出貨 (Advance Payment)</option>
                        <option value="月結 30 天 (Net 30)">月結 30 天 (Net 30)</option>
                        <option value="月結 60 天 (Net 60)">月結 60 天 (Net 60)</option>
                        <option value="電匯預付享 2% 現金折扣">電匯預付享 2% 現金折扣</option>
                        <option value="出貨前付清 (T/T in Advance)">出貨前付清 (T/T in Advance)</option>
                        <option value="貨到付款 (COD)">貨到付款 (COD)</option>
                      </select>
                    </div>

                    {/* 備註 */}
                    <div className="col-12">
                      <label htmlFor="vendor-notes" className="form-label fw-semibold small">
                        備註說明
                      </label>
                      <textarea
                        className="form-control"
                        id="vendor-notes"
                        name="notes"
                        rows={2}
                        placeholder="例如：原廠保固窗口、報修流程或配合叫貨排程"
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
                  <button type="submit" className="btn btn-primary px-4" id="btn-submit-vendor">
                    <i className="fa-solid fa-floppy-disk me-1"></i>
                    {isEditing ? '儲存變更' : '確定新增'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 廠商明細檢視 Modal */}
      {detailVendor && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
          role="dialog"
          aria-modal="true"
          id="modal-vendor-detail"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <div className="d-flex align-items-center">
                  <span className="badge bg-primary me-2 font-monospace">{detailVendor.id}</span>
                  <h5 className="modal-title fw-bold mb-0">廠商詳細資料</h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDetailVendor(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-12 border-bottom pb-3">
                    <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                      <div>
                        <h4 className="fw-bold text-dark mb-1">{detailVendor.companyName}</h4>
                        {detailVendor.englishName && (
                          <div className="text-muted small">{detailVendor.englishName}</div>
                        )}
                      </div>
                      <span className="badge bg-light text-secondary border px-3 py-2">
                        建立日期：{detailVendor.createdAt}
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
                        <strong className="text-dark">{detailVendor.contactPerson}</strong>
                        {detailVendor.contactPersonEnglish && (
                          <span className="text-muted ms-1 small">({detailVendor.contactPersonEnglish})</span>
                        )}
                        {(detailVendor.department || detailVendor.jobTitle) && (
                          <span className="text-muted ms-2 small">
                            {[detailVendor.department, detailVendor.jobTitle].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                      <div className="mb-2">
                        <span className="text-muted small d-block">電話</span>
                        <a href={`tel:${detailVendor.phone}`} className="text-decoration-none text-dark fw-semibold">
                          <i className="fa-solid fa-phone text-primary me-1 small"></i>
                          {detailVendor.phone}
                        </a>
                      </div>
                      <div>
                        <span className="text-muted small d-block">電子郵件</span>
                        <a href={`mailto:${detailVendor.email}`} className="text-decoration-none text-dark">
                          <i className="fa-regular fa-envelope text-primary me-1 small"></i>
                          {detailVendor.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3 h-100">
                      <h6 className="fw-bold text-primary mb-3">
                        <i className="fa-solid fa-handshake me-2"></i>商業條件與地址
                      </h6>
                      <div className="mb-2">
                        <span className="text-muted small d-block">付款條件</span>
                        <span className="badge bg-secondary-subtle text-secondary border">
                          {detailVendor.paymentTerms || '依一般月結條件'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted small d-block">地址</span>
                        <p className="text-dark mb-0">
                          <i className="fa-solid fa-location-dot text-danger me-1 small"></i>
                          {detailVendor.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 關聯產品 */}
                  <div className="col-12">
                    <div className="p-3 bg-white border rounded-3">
                      <h6 className="fw-bold text-dark mb-2 d-flex align-items-center justify-content-between">
                        <span>
                          <i className="fa-solid fa-boxes-stacked me-2 text-primary"></i>
                          該廠商供應之產品
                        </span>
                        <span className="badge bg-primary rounded-pill">
                          {(vendorProductCountMap.get(detailVendor.id) || 0)} 件
                        </span>
                      </h6>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {products.filter((p) => p.vendorId === detailVendor.id).length > 0 ? (
                          products
                            .filter((p) => p.vendorId === detailVendor.id)
                            .map((p) => (
                              <span key={p.id} className="badge bg-light text-dark border p-2">
                                <span className="text-muted font-monospace me-1">{p.id}</span>
                                {p.name}
                              </span>
                            ))
                        ) : (
                          <span className="text-muted small">尚無關聯產品</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {detailVendor.notes && (
                    <div className="col-12">
                      <div className="p-3 border rounded-3 bg-white">
                        <span className="text-muted small d-block fw-semibold mb-1">
                          <i className="fa-regular fa-clipboard me-1 text-muted"></i>內部備註
                        </span>
                        <p className="text-secondary mb-0 small">{detailVendor.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    const v = detailVendor;
                    setDetailVendor(null);
                    handleOpenEdit(v);
                  }}
                >
                  <i className="fa-solid fa-pen-to-square me-1"></i>
                  編輯此廠商
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDetailVendor(null)}
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
