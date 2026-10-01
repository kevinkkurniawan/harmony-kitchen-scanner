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
        setProducts([]);
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
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/scan?q=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
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
        {/* Table View - Displayed whenever products exist */}
        {products.length > 0 && (
          <div className="table-wrapper">
            <div className="table-header-info">
              <h3 className="table-info-title">
                Hasil Pencarian: <strong>{products.length} barang ditemukan</strong>
              </h3>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '16%' }}>Barcode / Kode</th>
                    <th style={{ width: '30%' }}>Nama Barang</th>
                    <th className="text-center" style={{ width: '8%' }}>Satuan</th>
                    <th className="text-right" style={{ width: '14%' }}>Harga Eceran</th>
                    <th className="text-right" style={{ width: '10%' }}>Stok</th>
                    {showAllGrosir ? (
                      <>
                        <th className="text-right" style={{ width: '11%' }}>Grosir 1</th>
                        <th className="text-right" style={{ width: '11%' }}>Grosir 2</th>
                        <th className="text-right" style={{ width: '11%' }}>Grosir 3</th>
                      </>
                    ) : (
                      <th className="text-right" style={{ width: '22%' }}>Harga Grosir</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="table-row">
                      <td className="font-mono">
                        <div className="barcode-cell">
                          {highlightText(p.barcode, query)}
                        </div>
                      </td>
                      <td className="product-name-cell">
                        <div className="product-name-text">
                          {highlightText(p.inventoryName, query)}
                        </div>
                        {p.wholesaleCategory?.name && (
                          <div className="product-category-sub">
                            Kategori: {p.wholesaleCategory.name}
                          </div>
                        )}
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
                            {p.grosir1 > 0 ? (
                              <div>
                                <span className="font-semibold">{formatCurrency(p.grosir1)}</span>
                                {p.wholesaleCategory?.tier1_minqty ? (
                                  <div className="tier-min-qty">≥ {p.wholesaleCategory.tier1_minqty} {p.uom}</div>
                                ) : null}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="text-right grosir-cell">
                            {p.grosir2 > 0 ? (
                              <div>
                                <span className="font-semibold">{formatCurrency(p.grosir2)}</span>
                                {p.wholesaleCategory?.tier2_minqty ? (
                                  <div className="tier-min-qty">≥ {p.wholesaleCategory.tier2_minqty} {p.uom}</div>
                                ) : null}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="text-right grosir-cell font-semibold">
                            {p.grosir3 > 0 ? (
                              <div>
                                <span className="text-emerald-700 font-bold">{formatCurrency(p.grosir3)}</span>
                                {p.wholesaleCategory?.tier3_minqty ? (
                                  <div className="tier-min-qty">≥ {p.wholesaleCategory.tier3_minqty} {p.uom}</div>
                                ) : null}
                              </div>
                            ) : '-'}
                          </td>
                        </>
                      ) : (
                        <td className="text-right grosir-cell font-semibold">
                          {p.grosir3 > 0 ? (
                            <div>
                              <span className="text-emerald-700 font-bold">{formatCurrency(p.grosir3)}</span>
                              {p.wholesaleCategory?.tier3_minqty ? (
                                <div className="tier-min-qty">≥ {p.wholesaleCategory.tier3_minqty} {p.uom}</div>
                              ) : null}
                            </div>
                          ) : (
                            p.grosir1 > 0 ? formatCurrency(p.grosir1) : '-'
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <p className="loading-text">Sedang mencari data barang...</p>
          </div>
        )}

        {/* Empty Initial Idle State */}
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
                <h4>Pemindaian Cepat</h4>
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

        {/* No Results State */}
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
