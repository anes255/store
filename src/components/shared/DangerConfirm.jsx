import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import HoldToConfirm from './HoldToConfirm';

// Confirmation for destructive actions, used instead of window.confirm():
//   if (!(await dangerConfirm({ title, description, confirmText, holdLabel }))) return;
// - the action is named on the button ("Hold to delete store"), never "Yes"
// - the safe choice is the prominent one; the destructive one sits aside
// - optional "type the name to confirm" before the hold button unlocks
// - the action only fires after a deliberate press-and-hold
let pushRequest = null;
export function dangerConfirm(opts = {}) {
  return new Promise((resolve) => {
    if (!pushRequest) { resolve(window.confirm(opts.description || opts.title || 'Are you sure?')); return; }
    pushRequest({ ...opts, resolve });
  });
}

export default function DangerConfirmHost() {
  const [req, setReq] = useState(null);
  const [typed, setTyped] = useState('');
  useEffect(() => {
    pushRequest = (r) => { setTyped(''); setReq(r); };
    return () => { pushRequest = null; };
  }, []);
  const close = (result) => { if (req) req.resolve(result); setReq(null); };
  useEffect(() => {
    if (!req) return;
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [req]); // eslint-disable-line

  const needsText = !!req?.confirmText;
  const unlocked = !needsText || typed.trim() === String(req.confirmText).trim();
  return (
    <AnimatePresence>
      {req && (
        <motion.div key="danger" className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => close(false)}>
          <motion.div role="alertdialog" aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white text-gray-900 shadow-2xl border border-red-100 overflow-hidden"
            initial={{ y: 24, scale: 0.96, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 12, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }} onClick={(e) => e.stopPropagation()}>
            <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-orange-400" />
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 grid place-items-center shrink-0"><AlertTriangle size={20} /></div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black">{req.title || 'Are you sure?'}</h2>
                  {req.description && <p className="text-sm text-gray-500 mt-1">{req.description}</p>}
                </div>
              </div>
              {needsText && (
                <div className="mt-4">
                  <label className="text-xs font-semibold text-gray-500">
                    {req.typeLabel || 'Type'} <b className="text-gray-900 font-mono">{req.confirmText}</b> {req.typeLabelAfter || 'to confirm'}
                  </label>
                  <input autoFocus className="input-field mt-1 font-mono" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={req.confirmText} autoComplete="off" />
                </div>
              )}
              <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
                <button type="button" onClick={() => close(false)} className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800">
                  {req.cancelLabel || 'Cancel'}
                </button>
                <HoldToConfirm onConfirm={() => close(true)} disabled={!unlocked}
                  label={req.holdLabel || 'Hold to delete'} holdingLabel={req.holdingLabel || 'Keep holding…'}
                  doneLabel={req.doneLabel || 'Deleting…'} hint={unlocked ? (req.hint || 'Release early to cancel') : (req.lockedHint || 'Type the name above to unlock')} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
