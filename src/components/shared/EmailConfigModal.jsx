import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdminTheme } from '../../hooks/useStore';
import {
  Mail, Send, X, Save, Clock, Bell, ChevronDown, Eye, CheckCircle2, XCircle,
  Truck, Package, RotateCcw, Hourglass, PhoneOff, Check, RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import {
  WA_STATUSES, WA_STATUS_LABELS, WA_TIMING_OPTIONS, WA_VARS, WA_VAR_LABELS,
  resolveAliases, localizedToken,
} from './WhatsAppConfigModal';

// Re-use the same status meta as WhatsApp so the rows look familiar.
const STATUS_META = {
  new_order:        { color: '#3b82f6', bg: 'bg-blue-50 text-blue-600',       Icon: Bell },
  confirmed:        { color: '#10b981', bg: 'bg-emerald-50 text-emerald-600', Icon: CheckCircle2 },
  under_preparation:{ color: '#8b5cf6', bg: 'bg-purple-50 text-purple-600',   Icon: Package },
  shipped:          { color: '#f97316', bg: 'bg-orange-50 text-orange-600',   Icon: Truck },
  delivered:        { color: '#10b981', bg: 'bg-emerald-50 text-emerald-600', Icon: Check },
  cancelled:        { color: '#9ca3af', bg: 'bg-gray-100 text-gray-500',      Icon: XCircle },
  awaiting:         { color: '#9ca3af', bg: 'bg-gray-100 text-gray-500',      Icon: Hourglass },
  failed_call_1:    { color: '#ec4899', bg: 'bg-pink-50 text-pink-600',       Icon: PhoneOff },
  failed_call_2:    { color: '#a855f7', bg: 'bg-purple-50 text-purple-600',   Icon: PhoneOff },
  failed_call_3:    { color: '#ef4444', bg: 'bg-red-50 text-red-600',         Icon: PhoneOff },
  returned:         { color: '#ef4444', bg: 'bg-red-50 text-red-600',         Icon: RotateCcw },
};

// Bundled default email subjects + bodies per language.
const DEFAULT_EMAIL_SUBJECTS = {
  en: { new_order:'Order #{order_number} received', confirmed:'Order #{order_number} confirmed', under_preparation:'Order #{order_number} is being prepared', shipped:'Order #{order_number} shipped 📦', delivered:'Order #{order_number} delivered ✅', cancelled:'Order #{order_number} cancelled', awaiting:'Order #{order_number} awaiting confirmation', failed_call_1:'We tried calling you about order #{order_number}', failed_call_2:'Second call attempt for order #{order_number}', failed_call_3:'Final call attempt for order #{order_number}', returned:'Order #{order_number} returned' },
  fr: { new_order:'Commande #{order_number} reçue', confirmed:'Commande #{order_number} confirmée', under_preparation:'Commande #{order_number} en préparation', shipped:'Commande #{order_number} expédiée 📦', delivered:'Commande #{order_number} livrée ✅', cancelled:'Commande #{order_number} annulée', awaiting:'Commande #{order_number} en attente', failed_call_1:'Nous avons essayé de vous appeler — commande #{order_number}', failed_call_2:'Deuxième tentative — commande #{order_number}', failed_call_3:'Dernière tentative — commande #{order_number}', returned:'Commande #{order_number} retournée' },
  ar: { new_order:'تم استلام الطلب #{order_number}', confirmed:'تم تأكيد الطلب #{order_number}', under_preparation:'الطلب #{order_number} قيد التحضير', shipped:'تم شحن الطلب #{order_number} 📦', delivered:'تم تسليم الطلب #{order_number} ✅', cancelled:'تم إلغاء الطلب #{order_number}', awaiting:'الطلب #{order_number} بانتظار التأكيد', failed_call_1:'حاولنا الاتصال بشأن الطلب #{order_number}', failed_call_2:'محاولة اتصال ثانية — الطلب #{order_number}', failed_call_3:'محاولة اتصال أخيرة — الطلب #{order_number}', returned:'الطلب #{order_number} مرتجع' },
};
const DEFAULT_EMAIL_BODIES = {
  en: { new_order:'Hi {customer_name},\n\nThanks for your order at {store_name}!\n\nOrder: {order_number}\nTotal: {total} {currency}\nDelivery: {shipping_address}, {shipping_city} ({shipping_wilaya})\n\n{products_list}\n\nWe will confirm by phone shortly.\n\n— {store_name}', confirmed:'Hi {customer_name},\n\nGood news — your order #{order_number} from {store_name} has been confirmed.\nTotal: {total} {currency}\n\nWe\'ll prepare it and notify you again when it ships.\n\n— {store_name}', under_preparation:'Hi {customer_name},\n\nWe\'re preparing your order #{order_number} right now. You\'ll get another email once it ships.\n\n— {store_name}', shipped:'Hi {customer_name},\n\nYour order #{order_number} has been shipped via {delivery_company}.\nTracking number: {tracking_number}\n\n— {store_name}', delivered:'Hi {customer_name},\n\nYour order #{order_number} was delivered. Thank you for shopping with {store_name}!\n\nIf there\'s any issue, just reply to this email.\n\n— {store_name}', cancelled:'Hi {customer_name},\n\nYour order #{order_number} has been cancelled. If this was a mistake, please reply and we\'ll re-open it.\n\n— {store_name}', awaiting:'Hi {customer_name},\n\nWe couldn\'t reach you to confirm order #{order_number}. Please reply with the best time to call.\n\n— {store_name}', failed_call_1:'Hi {customer_name},\n\nWe tried calling you about order #{order_number} but couldn\'t reach you. Please call us back at {store_phone}.\n\n— {store_name}', failed_call_2:'Hi {customer_name},\n\nThis is our second attempt to reach you about order #{order_number}. Please respond as soon as possible — call {store_phone}.\n\n— {store_name}', failed_call_3:'Hi {customer_name},\n\nThird attempt — we still couldn\'t reach you about order #{order_number}. Reply or call {store_phone} or your order may be cancelled.\n\n— {store_name}', returned:'Hi {customer_name},\n\nYour order #{order_number} has been returned. Reply to this email if you\'d like to reorder or get a refund.\n\n— {store_name}' },
  fr: { new_order:'Bonjour {customer_name},\n\nMerci pour votre commande chez {store_name} !\n\nCommande : {order_number}\nTotal : {total} {currency}\nLivraison : {shipping_address}, {shipping_city} ({shipping_wilaya})\n\n{products_list}\n\nNous confirmerons par téléphone très bientôt.\n\n— {store_name}', confirmed:'Bonjour {customer_name},\n\nBonne nouvelle — votre commande #{order_number} chez {store_name} est confirmée.\nTotal : {total} {currency}\n\nNous la préparons et vous tiendrons informé à l\'expédition.\n\n— {store_name}', under_preparation:'Bonjour {customer_name},\n\nVotre commande #{order_number} est en cours de préparation. Vous recevrez un nouvel e-mail à l\'expédition.\n\n— {store_name}', shipped:'Bonjour {customer_name},\n\nVotre commande #{order_number} a été expédiée via {delivery_company}.\nNuméro de suivi : {tracking_number}\n\n— {store_name}', delivered:'Bonjour {customer_name},\n\nVotre commande #{order_number} a été livrée. Merci d\'avoir choisi {store_name} !\n\nEn cas de problème, répondez simplement à cet e-mail.\n\n— {store_name}', cancelled:'Bonjour {customer_name},\n\nVotre commande #{order_number} a été annulée. Si c\'est une erreur, répondez et nous la réactiverons.\n\n— {store_name}', awaiting:'Bonjour {customer_name},\n\nNous n\'avons pas pu vous joindre pour confirmer la commande #{order_number}. Indiquez-nous un horaire pour vous rappeler.\n\n— {store_name}', failed_call_1:'Bonjour {customer_name},\n\nNous avons essayé de vous appeler concernant la commande #{order_number}. Veuillez nous rappeler au {store_phone}.\n\n— {store_name}', failed_call_2:'Bonjour {customer_name},\n\nDeuxième tentative concernant la commande #{order_number}. Merci de répondre rapidement — {store_phone}.\n\n— {store_name}', failed_call_3:'Bonjour {customer_name},\n\nTroisième tentative — la commande #{order_number} risque d\'être annulée. Appelez-nous au {store_phone}.\n\n— {store_name}', returned:'Bonjour {customer_name},\n\nVotre commande #{order_number} a été retournée. Répondez à cet e-mail si vous souhaitez la repasser ou être remboursé.\n\n— {store_name}' },
  ar: { new_order:'مرحبا {customer_name}،\n\nشكراً لطلبك من {store_name}!\n\nالطلب: {order_number}\nالمبلغ: {total} {currency}\nالتوصيل: {shipping_address}, {shipping_city} ({shipping_wilaya})\n\n{products_list}\n\nسنؤكد عبر الهاتف قريباً.\n\n— {store_name}', confirmed:'مرحبا {customer_name}،\n\nأخبار سارة — تم تأكيد طلبك #{order_number} من {store_name}.\nالمبلغ: {total} {currency}\n\nسنبدأ التحضير ونعلمك عند الشحن.\n\n— {store_name}', under_preparation:'مرحبا {customer_name}،\n\nطلبك #{order_number} قيد التحضير الآن. ستستلم بريداً آخر عند الشحن.\n\n— {store_name}', shipped:'مرحبا {customer_name}،\n\nتم شحن طلبك #{order_number} عبر {delivery_company}.\nرقم التتبع: {tracking_number}\n\n— {store_name}', delivered:'مرحبا {customer_name}،\n\nتم تسليم طلبك #{order_number}. شكراً لتسوقك من {store_name}!\n\nإذا واجهت أي مشكلة، فقط رد على هذا البريد.\n\n— {store_name}', cancelled:'مرحبا {customer_name}،\n\nتم إلغاء طلبك #{order_number}. إن كان ذلك عن طريق الخطأ، فقط رد على هذا البريد.\n\n— {store_name}', awaiting:'مرحبا {customer_name}،\n\nلم نتمكن من الاتصال بك لتأكيد الطلب #{order_number}. اقترح لنا وقتاً مناسباً للاتصال.\n\n— {store_name}', failed_call_1:'مرحبا {customer_name}،\n\nحاولنا الاتصال بك بخصوص الطلب #{order_number}. يرجى معاودة الاتصال على {store_phone}.\n\n— {store_name}', failed_call_2:'مرحبا {customer_name}،\n\nهذه المحاولة الثانية بخصوص الطلب #{order_number}. الرجاء الرد في أقرب وقت — {store_phone}.\n\n— {store_name}', failed_call_3:'مرحبا {customer_name}،\n\nالمحاولة الثالثة — قد يُلغى الطلب #{order_number}. اتصل بنا على {store_phone} أو رد على هذا البريد.\n\n— {store_name}', returned:'مرحبا {customer_name}،\n\nتم إرجاع طلبك #{order_number}. رد على هذا البريد لإعادة الطلب أو طلب استرداد.\n\n— {store_name}' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Single status row — collapsed pill view + inline editor when expanded.
// Mirrors the WA modal's row but with subject + body fields instead of one body.
// ─────────────────────────────────────────────────────────────────────────────
function StatusRow({ status, lang, enabled, timing, subject, body, onToggle, onTiming, onSubject, onBody, onTest, onPreview, dk, t1, t2, t3, inp, varBtn, expanded, onExpand }) {
  const meta = STATUS_META[status] || { color: '#6b7280', bg: 'bg-gray-100 text-gray-500', Icon: Bell };
  const Icon = meta.Icon;
  const isRtl = lang === 'ar';
  const labelLocal = WA_STATUS_LABELS[status]?.[lang] || status;
  const labelEn = WA_STATUS_LABELS[status]?.en || status;
  const hasTpl = !!(body || '').trim();
  return (
    <div className={`rounded-2xl border ${dk ? 'border-gray-700 bg-gray-800/40' : 'border-gray-100 bg-white'} overflow-hidden`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} shrink-0`}><Icon size={16}/></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${t1}`} dir={isRtl ? 'rtl' : 'ltr'}>{lang === 'ar' ? `${labelLocal} ${labelEn.toUpperCase()}` : labelLocal}</span>
            {!enabled && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 uppercase">Disabled</span>}
          </div>
          <p className={`text-[11px] ${t3} truncate`}>{hasTpl ? (subject || '(no subject)') : 'No template set'}</p>
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); onPreview(); }} title="Preview" className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${dk ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Eye size={11}/>Preview</button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onTest(); }} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${dk ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Send size={11}/>Test</button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(!enabled); }} title={enabled ? 'Click to disable' : 'Click to enable'} className="w-5 h-5 rounded-full shrink-0 ring-2 ring-transparent hover:ring-gray-300 transition-all" style={{ backgroundColor: enabled ? meta.color : '#d1d5db' }}/>
        <button type="button" onClick={onExpand} className={`p-1 rounded-lg ${dk ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} aria-label="Expand">
          <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`}/>
        </button>
      </div>
      {expanded && (
        <div className={`px-4 pb-4 pt-1 border-t ${dk ? 'border-gray-700' : 'border-gray-100'} space-y-3`}>
          <div>
            <p className={`text-[10px] font-bold ${t3} uppercase mb-1.5`}>{lang === 'ar' ? 'الموضوع' : lang === 'fr' ? 'Sujet' : 'Subject'}</p>
            <input className={`w-full ${inp} border rounded-xl px-3 py-2 text-sm`} value={subject || ''} onChange={e => onSubject(e.target.value)} placeholder={lang === 'ar' ? 'موضوع البريد' : lang === 'fr' ? "Sujet de l'e-mail" : 'Email subject'} disabled={!enabled} style={{ direction: isRtl ? 'rtl' : 'ltr' }}/>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className={`text-[10px] font-bold ${t3} uppercase`}>{lang === 'ar' ? 'نص الرسالة' : lang === 'fr' ? "Corps de l'e-mail" : 'Email Body'} ({lang.toUpperCase()})</p>
              <button type="button" onClick={onPreview} className="text-[11px] text-emerald-600 font-bold hover:underline flex items-center gap-1"><Eye size={11}/>{lang === 'ar' ? 'مثال' : lang === 'fr' ? 'Exemple' : 'Example'}</button>
            </div>
            <textarea
              className={`w-full ${inp} border rounded-xl px-3 py-2.5 text-sm resize-y focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none transition-all`}
              rows={7}
              value={body || ''}
              onChange={e => onBody(e.target.value)}
              placeholder={lang === 'ar' ? 'اكتب نص البريد هنا.' : lang === 'fr' ? "Écrivez le contenu de l'e-mail ici." : 'Write the email body here.'}
              style={{ direction: isRtl ? 'rtl' : 'ltr' }}
              disabled={!enabled}
            />
            <div className="flex items-center justify-between mt-1">
              <p className={`text-[10px] ${t3}`}>{(body || '').length} characters</p>
              <label className={`flex items-center gap-1.5 text-[11px] ${t2}`}><input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-500" checked={enabled} onChange={e => onToggle(e.target.checked)}/>{lang === 'ar' ? 'مفعّل' : lang === 'fr' ? 'Activé' : 'Enabled'}</label>
            </div>
          </div>
          <div>
            <p className={`text-[10px] font-bold ${t3} uppercase mb-1.5 flex items-center gap-1`}><Clock size={11}/>{lang === 'ar' ? 'وقت الإرسال' : lang === 'fr' ? 'Envoyer après' : 'Send time after status change'}</p>
            <select className={`text-xs ${inp} rounded-lg px-3 py-2 font-medium border w-full sm:w-auto`} value={timing} onChange={e => onTiming(e.target.value)}>{WA_TIMING_OPTIONS.map(o => <option key={o.v} value={o.v}>{o[lang] || o.en}</option>)}</select>
          </div>
          <div>
            <p className={`text-[10px] font-bold ${t3} uppercase mb-1.5`}>{lang === 'ar' ? 'إدراج متغير' : lang === 'fr' ? 'Insérer une variable' : 'Insert variable'}</p>
            <div className="flex flex-wrap gap-1">
              {WA_VARS.map(v => {
                const lbl = WA_VAR_LABELS[v]?.[lang] || v;
                const tok = localizedToken(v, lang);
                return (
                  <button key={v} type="button" onClick={() => onBody((body || '') + tok)} title={tok + ' → ' + lbl} className={`px-2 py-1 border rounded-md text-[10px] font-mono transition-colors ${varBtn}`}>{lbl}</button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Email config modal
// ─────────────────────────────────────────────────────────────────────────────
export default function EmailConfigModal({ show, onClose, storeId, initialConfig, onSave }) {
  const [cfg, setCfg] = useState({});
  const [lang, setLang] = useState('fr');
  const [expanded, setExpanded] = useState(null);
  const [previewStatus, setPreviewStatus] = useState(null);
  const [savedToast, setSavedToast] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ ok: null, message: null });
  const dk = useAdminTheme(s => s.mode === 'dark');

  useEffect(() => { if (show && initialConfig) setCfg({ ...initialConfig }); if (show) setLang(initialConfig?.email_language || 'fr'); }, [show, initialConfig]);
  useEffect(() => { if (show && storeId) probeStatus(); }, [show, storeId]);

  const setV = (k, v) => setCfg(p => ({ ...p, [k]: v }));

  // ── Helpers (mirror WA modal's getters with email_* keys) ─────────────────
  const getTemplates = () => { try { return cfg.email_templates ? JSON.parse(typeof cfg.email_templates === 'string' ? cfg.email_templates : JSON.stringify(cfg.email_templates)) : {}; } catch { return {}; } };
  const getSubjects = () => { try { return cfg.email_subjects ? JSON.parse(typeof cfg.email_subjects === 'string' ? cfg.email_subjects : JSON.stringify(cfg.email_subjects)) : {}; } catch { return {}; } };
  const getBody = (st) => {
    const t = getTemplates();
    const v = t?.[lang]?.[st];
    if (typeof v === 'string' && v.length) return v;
    return (t?.fr?.[st] || t?.ar?.[st] || t?.en?.[st]
      || DEFAULT_EMAIL_BODIES[lang]?.[st]
      || DEFAULT_EMAIL_BODIES.fr?.[st] || DEFAULT_EMAIL_BODIES.ar?.[st] || DEFAULT_EMAIL_BODIES.en?.[st]
      || '');
  };
  const getSubject = (st) => {
    const s = getSubjects();
    const v = s?.[lang]?.[st];
    if (typeof v === 'string' && v.length) return v;
    return (s?.fr?.[st] || s?.ar?.[st] || s?.en?.[st]
      || DEFAULT_EMAIL_SUBJECTS[lang]?.[st]
      || DEFAULT_EMAIL_SUBJECTS.fr?.[st] || DEFAULT_EMAIL_SUBJECTS.ar?.[st] || DEFAULT_EMAIL_SUBJECTS.en?.[st]
      || '');
  };
  const setBody = (st, val) => { const t = getTemplates(); if (!t[lang]) t[lang] = {}; t[lang][st] = val; setV('email_templates', JSON.stringify(t)); };
  const setSubject = (st, val) => { const s = getSubjects(); if (!s[lang]) s[lang] = {}; s[lang][st] = val; setV('email_subjects', JSON.stringify(s)); };
  const getEnabled = (st) => { try { const e = cfg.email_enabled_statuses ? JSON.parse(typeof cfg.email_enabled_statuses === 'string' ? cfg.email_enabled_statuses : JSON.stringify(cfg.email_enabled_statuses)) : {}; return e[st] !== false; } catch { return true; } };
  const setEnabled = (st, val) => { try { const e = cfg.email_enabled_statuses ? JSON.parse(typeof cfg.email_enabled_statuses === 'string' ? cfg.email_enabled_statuses : JSON.stringify(cfg.email_enabled_statuses)) : {}; e[st] = val; setV('email_enabled_statuses', JSON.stringify(e)); } catch {} };
  const getTiming = (st) => { try { const tm = cfg.email_timing ? JSON.parse(typeof cfg.email_timing === 'string' ? cfg.email_timing : JSON.stringify(cfg.email_timing)) : {}; return tm[st] || 'immediately'; } catch { return 'immediately'; } };
  const setTiming = (st, val) => { try { const tm = cfg.email_timing ? JSON.parse(typeof cfg.email_timing === 'string' ? cfg.email_timing : JSON.stringify(cfg.email_timing)) : {}; tm[st] = val; setV('email_timing', JSON.stringify(tm)); } catch {} };

  // Render the body template with example values for the preview popup.
  const preview = (tpl) => {
    let m = resolveAliases(tpl || '');
    const now = new Date();
    m = m.replace(/\{store_name\}/g, cfg.name || cfg.store_name || 'My Store');
    m = m.replace(/\{order_number\}/g, '100254');
    m = m.replace(/\{customer_name\}/g, 'Ahmed Benali');
    m = m.replace(/\{customer_phone\}/g, '+213 555 12 34 56');
    m = m.replace(/\{total\}/g, '9,600');
    m = m.replace(/\{subtotal\}/g, '9,000');
    m = m.replace(/\{shipping_cost\}/g, '600');
    m = m.replace(/\{shipping_price\}/g, '600');
    m = m.replace(/\{discount\}/g, '0');
    m = m.replace(/\{currency\}/g, cfg.currency || 'DZD');
    m = m.replace(/\{shipping_address\}/g, '12 Rue Didouche');
    m = m.replace(/\{shipping_city\}/g, 'Alger');
    m = m.replace(/\{shipping_wilaya\}/g, 'Alger');
    m = m.replace(/\{shipping_zip\}/g, '16000');
    m = m.replace(/\{payment_method\}/g, 'COD');
    m = m.replace(/\{tracking_number\}/g, 'TR-98421');
    m = m.replace(/\{delivery_company\}/g, 'Yalidine');
    m = m.replace(/\{cart_url\}/g, 'https://store.com/cart/abc');
    m = m.replace(/\{item_count\}/g, '3');
    m = m.replace(/\{order_date\}/g, now.toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-GB'));
    m = m.replace(/\{order_time\}/g, now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    m = m.replace(/\{product_list\}/g, lang === 'ar' ? '• Whatch (Black / 40-41 / Synthetic) X 2\n• Dji (Gray / 43-44 / Mesh) X 1' : lang === 'fr' ? '• Whatch (Black / 40-41 / Synthetic) X 2\n• Dji (Gray / 43-44 / Mesh) X 1' : '• Whatch (Black / 40-41 / Synthetic) X 2\n• Dji (Gray / 43-44 / Mesh) X 1');
    m = m.replace(/\{products_list\}/g, lang === 'ar' ? '• Whatch (Black / 40-41 / Synthetic) X 2\n• Dji (Gray / 43-44 / Mesh) X 1' : lang === 'fr' ? '• Whatch (Black / 40-41 / Synthetic) X 2\n• Dji (Gray / 43-44 / Mesh) X 1' : '• Whatch (Black / 40-41 / Synthetic) X 2\n• Dji (Gray / 43-44 / Mesh) X 1');
    m = m.replace(/\{store_phone\}/g, cfg.phone || cfg.store_phone || '+213 550 00 00 00');
    m = m.replace(/\{store_email\}/g, cfg.email || cfg.store_email || 'contact@store.com');
    return m;
  };

  // ── Email service status + test ───────────────────────────────────────────
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const probeStatus = async () => {
    try {
      const { default: api } = await import('../../utils/api');
      const { data } = await api.get('/ai/email/status').catch(() => ({ data: null }));
      if (data) setEmailStatus({ ok: !!data.ok, message: data.message || (data.ok ? 'Email service ready' : 'Email service not configured') });
      else setEmailStatus({ ok: null, message: 'Could not check email service' });
    } catch { setEmailStatus({ ok: null, message: 'Could not check email service' }); }
  };
  const sendTest = async (forceStatus) => {
    if (!storeId) { alert('Save store first'); return; }
    const to = (testEmail || '').trim();
    if (!to) { alert(lang === 'ar' ? 'أدخل بريد الاختبار' : lang === 'fr' ? 'Entrez un e-mail de test' : 'Enter a test email address'); return; }
    setTestSending(true);
    try {
      const st = forceStatus || expanded || 'confirmed';
      const subject = preview(getSubject(st));
      const html = preview(getBody(st)).replace(/\n/g, '<br>');
      const { default: api } = await import('../../utils/api');
      await api.post(`/ai/email/${storeId}/send-test`, { to, subject, html, language: lang });
      alert((lang === 'ar' ? 'تم إرسال بريد الاختبار إلى ' : lang === 'fr' ? 'Test envoyé à ' : 'Test sent to ') + to);
    } catch (e) { alert('Test failed: ' + (e?.response?.data?.error || e.message || 'unknown')); }
    setTestSending(false);
  };

  const isRtl = lang === 'ar';
  const handleSaveAll = () => { if (onSave) onSave(cfg); setSavedToast(true); setTimeout(() => setSavedToast(false), 2200); };
  const handleSaveAndClose = () => { if (onSave) onSave(cfg); onClose(); };

  if (!show) return null;

  // Theme tokens
  const b = dk ? 'bg-gray-900' : 'bg-[#fafafa]';
  const card = dk ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const t1 = dk ? 'text-white' : 'text-gray-900';
  const t2 = dk ? 'text-gray-300' : 'text-gray-700';
  const t3 = dk ? 'text-gray-400' : 'text-gray-400';
  const inp = dk ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900';
  const varBtn = dk ? 'bg-gray-700 border-gray-600 text-emerald-400 hover:bg-gray-600' : 'bg-white border-gray-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300';

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className={`${b} w-full sm:rounded-3xl max-w-5xl max-h-[100vh] sm:max-h-[95vh] overflow-hidden shadow-2xl flex flex-col`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-5 py-4 border-b ${dk ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'} flex items-center justify-between gap-3 shrink-0`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0"><Mail size={18} className="text-white"/></div>
            <div className="min-w-0">
              <h2 className={`font-extrabold text-base sm:text-lg ${t1} truncate`}>Email Order Notifications</h2>
              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                <span className={`flex items-center gap-1 font-semibold ${emailStatus.ok ? 'text-emerald-600' : t3}`}><span className={`w-1.5 h-1.5 rounded-full ${emailStatus.ok ? 'bg-emerald-500' : 'bg-gray-400'}`}/>{emailStatus.ok ? 'Ready' : 'Inactive'}</span>
                <span className={t3}>·</span>
                <span className={`font-semibold ${emailStatus.ok ? 'text-emerald-600' : t3}`}>{emailStatus.message || 'Checking…'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`flex ${dk ? 'bg-gray-800' : 'bg-gray-100'} rounded-xl p-1 gap-0.5`}>
              {[{ c: 'ar', l: 'العربية' }, { c: 'fr', l: 'Français' }, { c: 'en', l: 'English' }].map(lg => (
                <button key={lg.c} onClick={() => { setLang(lg.c); setV('email_language', lg.c); }} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${lang === lg.c ? (dk ? 'bg-gray-700 text-white shadow' : 'bg-white text-gray-900 shadow') : (dk ? 'text-gray-400' : 'text-gray-500 hover:text-gray-700')}`}>{lg.l}</button>
              ))}
            </div>
            <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center ${dk ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}><X size={18}/></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Service status + quick test */}
          <div className={`rounded-2xl border ${card} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-xl ${dk ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-center`}><Mail size={16} className="text-gray-500"/></div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${t1}`}>SMTP / Email Service</p>
                <p className={`text-[11px] ${emailStatus.ok ? 'text-emerald-600 font-semibold' : t3}`}>{emailStatus.ok ? '✓ Email service is configured by the platform admin' : 'Email is configured by the platform admin (RESEND_API_KEY / SMTP).'}</p>
              </div>
              <button onClick={probeStatus} className={`p-2 rounded-lg ${dk ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} text-gray-400`} title="Re-check"><RefreshCw size={13}/></button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input className={`flex-1 ${inp} border rounded-xl px-3 py-2 text-sm font-mono`} value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com"/>
              <button onClick={() => sendTest()} disabled={testSending} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0">
                {testSending ? <RefreshCw size={12} className="animate-spin"/> : <Send size={12}/>}Send Test Email
              </button>
            </div>
            <p className={`text-[10px] ${t3} mt-2`}>Sends the currently-expanded status template (or "confirmed" by default) to the address above. Uses the same content the buyer would receive.</p>
          </div>

          {/* Templates list */}
          <div className={`rounded-2xl border ${card} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-xl ${dk ? 'bg-gray-700' : 'bg-gray-50'} flex items-center justify-center`}><Bell size={15} className="text-blue-500"/></div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${t1}`}>Email Template Settings</p>
                <p className={`text-[11px] ${t3}`}>Sent automatically when an order changes status. Subject + HTML body — variables in {'{braces}'} get substituted.</p>
              </div>
            </div>
            <div className="space-y-2">
              {WA_STATUSES.map(st => (
                <StatusRow
                  key={st}
                  status={st}
                  lang={lang}
                  enabled={getEnabled(st)}
                  timing={getTiming(st)}
                  subject={getSubject(st)}
                  body={getBody(st)}
                  onToggle={(v) => setEnabled(st, v)}
                  onTiming={(v) => setTiming(st, v)}
                  onSubject={(v) => setSubject(st, v)}
                  onBody={(v) => setBody(st, v)}
                  onTest={() => sendTest(st)}
                  onPreview={() => setPreviewStatus(st)}
                  dk={dk} t1={t1} t2={t2} t3={t3} inp={inp} varBtn={varBtn}
                  expanded={expanded === st}
                  onExpand={() => setExpanded(expanded === st ? null : st)}
                />
              ))}
            </div>
          </div>

          <div className="h-16"/>
        </div>

        {/* Footer */}
        <div className={`px-4 sm:px-6 py-3 border-t ${dk ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'} flex items-center justify-end gap-2 shrink-0`}>
          {savedToast && (
            <span className="mr-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 text-white text-[11px] font-bold"><Check size={12}/>Email templates saved</span>
          )}
          <button onClick={handleSaveAll} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 flex items-center gap-1.5"><Save size={13}/>Save All</button>
          <button onClick={handleSaveAndClose} className={`px-4 py-2 rounded-xl text-xs font-bold ${dk ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-black'}`}>Save & Close</button>
        </div>
      </div>

      {/* Preview popup (portal) */}
      {previewStatus && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setPreviewStatus(null)}>
          <div className={`${dk ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-5 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewStatus(null)} className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center ${dk ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}><X size={16}/></button>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center"><Mail size={14} className="text-white"/></div>
              <div className="min-w-0">
                <p className={`text-sm font-bold ${t1}`}>Email · {WA_STATUS_LABELS[previewStatus]?.[lang] || previewStatus}</p>
                <p className={`text-[10px] ${t3}`}>Inbox preview</p>
              </div>
            </div>
            <div className={`rounded-2xl border ${dk ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
              <div className={`px-4 py-2 border-b ${dk ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'} text-[11px] flex items-center gap-2`}>
                <span className={t3}>From:</span>
                <span className={`font-mono ${t1}`}>{cfg.name || cfg.store_name || 'My Store'} &lt;{cfg.email || cfg.store_email || 'no-reply@store.com'}&gt;</span>
              </div>
              <div className={`px-4 py-2 border-b ${dk ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'} text-[12px] font-bold ${t1}`} dir={isRtl ? 'rtl' : 'ltr'}>{preview(getSubject(previewStatus)) || '(no subject)'}</div>
              <div className={`px-4 py-3 ${dk ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} text-[12.5px] leading-relaxed whitespace-pre-wrap break-words`} dir={isRtl ? 'rtl' : 'ltr'}>{preview(getBody(previewStatus)) || '(empty body)'}</div>
            </div>
            <p className={`text-center text-[10px] ${t3} mt-2`}>Preview generated with sample data</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
