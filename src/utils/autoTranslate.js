// Global DOM auto-translator.
//
// Strategy: instead of wrapping every JSX string in t(), we run a single
// MutationObserver on document.body that walks all text nodes + a small set
// of translatable attributes (placeholder, title, aria-label, alt, value on
// buttons / submit inputs). For each, we look up the trimmed English source
// in our flat dictionary (autoTranslateDict.js) and swap it for the current
// language's translation. The original English is cached on the node via a
// WeakMap so subsequent language switches always work from the source text.
//
// This means EVERY page in the app — current and future — becomes translatable
// for free, with zero per-component edits, as long as a string exists in the
// dictionary. To translate a new string anywhere in the app, just add it to
// autoTranslateDict.js. No code changes required.

import i18n from '../i18n';
import DICT from './autoTranslateDict';

const ORIGINAL = new WeakMap(); // node -> { type: 'text'|attr-name, value: original-en }
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

function lookup(text, lang) {
  if (!text) return null;
  const key = text.trim();
  if (!key) return null;
  const entry = DICT[key];
  if (!entry) return null;
  const out = entry[lang];
  if (!out) return null;
  // Preserve leading/trailing whitespace from the original text node
  const lead = text.match(/^\s*/)[0];
  const tail = text.match(/\s*$/)[0];
  return lead + out + tail;
}

function translateTextNode(node, lang) {
  let rec = ORIGINAL.get(node);
  if (!rec) {
    // First time we see this node — remember whatever React rendered as the
    // canonical source.
    rec = { value: node.nodeValue, lastWritten: node.nodeValue };
    ORIGINAL.set(node, rec);
  } else if (rec.lastWritten !== node.nodeValue) {
    // Something external (React re-render from a language change, a t()
    // call, etc.) updated the node's text after we last wrote it. Treat the
    // new content as the new source of truth so we never revert to a stale
    // translation after i18next changes languages.
    rec.value = node.nodeValue;
  }
  let target = rec.value;
  if (lang !== 'en') {
    const tr = lookup(rec.value, lang);
    if (tr != null) target = tr;
  }
  if (node.nodeValue !== target) node.nodeValue = target;
  rec.lastWritten = target;
}

function translateAttr(el, attr, lang) {
  const origKey = '__orig_' + attr;
  const lastKey = '__last_' + attr;
  const current = el.getAttribute(attr);
  if (current == null) return;
  if (el[origKey] == null) {
    el[origKey] = current;
    el[lastKey] = current;
  } else if (el[lastKey] !== current) {
    // External update (e.g. React re-render) -> take as new source.
    el[origKey] = current;
  }
  let target = el[origKey];
  if (lang !== 'en') {
    const tr = lookup(el[origKey], lang);
    if (tr != null) target = tr.trim();
  }
  if (el.getAttribute(attr) !== target) el.setAttribute(attr, target);
  el[lastKey] = target;
}

function walk(root, lang) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root, lang);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  // Skip script/style/inputs that hold user data
  const tag = root.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') return;

  // Translate attributes on this element
  for (const a of ATTRS) {
    if (root.hasAttribute(a)) translateAttr(root, a, lang);
  }
  // Submit/button inputs use `value` for their visible label
  if (tag === 'INPUT') {
    const type = (root.getAttribute('type') || '').toLowerCase();
    if (type === 'submit' || type === 'button' || type === 'reset') {
      const cacheKey = '__orig_value';
      if (root[cacheKey] == null) root[cacheKey] = root.value;
      const orig = root[cacheKey];
      if (lang === 'en') {
        if (root.value !== orig) root.value = orig;
      } else {
        const tr = lookup(orig, lang);
        root.value = tr != null ? tr.trim() : orig;
      }
    }
  }

  // Recurse into children
  for (let c = root.firstChild; c; c = c.nextSibling) walk(c, lang);
}

let scheduled = false;
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    const lang = (i18n.language || 'en').slice(0, 2);
    walk(document.body, lang);
    document.documentElement.setAttribute('lang', lang);
    // Keep LTR layout even for Arabic — user wants text translated without
    // flipping the page direction.
    document.documentElement.setAttribute('dir', 'ltr');
  });
}

export function startAutoTranslate() {
  if (typeof document === 'undefined') return;
  const run = () => {
    schedule();
    const observer = new MutationObserver(muts => {
      // Only schedule; the rAF callback walks the entire body which is fast
      // enough for typical app sizes and avoids redundant per-mutation work.
      for (const m of muts) {
        if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
          schedule();
          return;
        }
        if (m.type === 'characterData') { schedule(); return; }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    i18n.on('languageChanged', () => {
      // Run immediately AND on next frame so both synchronously-updated
      // React nodes and those that re-render after the event are covered.
      const lang = (i18n.language || 'en').slice(0, 2);
      walk(document.body, lang);
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', 'ltr');
      // Re-walk twice more to catch components that re-render on the next
      // microtask / paint after i18next notifies subscribers.
      schedule();
      setTimeout(schedule, 50);
      setTimeout(schedule, 200);
    });
  };
  if (document.body) run();
  else document.addEventListener('DOMContentLoaded', run, { once: true });
}

export default startAutoTranslate;
