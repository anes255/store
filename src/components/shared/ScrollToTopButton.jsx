import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

// Floating "back to top" button. Appears once the visitor has scrolled a
// screen or so down, and smooth-scrolls back to the top when tapped.
export default function ScrollToTopButton({ color = '#7c3aed', threshold = 400, label = 'Back to top' }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed right-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-50 w-12 h-12 rounded-full text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      style={{ backgroundColor: color }}
    >
      <ArrowUp size={20} />
    </button>
  );
}
