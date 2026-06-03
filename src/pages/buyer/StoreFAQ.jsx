import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeApi } from '../../utils/api';
import { useBuyerTheme } from '../../hooks/useStore';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function StoreFAQ() {
  const { storeSlug } = useParams();
  const { t } = useTranslation();
  const buyerTheme = useBuyerTheme();
  useEffect(() => { buyerTheme.init(); }, []); // eslint-disable-line
  const [store, setStore] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [sr, pr] = await Promise.all([
          storeApi.getStore(storeSlug),
          storeApi.getPages(storeSlug),
        ]);
        setStore(sr.data);
        const faqPages = (pr.data || []).filter(p => p.page_type === 'faq');
        setFaqs(faqPages.map(p => ({ q: p.title, a: p.content })));
      } catch {}
      setLoading(false);
    })();
  }, [storeSlug]);

  const pc = store?.primary_color || '#7C3AED';
  const isDark = buyerTheme.mode === 'dark';

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin"/></div>;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0b1020] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className="sticky top-0 z-30 shadow-md" style={{ backgroundColor: pc }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={`/s/${storeSlug}`} className="p-2 hover:bg-white/20 rounded-full text-white"><ArrowLeft size={20}/></Link>
          <div className="flex items-center gap-3">
            {store?.logo && <img src={store.logo} className="w-10 h-10 rounded-full object-cover bg-white/20 shrink-0" alt=""/>}
            <div>
              <h1 className="text-lg font-bold text-white">{t('buyer.faq', 'FAQ')}</h1>
              <p className="text-xs text-white/70">{store?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: pc + '15' }}>
            <HelpCircle size={32} style={{ color: pc }}/>
          </div>
          <h2 className="text-2xl font-bold mb-2">{t('buyer.faqTitle', 'Frequently Asked Questions')}</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('buyer.faqSubtitle', 'Find answers to common questions')}</p>
        </div>

        {faqs.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} shadow-sm`}>
            <HelpCircle size={48} className="mx-auto text-gray-300 mb-4"/>
            <p className="text-gray-500">{t('buyer.noFaqs', 'No FAQs available yet')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openIdx === i;
              return (
                <div key={i} className={`rounded-2xl shadow-sm overflow-hidden ${isDark ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-3 p-5 text-left"
                  >
                    <span className="font-semibold text-sm flex-1">{faq.q}</span>
                    {isOpen
                      ? <ChevronUp size={18} className="text-gray-400 shrink-0"/>
                      : <ChevronDown size={18} className="text-gray-400 shrink-0"/>}
                  </button>
                  {isOpen && (
                    <div className={`px-5 pb-5 pt-0 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <div className="border-t pt-4 whitespace-pre-line text-sm leading-relaxed" style={{ borderColor: isDark ? '#374151' : '#f3f4f6' }}>
                        {faq.a}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to={`/s/${storeSlug}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: pc }}>
            <ArrowLeft size={16}/> {t('buyer.backToStore', 'Back to Store')}
          </Link>
        </div>
      </div>
    </div>
  );
}
