import React from 'react';
import { motion } from 'framer-motion';
import BrandMark from './BrandMark';

/**
 * The frame every sign-in / sign-up screen sits in.
 *
 * The storefront's buyer login already looked like this; the platform's owner
 * login was a hard-coded dark card and the owner register a light one, so the
 * three screens of the same product looked like three different products.
 * They all render through here now, tinted with whichever accent colour the
 * person's theme is set to.
 */
export default function AuthShell({ pc = '#7C3AED', dark = false, header = null, children, overlay = null, maxWidth = 'max-w-md', swapping = false }) {
  return (
    <div
      className={`customer-auth-scope auth-shell min-h-screen flex flex-col relative overflow-hidden ${dark ? 'auth-dark text-gray-100' : ''}`}
      style={{
        // Picked up by .customer-auth-scope .input-field:focus, so the focus
        // ring follows the theme instead of the platform's default.
        '--store-pc': pc,
        '--store-pc-ring': pc + '55',
        background: dark
          ? '#0d0d0d'
          : `linear-gradient(135deg, #f8fafc 0%, #ffffff 45%, ${pc}1f 100%)`,
      }}
    >
      {/* Ambient blobs in the theme colour — the same three the storefront uses */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: pc + (dark ? '33' : '55') }} />
      <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: pc + (dark ? '22' : '44') }} />
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: pc + (dark ? '1a' : '33') }} />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          layout
          transition={{ layout: { type: 'spring', stiffness: 260, damping: 30 } }}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`relative w-full ${maxWidth} backdrop-blur-xl rounded-3xl shadow-2xl border p-8 overflow-hidden`}
          style={{
            backgroundColor: dark ? 'rgba(12,12,12,0.88)' : 'rgba(255,255,255,0.85)',
            borderColor: pc + (dark ? '55' : '33'),
          }}
        >
          {header}
          <motion.div initial={false}
            animate={{ opacity: swapping ? 0 : 1, scale: swapping ? 0.97 : 1, filter: swapping ? 'blur(6px)' : 'blur(0px)' }}
            transition={{ duration: 0.2, ease: 'easeOut' }} style={{ pointerEvents: swapping ? 'none' : undefined }}>
            {children}
          </motion.div>
          {/* the logo holds the card while the forms swap */}
          <motion.div aria-hidden className="absolute inset-0 grid place-items-center pointer-events-none" initial={false}
            animate={{ opacity: swapping ? 1 : 0 }} transition={{ duration: 0.18 }}>
            <motion.div className="relative" initial={false}
              animate={{ scale: swapping ? 1 : 0.6, rotate: swapping ? 0 : -12 }} transition={{ type: 'spring', stiffness: 380, damping: 22 }}>
              <span className="absolute -inset-2 rounded-[22px] border-2 animate-spin" style={{ borderColor: pc, borderTopColor: 'transparent', animationDuration: '0.9s' }} />
              <BrandMark size={64} pc={pc} radius="1rem" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      {/* Dialogs live outside the card: its backdrop-blur would otherwise
          become the containing block for their position:fixed and clip them. */}
      {overlay}
    </div>
  );
}

/** The log in / create account pill, moved out of the buyer page so both share it. */
export function AuthTabs({ value, onChange, pc, labels }) {
  return (
    <div className="relative grid grid-cols-2 p-1 mb-6 rounded-2xl" style={{ backgroundColor: pc + '14' }}>
      <motion.span
        aria-hidden
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl shadow-md"
        initial={false}
        animate={{ left: value === 'login' ? 4 : 'calc(50%)' }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        style={{ backgroundColor: pc }}
      />
      {['login', 'register'].map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`relative z-10 py-2 text-sm font-bold rounded-xl transition-colors duration-200 ${value === m ? 'text-white' : 'text-gray-500'}`}
        >
          {labels[m]}
        </button>
      ))}
    </div>
  );
}
