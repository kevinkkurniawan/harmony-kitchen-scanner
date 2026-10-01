'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface WholesaleCategory {
  id: number;
  name: string;
  code: string;
  tier1_minqty: number;
  tier2_minqty: number;
  tier3_minqty: number;
}

interface Product {
  id: string;
  barcode: string;
  inventoryNo: string;
  inventoryName: string;
  uom: string;
  price: number;
  stock: number;
  grosir1: number;
  grosir2: number;
  grosir3: number;
  wholesalecategoryid?: number | null;
  wholesaleCategory?: WholesaleCategory | null;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllGrosir, setShowAllGrosir] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount and handle global keydown
  useEffect(() => {
    searchInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape clears input
      if (e.key === 'Escape') {
        setQuery('');
        setSelectedProduct(null);
        searchInputRef.current?.focus();
        return;
      }

      // Add keyboard listener to focus search when typing anywhere
      if (
        document.activeElement !== searchInputRef.current &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.length === 1
      ) {
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchProducts = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setProducts([]);
      setSelectedProduct(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/scan?q=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data);
        if (json.data.length === 1) {
          setSelectedProduct(json.data[0]);
        } else if (json.data.length > 1) {
          // If previous selection is still in list, keep it; otherwise select first
          setSelectedProduct((prev) => {
            if (prev) {
              const match = json.data.find((p: Product) => p.id === prev.id);
              if (match) return match;
            }
            return json.data[0];
          });
        } else {
          setSelectedProduct(null);
        }
      } else {
        setProducts([]);
        setSelectedProduct(null);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
      setSelectedProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, fetchProducts]);

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchProducts(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    setProducts([]);
    setSelectedProduct(null);
    searchInputRef.current?.focus();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="highlight">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const activeProduct = selectedProduct || (products.length > 0 ? products[0] : null);

  return (
    <div className="container">
      {/* Top Header Bar */}
      <header className="header">
        <div className="header-top">
          <div className="brand-group">
            <div className="brand-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5v14"></path>
                <path d="M8 5v14"></path>
                <path d="M12 5v14"></path>
                <path d="M17 5v14"></path>
                <path d="M21 5v14"></path>
              </svg>
            </div>
            <div>
              <h1 className="brand-title">Harmony Kitchen Scanner</h1>
              <p className="brand-subtitle">Pengecekan Harga & Stok Real-time (ERP Database)</p>
            </div>
          </div>

          <div className="status-pill">
            <span className="status-dot"></span>
            <span>Scanner Siap</span>
          </div>
        </div>

        {/* Large Search Input */}
        <div className="search-wrapper">
          <div className="search-container">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Scan barcode dengan scanner gun atau ketik nama/kode barang..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDownInput}
            />
            {query && (
              <button 
                className="clear-button" 
                onClick={handleClear}
                title="Hapus Pencarian (Esc)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          <div className="header-controls">
            <div className="keyboard-hint">
              <span>Tip: Arahkan kursor atau ketik langsung untuk memindai. Tekan <strong>Esc</strong> untuk reset.</span>
            </div>

            <label className="toggle-label">
              <input 
                type="checkbox" 
                checked={showAllGrosir} 
                onChange={(e) => setShowAllGrosir(e.target.checked)} 
              />
              <span className="toggle-switch"></span>
              <span>Tampilkan Semua Tier Grosir (1, 2, 3)</span>
            </label>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* State 1: Active Product Spotlight Hero Card */}
        {activeProduct && (
          <div className="spotlight-card">
            <div className="spotlight-header">
              <div className="spotlight-title-area">
                <span className="spotlight-badge">Produk Terpilih</span>
                <h2 className="spotlight-title">{activeProduct.inventoryName}</h2>
                <div className="spotlight-meta">
                  <div className="meta-badge barcode">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="M6 8v8M10 8v8M14 8v8M18 8v8"></path>
                    </svg>
                    <span>Barcode: <strong>{activeProduct.barcode}</strong></span>
                  </div>
                  {activeProduct.inventoryNo && activeProduct.inventoryNo !== activeProduct.barcode && (
                    <div className="meta-badge">
                      <span>Kode: <strong>{activeProduct.inventoryNo}</strong></span>
                    </div>
                  )}
                  <div className="meta-badge">
                    <span>Satuan: <strong>{activeProduct.uom}</strong></span>
                  </div>
                  {activeProduct.wholesaleCategory?.name && (
                    <div className="meta-badge wholesale">
                      <span>Kategori Grosir: <strong>{activeProduct.wholesaleCategory.name}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Badge */}
              <div className={`stock-hero-badge ${activeProduct.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                <div className="stock-hero-label">STOK TERSEDIA</div>
                <div className="stock-hero-value">
                  {formatNumber(activeProduct.stock)} <span className="stock-unit">{activeProduct.uom}</span>
                </div>
                <div className="stock-hero-status">
                  {activeProduct.stock > 0 ? '● Siap Dijual' : '● Stok Kosong'}
                </div>
              </div>
            </div>

            {/* Price Grid */}
            <div className="pricing-container">
              {/* Retail / Eceran Price */}
              <div className="price-card retail">
                <div className="price-tag">HARGA ECERAN / RETAIL</div>
                <div className="price-amount">{formatCurrency(activeProduct.price)}</div>
                <div className="price-sub">Harga per {activeProduct.uom}</div>
              </div>

              {/* Wholesale 1 */}
              <div className="price-card wholesale tier-1">
                <div className="price-tag">
                  GROSIR 1
                  {activeProduct.wholesaleCategory?.tier1_minqty ? (
                    <span className="min-qty-badge">≥ {activeProduct.wholesaleCategory.tier1_minqty} {activeProduct.uom}</span>
                  ) : null}
                </div>
                <div className="price-amount">
                  {activeProduct.grosir1 > 0 ? formatCurrency(activeProduct.grosir1) : '-'}
                </div>
                <div className="price-sub">
                  {activeProduct.grosir1 > 0 
                    ? `Hemat ${formatCurrency(Math.max(0, activeProduct.price - activeProduct.grosir1))}`
                    : 'Tidak tersedia'}
                </div>
              </div>

              {/* Wholesale 2 */}
              <div className="price-card wholesale tier-2">
                <div className="price-tag">
                  GROSIR 2
                  {activeProduct.wholesaleCategory?.tier2_minqty ? (
                    <span className="min-qty-badge">≥ {activeProduct.wholesaleCategory.tier2_minqty} {activeProduct.uom}</span>
                  ) : null}
                </div>
                <div className="price-amount">
                  {activeProduct.grosir2 > 0 ? formatCurrency(activeProduct.grosir2) : '-'}
                </div>
                <div className="price-sub">
                  {activeProduct.grosir2 > 0 
                    ? `Hemat ${formatCurrency(Math.max(0, activeProduct.price - activeProduct.grosir2))}`
                    : 'Tidak tersedia'}
                </div>
              </div>

              {/* Wholesale 3 */}
              <div className="price-card wholesale tier-3">
                <div className="price-tag">
                  GROSIR 3
                  {activeProduct.wholesaleCategory?.tier3_minqty ? (
                    <span className="min-qty-badge">≥ {activeProduct.wholesaleCategory.tier3_minqty} {activeProduct.uom}</span>
                  ) : null}
                </div>
                <div className="price-amount">
                  {activeProduct.grosir3 > 0 ? formatCurrency(activeProduct.grosir3) : '-'}
                </div>
                <div className="price-sub">
                  {activeProduct.grosir3 > 0 
                    ? `Hemat ${formatCurrency(Math.max(0, activeProduct.price - activeProduct.grosir3))}`
                    : 'Tidak tersedia'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Multiple Products List / Table View */}
        {products.length > 1 && (
          <div className="table-wrapper">
            <div className="table-header-info">
              <h3 className="table-info-title">
                Hasil Pencarian: <strong>{products.length} barang ditemukan</strong>
              </h3>
              <span className="table-info-subtitle">Klik salah satu baris untuk melihat detail produk di atas</span>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '18%' }}>Barcode / Kode</th>
                    <th style={{ width: '32%' }}>Nama Barang</th>
                    <th className="text-center" style={{ width: '10%' }}>Satuan</th>
                    <th className="text-right" style={{ width: '12%' }}>Harga Eceran</th>
                    <th className="text-right" style={{ width: '10%' }}>Stok</th>
                    {showAllGrosir ? (
                      <>
                        <th className="text-right" style={{ width: '9%' }}>Grosir 1</th>
                        <th className="text-right" style={{ width: '9%' }}>Grosir 2</th>
                        <th className="text-right" style={{ width: '9%' }}>Grosir 3</th>
                      </>
                    ) : (
                      <th className="text-right" style={{ width: '15%' }}>Grosir 3</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isSelected = activeProduct?.id === p.id;
                    return (
                      <tr 
                        key={p.id} 
                        className={`table-row ${isSelected ? 'row-selected' : ''}`}
                        onClick={() => setSelectedProduct(p)}
                      >
                        <td className="font-mono">
                          <div className="barcode-cell">
                            {highlightText(p.barcode, query)}
                          </div>
                        </td>
                        <td className="product-name-cell">
                          <span className="product-name-text">
                            {highlightText(p.inventoryName, query)}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="uom-pill">{p.uom}</span>
                        </td>
                        <td className="text-right price-cell">
                          {formatCurrency(p.price)}
                        </td>
                        <td className="text-right">
                          <span className={`stock-pill ${p.stock > 0 ? 'stock-ok' : 'stock-empty'}`}>
                            {formatNumber(p.stock)}
                          </span>
                        </td>
                        {showAllGrosir ? (
                          <>
                            <td className="text-right grosir-cell">
                              {p.grosir1 > 0 ? formatCurrency(p.grosir1) : '-'}
                            </td>
                            <td className="text-right grosir-cell">
                              {p.grosir2 > 0 ? formatCurrency(p.grosir2) : '-'}
                            </td>
                            <td className="text-right grosir-cell font-semibold">
                              {p.grosir3 > 0 ? formatCurrency(p.grosir3) : '-'}
                            </td>
                          </>
                        ) : (
                          <td className="text-right grosir-cell font-semibold">
                            {p.grosir3 > 0 ? formatCurrency(p.grosir3) : '-'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* State 3: Loading Skeleton */}
        {isLoading && (
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <p className="loading-text">Sedang mencari data barang...</p>
          </div>
        )}

        {/* State 4: Empty Initial Idle State */}
        {!query.trim() && !isLoading && (
          <div className="idle-state">
            <div className="scanner-animation">
              <div className="scanner-laser"></div>
              <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5v14"></path>
                <path d="M8 5v14"></path>
                <path d="M12 5v14"></path>
                <path d="M17 5v14"></path>
                <path d="M21 5v14"></path>
              </svg>
            </div>
            <h2 className="idle-title">Siap Memindai Barcode Produk</h2>
            <p className="idle-subtitle">
              Arahkan scanner gun ke barcode kemasan barang, atau ketik kata kunci nama barang untuk melihat harga eceran, grosir bertingkat, dan stok terkini.
            </p>

            <div className="feature-cards">
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h4>Pemindaian Otomatis</h4>
                <p>Otomatis mencocokkan kode barcode fisik tanpa perlu menekan tombol pencarian.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🏷️</div>
                <h4>Harga Grosir Bertingkat</h4>
                <p>Menampilkan ketentuan tier harga grosir 1, 2, dan 3 sesuai kategori wholesale ERP.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📦</div>
                <h4>Stok Real-Time</h4>
                <p>Data stok langsung disinkronkan dengan gudang utama Harmony Kitchen ERP.</p>
              </div>
            </div>
          </div>
        )}

        {/* State 5: No Results State */}
        {query.trim() && !isLoading && products.length === 0 && (
          <div className="no-results-card">
            <div className="no-results-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </div>
            <h3 className="no-results-title">Barang Tidak Ditemukan</h3>
            <p className="no-results-desc">
              Tidak ada produk aktif yang cocok dengan pencarian <strong>&ldquo;{query}&rdquo;</strong>.
            </p>
            <p className="no-results-subdesc">
              Periksa kembali scanner Anda atau pastikan nomor barcode / ejaan barang sudah benar.
            </p>
            <button className="reset-search-btn" onClick={handleClear}>
              Reset Pencarian
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
