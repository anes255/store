import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import { getPlatformInfo } from '../../utils/api';
import { ShoppingBag, Zap, Globe, Shield, BarChart3, Truck, Bot, Smartphone, CreditCard, ArrowRight, Check, Star, Play, Sparkles } from 'lucide-react';

const features = [
  { icon: ShoppingBag, title: 'One-Click Store Setup', desc: 'Launch your store in under 5 minutes with beautiful templates and zero coding.' },
  { icon: Globe, title: '58 Wilayas Coverage', desc: 'Sell everywhere in Algeria with integrated shipping to all wilayas.' },
  { icon: CreditCard, title: 'Local Payments', desc: 'Accept COD, CCP, BaridiMob, and bank transfers natively.' },
  { icon: Bot, title: 'AI-Powered Tools', desc: 'Smart chatbot, fake order detection, and cart recovery automation.' },
  { icon: Truck, title: 'Delivery Integration', desc: 'Connect with major delivery companies and track shipments.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track sales, visitors, and orders with real-time analytics.' },
  { icon: Smartphone, title: 'Mobile Optimized', desc: 'Every store is perfectly responsive on all devices.' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'SSL encryption, DDoS protection, and 99.9% uptime.' },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [platformInfo, setPlatformInfo] = useState({ site_name: 'KyoMarket' });
  useEffect(() => { getPlatformInfo().then(r => setPlatformInfo(r.data)).catch(() => {}); }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] overflow-hidden">
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30"><ShoppingBag size={20} className="text-white" /></div>
            <span className="text-xl font-extrabold font-display text-gray-900">{platformInfo.site_name}</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-gray-600 hover:text-brand-600 transition-colors">{t('nav.features')}</a>
            <a href="#pricing" className="text-sm font-semibold text-gray-600 hover:text-brand-600 transition-colors">{t('nav.pricing')}</a>
            <LanguageSwitcher compact />
            <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-brand-600">{t('nav.login')}</Link>
            <Link to="/register" className="btn-primary text-sm !py-2.5 !px-5">{t('nav.signup')}</Link>
          </div>
          <div className="md:hidden flex items-center gap-3"><LanguageSwitcher compact /><Link to="/register" className="btn-primary text-xs !py-2 !px-4">{t('nav.signup')}</Link></div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-200 rounded-full text-brand-600 text-sm font-bold mb-8"><Sparkles size={16} />Now with AI-Powered Features</div>
            <h1 className="text-5xl md:text-7xl font-extrabold font-display leading-tight">
              <span className="text-gray-900">{t('hero.title').split(' ').slice(0, 2).join(' ')}</span><br />
              <span className="gradient-text">{t('hero.title').split(' ').slice(2).join(' ')}</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">{t('hero.subtitle')}</p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary text-base !py-4 !px-8 flex items-center gap-2 group">{t('hero.cta')}<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></Link>
              <a href="#features" className="btn-secondary text-base !py-4 !px-8 flex items-center gap-2"><Play size={16} />{t('hero.cta2')}</a>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-500" /> 14-day free trial</span>
              <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-500" /> Cancel anytime</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-16 relative">
            <div className="bg-white rounded-3xl shadow-glass-lg border border-gray-200/50 overflow-hidden p-2">
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 min-h-[400px] flex items-center justify-center relative">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 w-full max-w-3xl">
                  {[{ label: 'Stores Created', value: '2,400+', color: 'from-blue-500 to-cyan-500' }, { label: 'Orders Processed', value: '150K+', color: 'from-purple-500 to-pink-500' }, { label: 'Revenue Generated', value: '₫89M+', color: 'from-emerald-500 to-teal-500' }, { label: 'Happy Merchants', value: '98.5%', color: 'from-amber-500 to-orange-500' }].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                      <div className={`text-2xl md:text-3xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</div>
                      <p className="text-white/60 text-xs mt-1 font-medium">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16"><h2 className="text-4xl md:text-5xl font-extrabold font-display text-gray-900">{t('features.title')}</h2><p className="mt-4 text-lg text-gray-500">{t('features.subtitle')}</p></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => { const Icon = feature.icon; return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="glass-card-solid p-6 hover:shadow-glass-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-500 group-hover:shadow-lg group-hover:shadow-brand-500/30 transition-all duration-300"><Icon size={22} className="text-brand-500 group-hover:text-white transition-colors" /></div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ); })}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold font-display text-gray-900">{t('pricing.title')}</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {[{ name: 'Starter', price: 'Free', period: '14 days', features: ['1 Store', '50 Products', 'Basic Analytics', 'COD Payment'] }, { name: 'Pro', price: '2,900 DZD', period: '/month', popular: true, features: ['3 Stores', 'Unlimited Products', 'AI Chatbot', 'All Payments', 'Cart Recovery', 'Custom Domain'] }, { name: 'Enterprise', price: '7,900 DZD', period: '/month', features: ['Unlimited Stores', 'Priority Support', 'API Access', 'White Label', 'Dedicated Server'] }].map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`relative rounded-3xl p-8 ${plan.popular ? 'bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-2xl shadow-brand-500/30 scale-105' : 'bg-gray-50 border border-gray-200'}`}>
                {plan.popular && (<span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">MOST POPULAR</span>)}
                <h3 className={`text-xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="mt-4 mb-6"><span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span><span className={`text-sm ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>{plan.period}</span></div>
                <ul className="space-y-3 mb-8">{plan.features.map((f, j) => (<li key={j} className={`flex items-center gap-2 text-sm ${plan.popular ? 'text-white/90' : 'text-gray-600'}`}><Check size={16} className={plan.popular ? 'text-white' : 'text-brand-500'} />{f}</li>))}</ul>
                <Link to="/register" className={`block w-full py-3 rounded-xl font-bold text-center transition-all ${plan.popular ? 'bg-white text-brand-600 hover:bg-gray-100' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>{t('pricing.start')}</Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-brand-500 via-purple-600 to-brand-700 rounded-3xl p-12 md:p-16 relative overflow-hidden">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white relative z-10">Ready to Start Selling?</h2>
          <p className="mt-4 text-white/70 text-lg relative z-10">Join thousands of merchants already growing with {platformInfo.site_name}.</p>
          <Link to="/register" className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-2xl relative z-10 group">Get Started Free<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center"><ShoppingBag size={16} className="text-white" /></div><span className="font-bold text-gray-900">{platformInfo.site_name}</span></div>
          <p className="text-sm text-gray-400">© 2026 {platformInfo.site_name}. All rights reserved.</p>
          <Link to="/admin/login" className="text-xs text-gray-400 hover:text-gray-600">Platform Admin</Link>
        </div>
      </footer>
    </div>
  );
}
