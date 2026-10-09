import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Deep links from notifications: /dashboard/<page>?highlight=<id>.
// Once the item is on the page it is scrolled into view, outlined for a few
// seconds, and onFound(item) runs once (e.g. to open its details).
export default function useHighlight(items, onFound, getId = (x) => x?.id) {
  const location = useLocation();
  const done = useRef(null);
  const id = (() => { try { return new URLSearchParams(location.search).get('highlight'); } catch { return null; } })();
  useEffect(() => {
    if (!id || done.current === id || !Array.isArray(items) || !items.length) return;
    const item = items.find(x => String(getId(x)) === String(id));
    if (!item) return;
    done.current = id;
    setTimeout(() => {
      const el = document.querySelector(`[data-hl-id="${CSS.escape(String(id))}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2');
        setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2'), 4000);
      }
      if (onFound) onFound(item);
    }, 150);
  }, [id, items]); // eslint-disable-line
}
