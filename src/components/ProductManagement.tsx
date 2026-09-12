import React, { useState, useMemo, useRef } from 'react';
import { Product, Vendor } from '../types';
import { generateNextId, formatCurrency } from '../utils/storage';

interface ProductManagementProps {
  products: Product[];
  vendors: Vendor[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

interface FormState {
  id: string;
  name: string;
  cost: string;
  price: string;
  unit: string;
  imageUrl: string;
  brand: string;
  specification: string;
  description: string;
  stockQuantity: string;
  vendorId: string;
}

const emptyFormState: FormState = {
  id: '',
  name: '',
  cost: '',
  price: '',
  unit: '台',
  imageUrl: '',
  brand: '',
  specification: '',
  description: '',
  stockQuantity: '0',
  vendorId: '',
};

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  vendors,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyFormState);
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 處理上傳圖片並壓縮轉 Base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('檔案格式不符，請上傳圖片檔（JPG、PNG、WEBP 或 GIF）');
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // 若圖片尺寸過大，縮放並壓縮避免 LocalStorage 空間不足
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setFormData((prev) => ({ ...prev, imageUrl: compressed }));
        } else {
          setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setUploadError(null);
  };

  // 搜尋與篩選
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchVendor = !selectedVendorFilter || p.vendorId === selectedVendorFilter;
      if (!matchVendor) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.id.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        (p.brand && p.brand.toLowerCase().includes(term)) ||
        (p.specification && p.specification.toLowerCase().includes(term)) ||
        (p.vendorName && p.vendorName.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    });
  }, [products, searchTerm, selectedVendorFilter]);

  // 表單驗證
  const validateForm = (data: FormState) => {
    const errs: { [key: string]: string } = {};

    if (!data.name.trim()) {
      errs.name = '請輸入產品名稱（必填）';
    }

    if (data.cost === '' || isNaN(Number(data.cost)) || Number(data.cost) < 0) {
      errs.cost = '請輸入合法的成本金額（數字且不可小於 0）';
    }

    if (data.price === '' || isNaN(Number(data.price)) || Number(data.price) < 0) {
      errs.price = '請輸入合法的建議售價（數字且不可小於 0）';
    }

    if (data.stockQuantity !== '' && (isNaN(Number(data.stockQuantity)) || Number(data.stockQuantity) < 0)) {
      errs.stockQuantity = '庫存數量必須為 0 或正整數';
    }

    return errs;
  };

  // 即時計算毛利預覽
  const costNum = parseFloat(formData.cost) || 0;
  const priceNum = parseFloat(formData.price) || 0;
  const profitNum = priceNum - costNum;
  const marginPct = priceNum > 0 ? ((profitNum / priceNum) * 100).toFixed(1) : '0.0';

  // 開啟新增
  const handleOpenCreate = () => {
    const nextId = generateNextId(
      'PROD',
      products.map((p) => p.id)
    );
    setFormData({
      ...emptyFormState,
      id: nextId,
      vendorId: vendors.length > 0 ? vendors[0].id : '',
    });
    setErrors({});
    setTouched(false);
    setIsEditing(false);
    setShowModal(true);
  };

  // 開啟編輯
  const handleOpenEdit = (product: Product) => {
    setFormData({
      id: product.id,
      name: product.name,
      cost: String(product.cost),
      price: String(product.price),
      unit: product.unit || '件',
      imageUrl: product.imageUrl || '',
      brand: product.brand || '',
      specification: product.specification || '',
      description: product.description || '',
      stockQuantity: String(product.stockQuantity ?? 0),
      vendorId: product.vendorId || '',
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

  // 儲存產品
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const formErrors = validateForm(formData);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    const matchedVendor = vendors.find((v) => v.id === formData.vendorId);

    const productToSave: Product = {
      id: formData.id,
      name: formData.name.trim(),
      cost: Number(formData.cost),
      price: Number(formData.price),
      unit: formData.unit.trim() || '件',
      imageUrl: formData.imageUrl.trim() || undefined,
      brand: formData.brand.trim() || undefined,
      specification: formData.specification.trim() || undefined,
      description: formData.description.trim() || undefined,
      stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
      vendorId: formData.vendorId || undefined,
      vendorName: matchedVendor?.companyName,
      createdAt: isEditing
        ? products.find((p) => p.id === formData.id)?.createdAt || new Date().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    };

    onSaveProduct(productToSave);
    setShowModal(false);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`確定要刪除產品「${product.name} (${product.id})」嗎？此動作無法復原。`)) {
      onDeleteProduct(product.id);
      if (detailProduct?.id === product.id) {
        setDetailProduct(null);
      }
    }
  };

  return (
    <div className="container-fluid py-4" id="section-product-management">
      {/* 標題與新增按鈕 */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center text-primary" id="product-mgmt-title">
            <i className="fa-solid fa-boxes-stacked me-2"></i>
            產品管理
          </h2>
          <p className="text-muted small mb-0">管理銷售產品目錄、進貨成本、售價、庫存數量與對應供應商。</p>
        </div>
        <button
          type="button"
          className="btn btn-primary d-inline-flex align-items-center shadow-sm"
          onClick={handleOpenCreate}
          id="btn-add-product"
        >
          <i className="fa-solid fa-plus me-2"></i>
          新增產品
        </button>
      </div>

      {/* 篩選與搜尋列 */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* 搜尋關鍵字 */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="搜尋產品代碼、品名、廠牌、規格..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="input-search-products"
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

            {/* 廠商下拉篩選 */}
            <div className="col-12 col-md-6 col-lg-3">
              <select
                className="form-select"
                value={selectedVendorFilter}
                onChange={(e) => setSelectedVendorFilter(e.target.value)}
                id="select-vendor-filter"
              >
                <option value="">所有供應商 ({vendors.length})</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-lg-5 text-lg-end text-muted small">
              目前顯示 <span className="fw-bold text-dark">{filteredProducts.length}</span> 項產品
              {selectedVendorFilter && ' (已篩選供應商)'}
            </div>
          </div>
        </div>
      </div>

      {/* 產品列表 */}
      {filteredProducts.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <div className="text-muted mb-3">
              <i className="fa-solid fa-box-open display-4 opacity-50"></i>
            </div>
            <h5 className="text-secondary fw-semibold">尚無符合條件的產品</h5>
            <p className="text-muted small mb-3">您可以嘗試調整篩選條件，或點擊下方按鈕新增產品。</p>
            <button className="btn btn-outline-primary btn-sm" onClick={handleOpenCreate}>
              <i className="fa-solid fa-plus me-1"></i>
              立即新增產品
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" id="table-products">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ width: '100px' }}>產品代碼</th>
                  <th scope="col" style={{ width: '70px' }}>圖片</th>
                  <th scope="col">產品名稱 / 規格</th>
                  <th scope="col">供應商</th>
                  <th scope="col" className="text-end">成本</th>
                  <th scope="col" className="text-end">建議售價</th>
                  <th scope="col" className="text-center">庫存</th>
                  <th scope="col" className="text-end" style={{ width: '150px' }}>操作功能</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const profit = product.price - product.cost;
                  const margin = product.price > 0 ? ((profit / product.price) * 100).toFixed(0) : 0;
                  return (
                    <tr key={product.id} id={`product-row-${product.id}`}>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace px-2 py-1">
                          {product.id}
                        </span>
                      </td>
                      <td>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="rounded object-fit-cover shadow-sm"
                            style={{ width: '48px', height: '48px' }}
                            onError={(e) => {
                              // 圖片載入失敗時優雅切換為預設圖示
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            className="rounded bg-light d-flex align-items-center justify-content-center text-muted border"
                            style={{ width: '48px', height: '48px' }}
                          >
                            <i className="fa-solid fa-cube"></i>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{product.name}</div>
                        <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>
                          {product.brand && <span className="badge bg-secondary-subtle text-secondary me-1">{product.brand}</span>}
                          {product.specification || product.description || '無詳細規格說明'}
                        </div>
                      </td>
                      <td>
                        <span className="text-secondary small d-inline-flex align-items-center">
                          <i className="fa-solid fa-truck-ramp-box me-1 text-muted"></i>
                          {product.vendorName || (vendors.find((v) => v.id === product.vendorId)?.companyName) || '未指定供應商'}
                        </span>
                      </td>
                      <td className="text-end text-muted font-monospace small">
                        {formatCurrency(product.cost)}
                      </td>
                      <td className="text-end fw-bold text-primary font-monospace">
                        {formatCurrency(product.price)}
                        <span className="d-block text-success small fw-normal">
                          毛利 {margin}%
                        </span>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge rounded-pill ${
                            product.stockQuantity <= 5
                              ? 'bg-danger-subtle text-danger border border-danger-subtle'
                              : 'bg-light text-dark border'
                          }`}
                        >
                          {product.stockQuantity} {product.unit || '件'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            title="查看詳細資訊"
                            onClick={() => setDetailProduct(product)}
                            id={`btn-detail-product-${product.id}`}
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="編輯資料"
                            onClick={() => handleOpenEdit(product)}
                            id={`btn-edit-product-${product.id}`}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="刪除產品"
                            onClick={() => handleDelete(product)}
                            id={`btn-delete-product-${product.id}`}
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

      {/* 新增 / 編輯 產品 Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
          role="dialog"
          aria-modal="true"
          id="modal-product-form"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className={`fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-plus'} me-2`}></i>
                  {isEditing ? `編輯產品資料（${formData.id}）` : '新增產品項目'}
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
                id="form-product"
              >
                <div className="modal-body p-4">
                  <div className="alert alert-info py-2 px-3 small mb-3 d-flex align-items-center">
                    <i className="fa-solid fa-circle-info me-2 fs-5"></i>
                    <span>標註「*」號之項目為必填欄位。請注意成本與售價將自動參與毛利率試算。</span>
                  </div>

                  <div className="row g-3">
                    {/* 產品代碼 */}
                    <div className="col-12 col-md-4">
                      <label htmlFor="product-id" className="form-label fw-semibold small text-muted">
                        產品代碼 <span className="badge bg-secondary ms-1">系統自動編號</span>
                      </label>
                      <input
                        type="text"
                        className="form-control font-monospace bg-light"
                        id="product-id"
                        name="id"
                        value={formData.id}
                        readOnly
                      />
                    </div>

                    {/* 產品名稱* */}
                    <div className="col-12 col-md-8">
                      <label htmlFor="product-name" className="form-label fw-semibold small">
                        產品名稱 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${touched && errors.name ? 'is-invalid' : ''}`}
                        id="product-name"
                        name="name"
                        placeholder="請輸入產品品名（例如：AX3000 Wi-Fi 6 路由器）"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      <div className="invalid-feedback">{errors.name || '請輸入產品名稱'}</div>
                    </div>

                    {/* 成本* */}
                    <div className="col-12 col-md-4">
                      <label htmlFor="product-cost" className="form-label fw-semibold small">
                        成本 (NT$) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className={`form-control ${touched && errors.cost ? 'is-invalid' : ''}`}
                          id="product-cost"
                          name="cost"
                          placeholder="例如：3200"
                          value={formData.cost}
                          onChange={handleChange}
                          required
                        />
                        <div className="invalid-feedback">{errors.cost || '請輸入有效成本金額'}</div>
                      </div>
                    </div>

                    {/* 售價* */}
                    <div className="col-12 col-md-4">
                      <label htmlFor="product-price" className="form-label fw-semibold small">
                        建議售價 (NT$) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className={`form-control ${touched && errors.price ? 'is-invalid' : ''}`}
                          id="product-price"
                          name="price"
                          placeholder="例如：4800"
                          value={formData.price}
                          onChange={handleChange}
                          required
                        />
                        <div className="invalid-feedback">{errors.price || '請輸入有效售價金額'}</div>
                      </div>
                    </div>

                    {/* 即時毛利預覽卡片 */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold small text-muted">利潤即時試算</label>
                      <div
                        className={`p-2 rounded border text-center small ${
                          profitNum < 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'
                        }`}
                      >
                        <div>
                          預估毛利：<strong>{formatCurrency(profitNum)}</strong>
                        </div>
                        <div>
                          毛利率：<strong>{marginPct}%</strong>
                          {profitNum < 0 && <span className="ms-1 fw-bold">⚠️ 負毛利警示</span>}
                        </div>
                      </div>
                    </div>

                    {/* 供應商 (下拉選單來自「廠商管理」) */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="product-vendorId" className="form-label fw-semibold small">
                        供應商（廠商管理）
                      </label>
                      <select
                        className="form-select"
                        id="product-vendorId"
                        name="vendorId"
                        value={formData.vendorId}
                        onChange={handleChange}
                      >
                        <option value="">請選擇配合供應商...</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.companyName} ({v.id})
                          </option>
                        ))}
                      </select>
                      {vendors.length === 0 && (
                        <small className="text-warning">
                          尚未建立任何廠商，請至「廠商管理」新增廠商。
                        </small>
                      )}
                    </div>

                    {/* 單位 */}
                    <div className="col-6 col-md-3">
                      <label htmlFor="product-unit" className="form-label fw-semibold small">
                        單位
                      </label>
                      <input
                        type="text"
                        list="unit-options"
                        className="form-control"
                        id="product-unit"
                        name="unit"
                        placeholder="台、件、組..."
                        value={formData.unit}
                        onChange={handleChange}
                      />
                      <datalist id="unit-options">
                        <option value="台" />
                        <option value="件" />
                        <option value="組" />
                        <option value="個" />
                        <option value="套" />
                        <option value="副" />
                        <option value="張" />
                        <option value="箱" />
                        <option value="包" />
                      </datalist>
                    </div>

                    {/* 庫存數量 */}
                    <div className="col-6 col-md-3">
                      <label htmlFor="product-stockQuantity" className="form-label fw-semibold small">
                        庫存數量
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        id="product-stockQuantity"
                        name="stockQuantity"
                        value={formData.stockQuantity}
                        onChange={handleChange}
                      />
                    </div>

                    {/* 廠牌 */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="product-brand" className="form-label fw-semibold small">
                        廠牌 / 品牌
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="product-brand"
                        name="brand"
                        placeholder="例如：NetPro, ASUS, Cisco..."
                        value={formData.brand}
                        onChange={handleChange}
                      />
                    </div>

                    {/* 產品圖片上傳 */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold small d-flex justify-content-between align-items-center">
                        <span>產品圖片上傳</span>
                        <small className="text-muted">支援拖曳或點選上傳 (PNG, JPG, WEBP)</small>
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="d-none"
                        onChange={handleFileChange}
                        id="input-product-image-file"
                      />

                      {formData.imageUrl ? (
                        <div className="d-flex align-items-center p-2 border rounded bg-light">
                          <img
                            src={formData.imageUrl}
                            alt="產品預覽"
                            className="rounded object-fit-cover me-3 border shadow-sm bg-white"
                            style={{ width: '64px', height: '64px' }}
                          />
                          <div className="flex-grow-1">
                            <div className="small fw-semibold text-dark mb-1">
                              <i className="fa-solid fa-circle-check text-success me-1"></i>圖片已上傳
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary py-1 px-2"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <i className="fa-solid fa-arrow-up-from-bracket me-1"></i>更換圖片
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-1 px-2"
                                onClick={handleRemoveImage}
                              >
                                <i className="fa-solid fa-trash-can me-1"></i>移除
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`p-3 border-2 border-dashed rounded text-center cursor-pointer transition ${
                            isDragging
                              ? 'border-primary bg-primary-subtle text-primary'
                              : 'border-secondary-subtle bg-light text-muted hover-bg-light'
                          }`}
                          style={{ cursor: 'pointer', borderStyle: 'dashed' }}
                          onClick={() => fileInputRef.current?.click()}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          id="dropzone-product-image"
                        >
                          <i className="fa-solid fa-cloud-arrow-up fs-3 text-primary mb-1"></i>
                          <div className="fw-semibold text-dark small">點擊上傳 或將圖片拖曳至此</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            自動壓縮優化並儲存於本機
                          </div>
                        </div>
                      )}

                      {uploadError && (
                        <div className="text-danger small mt-1">
                          <i className="fa-solid fa-triangle-exclamation me-1"></i>
                          {uploadError}
                        </div>
                      )}
                    </div>

                    {/* 規格 */}
                    <div className="col-12">
                      <label htmlFor="product-specification" className="form-label fw-semibold small">
                        規格說明
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="product-specification"
                        name="specification"
                        placeholder="例如：27吋 3840x2160 / IPS 面板 / 99% sRGB"
                        value={formData.specification}
                        onChange={handleChange}
                      />
                    </div>

                    {/* 說明 */}
                    <div className="col-12">
                      <label htmlFor="product-description" className="form-label fw-semibold small">
                        詳細說明（此說明將於開立報價單時自動帶入項目說明）
                      </label>
                      <textarea
                        className="form-control"
                        id="product-description"
                        name="description"
                        rows={2}
                        placeholder="輸入產品特色、應用場景或保固資訊..."
                        value={formData.description}
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
                  <button type="submit" className="btn btn-primary px-4" id="btn-submit-product">
                    <i className="fa-solid fa-floppy-disk me-1"></i>
                    {isEditing ? '儲存變更' : '確定新增'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 產品明細檢視 Modal */}
      {detailProduct && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
          role="dialog"
          aria-modal="true"
          id="modal-product-detail"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <div className="d-flex align-items-center">
                  <span className="badge bg-primary me-2 font-monospace">{detailProduct.id}</span>
                  <h5 className="modal-title fw-bold mb-0">產品詳細規格</h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDetailProduct(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-4">
                  <div className="col-12 col-md-4 text-center">
                    {detailProduct.imageUrl ? (
                      <img
                        src={detailProduct.imageUrl}
                        alt={detailProduct.name}
                        className="img-fluid rounded border shadow-sm w-100"
                        style={{ maxHeight: '220px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded bg-light border d-flex flex-column align-items-center justify-content-center text-muted p-5"
                        style={{ height: '200px' }}
                      >
                        <i className="fa-solid fa-image display-4 opacity-50 mb-2"></i>
                        <span className="small">無產品圖片</span>
                      </div>
                    )}
                    <div className="mt-3">
                      <span className="badge bg-secondary-subtle text-secondary border px-3 py-1">
                        庫存量：{detailProduct.stockQuantity} {detailProduct.unit || '件'}
                      </span>
                    </div>
                  </div>

                  <div className="col-12 col-md-8">
                    <h4 className="fw-bold text-dark mb-2">{detailProduct.name}</h4>
                    {detailProduct.brand && (
                      <span className="badge bg-primary-subtle text-primary border me-2">
                        廠牌：{detailProduct.brand}
                      </span>
                    )}
                    <span className="badge bg-light text-secondary border">
                      代碼：{detailProduct.id}
                    </span>

                    <hr />

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="p-2 bg-light rounded">
                          <small className="text-muted d-block">進貨成本</small>
                          <strong className="text-secondary font-monospace">
                            {formatCurrency(detailProduct.cost)}
                          </strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 bg-light rounded">
                          <small className="text-muted d-block">建議售價</small>
                          <strong className="text-primary font-monospace fs-5">
                            {formatCurrency(detailProduct.price)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <span className="text-muted small d-block">供應商</span>
                      <strong>
                        <i className="fa-solid fa-truck-ramp-box text-primary me-1"></i>
                        {detailProduct.vendorName || (vendors.find((v) => v.id === detailProduct.vendorId)?.companyName) || '未指派'}
                      </strong>
                    </div>

                    {detailProduct.specification && (
                      <div className="mb-2">
                        <span className="text-muted small d-block">產品規格</span>
                        <p className="text-dark mb-0 bg-light p-2 rounded small font-monospace">
                          {detailProduct.specification}
                        </p>
                      </div>
                    )}

                    {detailProduct.description && (
                      <div>
                        <span className="text-muted small d-block">產品說明</span>
                        <p className="text-secondary mb-0 small">{detailProduct.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    const p = detailProduct;
                    setDetailProduct(null);
                    handleOpenEdit(p);
                  }}
                >
                  <i className="fa-solid fa-pen-to-square me-1"></i>
                  編輯此產品
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDetailProduct(null)}
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
