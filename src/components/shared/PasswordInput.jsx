import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Drop-in replacement for <input type="password"> with a show/hide button.
// Margin classes are moved to the wrapper so the eye stays centred on the field.
export default function PasswordInput({ className = '', style, ...props }) {
  const [show, setShow] = useState(false);
  const tokens = String(className).split(/\s+/).filter(Boolean);
  const isMargin = (c) => /^(!?-?m[trblxy]?-|w-|max-w-|flex-|basis-)/.test(c);
  const wrapCls = tokens.filter(isMargin).join(' ');
  const inputCls = tokens.filter(c => !isMargin(c)).concat('w-full', '!pr-10').join(' ');
  return (
    <div className={`relative ${wrapCls}`}>
      <input {...props} type={show ? 'text' : 'password'} className={inputCls} style={style} />
      <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide password' : 'Show password'} title={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
