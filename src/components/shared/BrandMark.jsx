import React, { useEffect, useState } from 'react';
import { getPlatformInfo } from '../../utils/api';

// The site's logo on the sign-in pages.
//
// It comes from the super admin's settings, which means a request — and
// until that answered, the corner of the card sat empty and the logo
// dropped in late. A ring spins in its place so the space is held from the
// first paint, the way the store's own sign-in does it.
//
// The answer is cached across pages, so moving between Login and Register
// shows the logo at once rather than spinning again.
let cached = null;
let inflight = null;

function loadBrand() {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = getPlatformInfo()
      .then((r) => {
        const d = r.data || {};
        cached = { logo: d.site_logo || '', favicon: d.favicon || '', name: d.site_name || '', primary: d.primary_color || '' };
        return cached;
      })
      .catch(() => { cached = { logo: '', favicon: '', name: '', primary: '' }; return cached; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export function usePlatformBrand() {
  const [brand, setBrand] = useState(cached);
  useEffect(() => {
    let dead = false;
    loadBrand().then((b) => { if (!dead) setBrand(b); });
    return () => { dead = true; };
  }, []);
  return { brand: brand || { logo: '', favicon: '', name: '' }, loading: !brand };
}

export default function BrandMark({ size = 40, pc = '#7C3AED', radius = '1rem', className = '' }) {
  const { brand, loading } = usePlatformBrand();
  const src = brand.logo || brand.favicon;
  const box = { width: size, height: size, borderRadius: radius };

  if (loading) {
    return (
      <span className={`relative inline-grid place-items-center shrink-0 ${className}`} style={box} aria-hidden="true">
        <span className="absolute inset-0 rounded-[inherit] border-2 animate-spin"
          style={{ borderColor: pc, borderTopColor: 'transparent', animationDuration: '0.9s' }} />
        <span className="rounded-[inherit]" style={{ width: size * 0.45, height: size * 0.45, backgroundColor: `${pc}26` }} />
      </span>
    );
  }

  if (src) {
    return <img src={src} alt={brand.name || ''} className={`object-cover bg-white shadow-lg shrink-0 ${className}`}
      style={{ ...box, boxShadow: `0 8px 20px ${pc}4d` }} />;
  }

  // No logo set: the first letter of the site's name, in the site's colour.
  return (
    <span className={`grid place-items-center text-white font-black shrink-0 ${className}`}
      style={{ ...box, backgroundColor: pc, fontSize: size * 0.45, boxShadow: `0 8px 20px ${pc}4d` }}>
      {(brand.name || 'M')[0].toUpperCase()}
    </span>
  );
}
