'use client';

import { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  barcode: string;
  inventoryName: string;
  price: number;
  stock: number;
  grosir1: number;
  grosir2: number;
  grosir3: number;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllGrosir, setShowAllGrosir] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus search input on mount
    searchInputRef.current?.focus();
    
    // Add keyboard listener to focus search when typing anywhere
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement !== searchInputRef.current && 
        !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1
      ) {
        searchInputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!query.trim()) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/scan?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
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
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query]);

  const formatCurrency = (value: number) => {
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
      <div className="header">

        <div className="search-container">
          <svg className="search-icon" xmlns="http://www.w3.org/O/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Cari Barang (Barcode atau Nama Barang)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button 
              className="clear-button" 
              onClick={() => {
                setQuery('');
                searchInputRef.current?.focus();
              }}
              title="Clear (Eraser)"
            >
              <svg xmlns="http://www.w3.org/O/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path>
                <path d="M22 21H7"></path>
                <path d="m5 11 9 9"></path>
              </svg>
            </button>
          )}
        </div>
        
        <div className="toggle-container">
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={showAllGrosir} 
              onChange={(e) => setShowAllGrosir(e.target.checked)} 
            />
            Tampilkan Semua Harga Grosir (1, 2, 3)
          </label>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Barcode</th>
              <th>Nama Barang</th>
              <th className="text-right">Harga</th>
              <th className="text-right">Stok</th>
              {showAllGrosir ? (
                <>
                  <th className="text-right">Hrg. Grosir 1</th>
                  <th className="text-right">Hrg. Grosir 2</th>
                  <th className="text-right">Hrg. Grosir 3</th>
                </>
              ) : (
                <th className="text-right">Hrg. Grosir</th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-box" style={{ width: '80%' }}></div></td>
                  <td><div className="skeleton-box"></div></td>
                  <td><div className="skeleton-box" style={{ width: '60%', marginLeft: 'auto' }}></div></td>
                  <td><div className="skeleton-box" style={{ width: '40%', marginLeft: 'auto' }}></div></td>
                  {showAllGrosir ? (
                    <>
                      <td><div className="skeleton-box" style={{ width: '70%', marginLeft: 'auto' }}></div></td>
                      <td><div className="skeleton-box" style={{ width: '70%', marginLeft: 'auto' }}></div></td>
                      <td><div className="skeleton-box" style={{ width: '70%', marginLeft: 'auto' }}></div></td>
                    </>
                  ) : (
                    <td><div className="skeleton-box" style={{ width: '70%', marginLeft: 'auto' }}></div></td>
                  )}
                </tr>
              ))
            ) : products.length > 0 ? (
              products.map((p) => (
                <tr key={p.id}>
                  <td>{p.barcode}</td>
                  <td>{highlightText(p.inventoryName, query)}</td>
                  <td className="text-right">{formatCurrency(p.price)}</td>
                  <td className="text-right">{formatCurrency(p.stock)}</td>
                  {showAllGrosir ? (
                    <>
                      <td className="text-right">{p.grosir1 > 0 ? formatCurrency(p.grosir1) : '-'}</td>
                      <td className="text-right">{p.grosir2 > 0 ? formatCurrency(p.grosir2) : '-'}</td>
                      <td className="text-right">{p.grosir3 > 0 ? formatCurrency(p.grosir3) : '-'}</td>
                    </>
                  ) : (
                    <td className="text-right">{p.grosir3 > 0 ? formatCurrency(p.grosir3) : '-'}</td>
                  )}
                </tr>
              ))
            ) : query.trim() ? (
              <tr>
                <td colSpan={showAllGrosir ? 7 : 5}>
                  <div className="no-results">Tidak ada barang ditemukan.</div>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={showAllGrosir ? 7 : 5}>
                  <div className="no-results">Silakan scan atau ketik untuk mencari barang.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
