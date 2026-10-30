// A product image can arrive as a plain URL, as an object ({ url } / { src }),
// or inside a JSON string in `images`. Everything that ends up in an <img src>
// goes through here — an object there renders nothing, which is what left the
// cart pill and the checkout summary without thumbnails.

export function imageUrl(v) {
  if (!v) return null;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s || s.startsWith('[object')) return null;
    if (s.startsWith('{')) { try { return imageUrl(JSON.parse(s)); } catch { return null; } }
    return s;
  }
  if (typeof v === 'object') return imageUrl(v.url || v.src || v.image || v.path || null);
  return null;
}

/** Every usable image of a product, in order. */
export function imageList(raw) {
  let a = raw;
  if (typeof a === 'string') { try { a = JSON.parse(a); } catch { a = []; } }
  if (!Array.isArray(a)) a = [];
  return a.map(imageUrl).filter(Boolean);
}

/** The picture to show for a product (or a cart line built from one). */
export function productImage(p) {
  if (!p) return null;
  return imageUrl(p.thumbnail) || imageList(p.images)[0] || imageUrl(p.image) || null;
}
