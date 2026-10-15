import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HoldToConfirm from './HoldToConfirm';

// Confirmation for destructive actions, used instead of window.confirm():
//   if (!(await dangerConfirm({ title, description, confirmText, holdLabel }))) return;
// - the action is named ("Hold to delete store"), never "Yes"
// - the safe choice sits in the primary spot (bottom right, prominent);
//   the destructive control is off that path, in the middle of the card
// - optional "type the name to confirm" (a bar shows how much matches)
//   before the hold ring unlocks
// - the action only fires after a deliberate press-and-hold on the ring
let pushRequest = null;
export function dangerConfirm(opts = {}) {
  return new Promise((resolve) => {
    if (!pushRequest) { resolve(window.confirm(opts.description || opts.title || 'Are you sure?')); return; }
    pushRequest({ ...opts, resolve });
  });
}

export default function DangerConfirmHost() {
  const { t } = useTranslation();
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
  const target = needsText ? String(req.confirmText).trim() : '';
  const unlocked = !needsText || typed.trim() === target;
  let matched = 0;
  while (matched < typed.length && matched < target.length && typed[matched] === target[matched]) matched++;
  const typo = typed.length > matched;
  const matchPct = target ? (unlocked ? 100 : (matched / target.length) * 100) : 0;
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
                  <h2 className="text-lg font-black">{req.title || t('danger.areYouSure', 'Are you sure?')}</h2>
                  {req.description && <p className="text-sm text-gray-500 mt-1">{req.description}</p>}
                </div>
              </div>
              {needsText && (
                <div className="mt-4">
                  <label className="text-xs font-semibold text-gray-500">
                    {req.typeLabel || t('danger.type', 'Type')} <b className="text-gray-900 font-mono">{req.confirmText}</b> {req.typeLabelAfter || t('danger.toConfirm', 'to confirm')}
                  </label>
                  <input autoFocus className="input-field mt-1 font-mono" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={req.confirmText} autoComplete="off" />
                  <div className="mt-1.5 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <motion.div className={`h-full rounded-full ${unlocked ? 'bg-emerald-500' : typo ? 'bg-amber-400' : 'bg-red-500'}`}
                      initial={false} animate={{ width: `${matchPct}%` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  </div>
                </div>
              )}
              <div className="mt-5 flex justify-center">
                <HoldToConfirm variant="ring" onConfirm={() => close(true)} disabled={!unlocked}
                  label={req.holdLabel || t('danger.holdToDelete', 'Hold to delete')} holdingLabel={req.holdingLabel || t('danger.keepHolding', 'Keep holding…')}
                  doneLabel={req.doneLabel || t('danger.deleting', 'Deleting…')} releasedLabel={req.releasedLabel || t('danger.released', 'Released — nothing happened')}
                  hint={unlocked ? (req.hint || t('danger.releaseToCancel', 'Release early to cancel')) : (req.lockedHint || t('danger.typeToUnlock', 'Type the name above to unlock'))} />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <button type="button" autoFocus={!needsText} onClick={() => close(false)} className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800">
                  {req.cancelLabel || t('common.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
