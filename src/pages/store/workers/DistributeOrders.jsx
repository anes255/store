import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Shuffle, Check, Zap } from 'lucide-react';
import { workersApi } from '../../../utils/api';
import { Avatar, Sheet } from './shared';

// Spread unassigned new orders over workers: "N per worker" or "N in total,
// split evenly", plus the store setting that hands every new order to the
// least-busy chosen worker automatically.
export default function DistributeOrders({ sid, open, onClose, onDone }) {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState([]);
  const [picked, setPicked] = useState([]);
  const [mode, setMode] = useState('per_worker');
  const [n, setN] = useState('4');
  const [withCallFailed, setWithCallFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [auto, setAuto] = useState({ enabled: false, worker_ids: [], max_open: 0 });
  const [autoSaving, setAutoSaving] = useState(false);
  const [waiting, setWaiting] = useState(null); // orders with no worker yet
  // Handing orders out in batches once enough have piled up. Not the same as
  // the per-order automatic assignment below it.
  const [batch, setBatch] = useState({ enabled: false, worker_ids: [], every_minutes: 30, include_call_failed: false });
  const [batchSaving, setBatchSaving] = useState(false);

  useEffect(() => {
    if (!open || !sid) return;
    setResult(null);
    workersApi.assignableWorkers(sid).then((r) => { const w = r.data.workers || []; setWorkers(w); setPicked(w.map((x) => x.id)); }).catch(() => setWorkers([]));
    workersApi.autoAssignSettings(sid).then((r) => setAuto(r.data)).catch(() => {});
    workersApi.autoDistributeSettings(sid).then((r) => setBatch(r.data)).catch(() => {});
  }, [open, sid]);

  // How many orders are actually waiting — the splits below are built from it.
  useEffect(() => {
    if (!open || !sid) return;
    workersApi.autoAssignAvailable(sid, withCallFailed).then((r) => setWaiting(r.data?.available ?? null)).catch(() => setWaiting(null));
  }, [open, sid, withCallFailed]);

  const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const num = Math.max(0, parseInt(n, 10) || 0);
  const preview = mode === 'per_worker'
    ? t('workers.distPreviewPer', 'Up to {{total}} orders: {{n}} for each of {{w}} worker(s).', { total: num * picked.length, n: num, w: picked.length })
    : t('workers.distPreviewTotal', '{{total}} orders split evenly: about {{each}} for each of {{w}} worker(s).', { total: num, each: picked.length ? Math.ceil(num / picked.length) : 0, w: picked.length });

  // The exact share each worker ends up with: "5 + 5" or "2 + 2 + 2 + 2 + 2".
  const shares = (() => {
    const w = picked.length;
    if (!w || !num) return [];
    const take = mode === 'per_worker'
      ? Math.min(num * w, waiting == null ? num * w : waiting)
      : Math.min(num, waiting == null ? num : waiting);
    const cap = mode === 'per_worker' ? num : Infinity;
    const out = new Array(w).fill(0);
    let left = take, i = 0, guard = 0;
    while (left > 0 && guard < take + w + 1) { if (out[i] < cap) { out[i]++; left--; } i = (i + 1) % w; guard++; }
    return out;
  })();

  // Ready-made splits for the orders that are waiting: "5 each", "2 each"…
  const splitOptions = (() => {
    const w = picked.length, av = waiting || 0;
    if (!w || !av) return [];
    const sizes = new Set([Math.ceil(av / w)]);
    for (const k of [1, 2, 3, 5, 10]) if (k * w <= av) sizes.add(k);
    return [...sizes].filter((s) => s > 0).sort((a, b) => a - b).slice(0, 5);
  })();

  const run = async () => {
    if (!picked.length) return toast.error(t('workers.distPickWorkers', 'Pick at least one worker'));
    if (!num) return toast.error(t('workers.distGiveNumber', 'Give the number of orders'));
    if (!sid) return toast.error(t('workers.distNoStore', 'No store selected'));
    setBusy(true);
    try {
      const { data } = await workersApi.autoAssign(sid, { worker_ids: picked, [mode]: num, include_call_failed: withCallFailed });
      workersApi.autoAssignAvailable(sid, withCallFailed).then((r) => setWaiting(r.data?.available ?? null)).catch(() => {});
      setResult(data);
      toast.success(data.assigned ? t('workers.distDone', '{{n}} order(s) distributed', { n: data.assigned }) : t('workers.distNone', 'No unassigned new orders to distribute'));
      if (data.assigned) onDone?.();
    } catch (e) { toast.error(e?.response?.data?.error || t('workers.failed', 'Failed')); }
    setBusy(false);
  };
  const saveBatch = async (next) => {
    setBatch(next); setBatchSaving(true);
    try { const { data } = await workersApi.saveAutoDistributeSettings(sid, next); setBatch(data); toast.success(t('workers.saved', 'Saved')); }
    catch (e) { toast.error(e?.response?.data?.error || t('workers.failed', 'Failed')); }
    setBatchSaving(false);
  };
  const saveAuto = async (next) => {
    setAuto(next); setAutoSaving(true);
    try { const { data } = await workersApi.saveAutoAssignSettings(sid, next); setAuto(data); toast.success(t('workers.saved', 'Saved')); }
    catch (e) { toast.error(e?.response?.data?.error || t('workers.failed', 'Failed')); }
    setAutoSaving(false);
  };

  const WorkerPick = ({ list, onToggle }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {workers.map((w) => { const on = list.includes(w.id); return (
        <button key={w.id} type="button" onClick={() => onToggle(w.id)} className={`flex items-center gap-2.5 p-2 rounded-xl border text-start transition-colors ${on ? 'border-brand-500 bg-brand-500/5' : 'border-gray-200 hover:bg-gray-50'}`}>
          <Avatar worker={w} size={30} />
          <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-gray-900 truncate">{w.name}</span>{w.job_type && <span className="block text-[11px] text-gray-400 truncate">{t(`workers.jobName.${w.job_type}`, w.job_type)}</span>}</span>
          <span className={`w-5 h-5 rounded-md border grid place-items-center shrink-0 ${on ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300'}`}>{on && <Check size={12} strokeWidth={3} />}</span>
        </button>
      ); })}
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} title={t('workers.distTitle', 'Distribute orders to workers')} wide
      footer={<button className="btn-primary text-sm flex items-center gap-1.5" disabled={busy || !workers.length} onClick={run}><Shuffle size={14} />{busy ? t('workers.distRunning', 'Distributing…') : t('workers.distRun', 'Distribute now')}</button>}>
      {!workers.length ? <p className="text-sm text-gray-500 py-6 text-center">{t('workers.distNoWorkers', 'No active workers yet.')}</p> : (
        <div className="space-y-5">
          <div>
            <p className="input-label">{t('workers.distWho', 'Workers who receive orders')}</p>
            <WorkerPick list={picked} onToggle={(id) => setPicked((p) => toggle(p, id))} />
          </div>
          <div>
            <p className="input-label">{t('workers.distHowMany', 'How many orders')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-gray-100 rounded-xl p-1">
                {[['per_worker', t('workers.distPerWorker', 'Per worker')], ['total', t('workers.distTotal', 'In total')]].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setMode(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${mode === k ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}>{l}</button>
                ))}
              </div>
              <input type="number" min="1" className="input-field !w-28 text-sm" value={n} onChange={(e) => setN(e.target.value)} />
            </div>
            {waiting != null && (
              <p className="text-xs text-gray-500 mt-2">
                {t('workers.distWaiting', '{{n}} order(s) waiting for a worker.', { n: waiting })}
                {splitOptions.length > 0 && <> {t('workers.distSplitHint', 'Pick a share:')}</>}
              </p>
            )}
            {splitOptions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {splitOptions.map((s) => (
                  <button key={s} type="button" onClick={() => { setMode('per_worker'); setN(String(s)); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${mode === 'per_worker' && num === s ? 'border-brand-500 bg-brand-500/10 text-brand-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {t('workers.distEach', '{{n}} each', { n: s })}
                  </button>
                ))}
                <button type="button" onClick={() => { setMode('total'); setN(String(waiting)); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${mode === 'total' && num === waiting ? 'border-brand-500 bg-brand-500/10 text-brand-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {t('workers.distAllEvenly', 'All {{n}}, split evenly', { n: waiting })}
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">{preview}</p>
            {shares.length > 0 && (
              <p className="text-xs font-bold text-gray-700 mt-1">
                {t('workers.distSplit', 'Split')}: {shares.join(' + ')} = {shares.reduce((a, b) => a + b, 0)}
              </p>
            )}
            <label className="flex items-center gap-2 mt-3 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={withCallFailed} onChange={(e) => setWithCallFailed(e.target.checked)} />{t('workers.distWithCallFailed', 'Also include orders where a call failed')}</label>
            <p className="text-[11px] text-gray-400 mt-1">{t('workers.distRules', 'Only unassigned new orders are handed out, oldest first. Workers with less open work get theirs first.')}</p>
          </div>
          {result && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-sm">
              <p className="font-bold text-emerald-800 mb-1">{t('workers.distDone', '{{n}} order(s) distributed', { n: result.assigned })}</p>
              {result.workers.filter((w) => w.count).map((w) => <p key={w.id} className="text-emerald-700">{w.name}: <b>{w.count}</b></p>)}
              {result.assigned < (mode === 'per_worker' ? num * picked.length : num) && <p className="text-[11px] text-emerald-700/80 mt-1">{t('workers.distFewer', 'There were fewer unassigned new orders than requested.')}</p>}
            </div>
          )}
          <div className="rounded-2xl border border-gray-200 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1" checked={batch.enabled} disabled={batchSaving}
                onChange={(e) => saveBatch({ ...batch, enabled: e.target.checked, worker_ids: batch.worker_ids.length ? batch.worker_ids : picked })} />
              <span><span className="flex items-center gap-1.5 text-sm font-bold text-gray-900"><Shuffle size={14} className="text-brand-500" />{t('workers.batchTitle', 'Share orders out on a timer')}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{t('workers.batchHelp', 'Every so often, count the orders waiting and split them evenly between the chosen workers. Eight orders over two workers is four each; twenty is ten each. Nobody has to press Distribute.')}</span></span>
            </label>
            {batch.enabled && (
              <div className="mt-4 space-y-3">
                <WorkerPick list={batch.worker_ids} onToggle={(id) => saveBatch({ ...batch, worker_ids: toggle(batch.worker_ids, id) })} />
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <p className="input-label">{t('workers.batchEvery', 'How often')}</p>
                    <select className="input-field text-sm" value={batch.every_minutes}
                      onChange={(e) => saveBatch({ ...batch, every_minutes: parseInt(e.target.value, 10) })}>
                      {[5, 10, 15, 30, 60, 120, 240, 480].map((m) => (
                        <option key={m} value={m}>{m < 60 ? t('workers.everyNMin', 'Every {{n}} minutes', { n: m }) : t('workers.everyNHour', 'Every {{n}} hour(s)', { n: m / 60 })}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="btn-ghost text-xs" disabled={batchSaving}
                    onClick={async () => {
                      try {
                        const { data } = await workersApi.runAutoDistribute(sid);
                        toast.success(data.assigned ? t('workers.distDone', '{{n}} order(s) distributed', { n: data.assigned }) : t('workers.distNone', 'No unassigned new orders to distribute'));
                        if (data.assigned) onDone?.();
                        workersApi.autoAssignAvailable(sid, withCallFailed).then((r) => setWaiting(r.data?.available ?? null)).catch(() => {});
                      } catch (e) { toast.error(e?.response?.data?.error || t('workers.failed', 'Failed')); }
                    }}>
                    {t('workers.runNow', 'Run a round now')}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  {(batch.worker_ids || []).length && waiting
                    ? t('workers.batchPreview', 'Right now that would be {{n}} waiting over {{w}} worker(s): about {{each}} each.', {
                        n: waiting, w: (batch.worker_ids || []).length, each: Math.ceil(waiting / (batch.worker_ids || []).length) })
                    : t('workers.batchIdle', 'Whatever is waiting when the next round comes gets shared out evenly.')}
                </p>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={!!batch.include_call_failed} onChange={(e) => saveBatch({ ...batch, include_call_failed: e.target.checked })} />
                  {t('workers.distWithCallFailed', 'Also include orders where a call failed')}
                </label>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1" checked={auto.enabled} disabled={autoSaving} onChange={(e) => saveAuto({ ...auto, enabled: e.target.checked, worker_ids: auto.worker_ids.length ? auto.worker_ids : picked })} />
              <span><span className="flex items-center gap-1.5 text-sm font-bold text-gray-900"><Zap size={14} className="text-amber-500" />{t('workers.autoTitle', 'Assign new orders automatically')}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{t('workers.autoHelp', 'Each new order goes straight to the chosen worker with the fewest open orders.')}</span></span>
            </label>
            {auto.enabled && (
              <div className="mt-4 space-y-3">
                <WorkerPick list={auto.worker_ids} onToggle={(id) => saveAuto({ ...auto, worker_ids: toggle(auto.worker_ids, id) })} />
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                  {t('workers.autoMaxOpen', 'Maximum open orders per worker')}
                  <input type="number" min="0" className="input-field !w-24 text-sm" value={auto.max_open || ''} placeholder="∞" onChange={(e) => setAuto({ ...auto, max_open: e.target.value })} onBlur={() => saveAuto({ ...auto, max_open: parseInt(auto.max_open, 10) || 0 })} />
                </div>
                <p className="text-[11px] text-gray-400">{t('workers.autoMaxHelp', 'When every chosen worker has reached this number, new orders stay unassigned. Leave empty for no limit.')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
