import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, Search as SearchIcon } from 'lucide-react';
import { storeApi } from '../../utils/api';
import { useStoreFont } from '../../utils/storeFont';
import { productImage } from '../../utils/productImage';
import useStoreTheme from '../../hooks/useStoreTheme';
import useStoreLanguage from '../../hooks/useStoreLanguage';
import SmartSearch from '../../components/shared/SmartSearch';
import { StoreBottomNav, StoreHeaderIcons, StoreBrand } from '../../components/shared/StoreNav';

// Search has its own page now instead of a bar across the top of the shop:
// phones reach it from the bottom bar, computers from the icon in the header.
// The query lives in the URL (?q=) so a search can be shared or gone back to.

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function StoreSearch() {
  const storeTheme = useStoreTheme();
  const { storeSlug } = useParams();
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [store, setStore] = useState(() => { try { return JSON.parse(localStorage.getItem('storeCache_' + storeSlug) || 'null'); } catch { return null; } });
  useStoreFont(store);
  useStoreLanguage(store);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeApi.getStore(storeSlug).then((r) => { setStore(r.data); try { localStorage.setItem('storeCache_' + storeSlug, JSON.stringify(r.data)); } catch {} }).catch(() => {});
    storeApi.getProducts(storeSlug).then((r) => setProducts(r.data?.products || r.data || [])).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [storeSlug]);

  // keep ?q= in step with what is typed
  useEffect(() => {
    const h = setTimeout(() => {
      const next = query.trim();
      if ((params.get('q') || '') !== next) setParams(next ? { q: next } : {}, { replace: true });
    }, 250);
    return () => clearTimeout(h);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const lang = (i18n.language || 'en').slice(0, 2);
  const getName = (p) => (lang === 'ar' ? p.name_ar : lang === 'fr' ? p.name_fr : null) || p.name_en || p.name || '';

  const q = norm(query).trim();
  const results = useMemo(() => {
    if (!q) return [];
    const words = q.split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const hay = norm(`${getName(p)} ${p.name || ''} ${p.sku || ''} ${p.category_name || ''} ${p.description || ''}`);
      return words.every((w) => hay.includes(w));
    });
  }, [q, products, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const pc = storeTheme.pcFor(store);
  const surf = storeTheme.surface(store);
  const currency = store?.currency || 'DZD';

  return (
    <div className={`min-h-screen pb-24 md:pb-10 ${surf.className}`} style={{ fontFamily: store?.header_font || undefined, ...surf.style }}>
      <header className="sticky top-0 z-30 shadow-md" style={{ backgroundColor: pc, color: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-5 flex items-center justify-between gap-2">
          <StoreBrand store={store} storeSlug={storeSlug} color="#ffffff" />
          <StoreHeaderIcons storeSlug={storeSlug} store={store} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-extrabold mb-4 flex items-center gap-2"><SearchIcon size={22} style={{ color: pc }} />{t('store.searchTitle', 'Search')}</h1>
        <SmartSearch value={query} onChange={setQuery} products={products} storeSlug={storeSlug}
          getName={getName} getThumb={productImage} currency={currency} size="lg" autoFocus />

        {!q ? (
          <p className="text-sm text-gray-500 mt-6 text-center">{t('store.searchHint', 'Type a product name, a reference or a category.')}</p>
        ) : loading ? (
          <div className="py-16 grid place-items-center"><div className="w-8 h-8 border-[3px] border-gray-200 rounded-full animate-spin" style={{ borderTopColor: pc }} /></div>
        ) : !results.length ? (
          <div className="py-16 text-center">
            <Package size={40} className="mx-auto text-gray-400 mb-3" />
            <p className="font-bold">{t('store.searchNone', 'No product matches “{{q}}”', { q: query.trim() })}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mt-6 mb-3">{t('store.searchCount', '{{n}} result(s)', { n: results.length })}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {results.map((p) => {
                const img = productImage(p);
                return (
                  <Link key={p.id} to={`/s/${storeSlug}/product/${p.slug || p.id}`}
                    className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gray-100 grid place-items-center overflow-hidden">
                      {img ? <img src={img} alt="" loading="lazy" className="w-full h-full object-contain" /> : <Package size={32} className="text-gray-300" />}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2">{getName(p)}</p>
                      <p className="text-sm font-extrabold mt-1" style={{ color: pc }}>{Number(p.price || 0).toLocaleString()} {currency}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
      <StoreBottomNav storeSlug={storeSlug} store={store} pc={pc} />
    </div>
  );
}
