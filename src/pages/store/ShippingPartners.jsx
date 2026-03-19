import React,{useState} from'react';import DashboardLayout from'../../components/shared/DashboardLayout';import{Search,Truck,ExternalLink,X,Lock,Zap}from'lucide-react';
const partners=[{id:'yalidine',name:'Yalidine / Guepex / Yalitec et autres...',type:'MULTI',region:'ALGERIA',color:'bg-red-500',letter:'YA',connected:false},{id:'noest',name:'NOEST Express',type:'EXPRESS',region:'ALGERIA',color:'bg-blue-500',letter:'NO',connected:false},{id:'dhd',name:'DHD Livraison',type:'LIVRAISON',region:'ALGERIA',color:'bg-orange-500',letter:'DH',connected:false},{id:'express-dz',name:'ExpressAlgeria',type:'EXPRESS',region:'ALGERIA',color:'bg-emerald-500',letter:'EX',connected:false},{id:'zr1',name:'ZR Express (la nouvelle plateforme)',type:'EXPRESS',region:'ALGERIA',color:'bg-amber-600',letter:'ZR',connected:false},{id:'zr2',name:'ZR Express',type:'EXPRESS',region:'ALGERIA',color:'bg-amber-600',letter:'ZR',connected:false}];
export default function ShippingPartners(){const[selected,setSelected]=useState(null);const[search,setSearch]=useState('');
return(<DashboardLayout>
<div className="bg-gradient-to-r from-gray-900 via-gray-800 to-purple-900 rounded-2xl p-8 mb-6 text-white">
<div className="grid grid-cols-4 gap-4">
{[{icon:'✅',label:'LINKED PARTNERS',val:'3'},{icon:'🌐',label:'',val:'58'},{icon:'📦',label:'ACTIVE SHIPMENTS',val:'342'},{icon:'⏱',label:'AVG. LEAD TIME',val:'2.4 days'}].map((s,i)=>(<div key={i} className="bg-white/5 rounded-xl p-4"><p className="text-xs text-white/40 mb-1">{s.label}</p><p className="text-3xl font-bold">{s.val}</p></div>))}
</div></div>
<div className="flex items-center gap-4 mb-6"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-10" placeholder="Search Algerian delivery companies..." value={search} onChange={e=>setSearch(e.target.value)}/><span className="absolute left-10 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">DELIVERY.MARKET</span></div></div>
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
{partners.filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase())).map(p=>(<div key={p.id} className="glass-card-solid p-6 text-center hover:shadow-glass-lg transition-all cursor-pointer" onClick={()=>setSelected(p)}>
<div className="flex items-center justify-between mb-4"><div className={`w-14 h-14 rounded-full ${p.color} flex items-center justify-center text-white font-bold text-lg mx-auto`}>{p.letter}</div><ExternalLink size={14} className="text-gray-300"/></div>
{p.connected&&<span className="badge badge-success text-[10px] mb-2">● CONNECTED</span>}
<h3 className="font-bold text-gray-800 text-sm">{p.name}</h3>
<div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-gray-400"><span>{p.type}</span><span>📍 {p.region}</span></div>
<div className="mt-4 flex items-center justify-center gap-2"><div className="flex -space-x-1">{[1,2,3].map(i=>(<div key={i} className={`w-5 h-5 rounded-full border-2 border-white ${p.connected?'bg-red-400':'bg-gray-300'}`}/>))}</div><span className="text-xs text-gray-400">{p.connected?'SYNC ACTIVE':'NOT CONNECTED'}</span></div>
</div>))}
</div>
{selected&&(<div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={()=>setSelected(null)}><div className="w-[420px] bg-gray-900 text-white h-full overflow-y-auto animate-slide-up" onClick={e=>e.stopPropagation()}>
<div className="p-6"><div className="flex items-center justify-between mb-6"><div className={`w-16 h-16 rounded-2xl ${selected.color} flex items-center justify-center text-white font-bold text-xl`}>{selected.letter}</div><button onClick={()=>setSelected(null)} className="text-white/50 hover:text-white"><X size={20}/></button></div>
<h2 className="text-xl font-bold mb-1">{selected.name}</h2>
<div className="flex gap-2 mb-6">{[selected.type,selected.region].map(t=>(<span key={t} className="px-3 py-1 bg-white/10 rounded-full text-xs">{t}</span>))}</div>
<div className="bg-white/5 rounded-xl p-4 mb-6 flex items-center gap-3"><Lock size={18} className="text-brand-400"/><div><p className="text-sm font-semibold">End-to-End Encryption</p><p className="text-xs text-white/50">Credentials are stored using hardware-level encryption (AES-256).</p></div></div>
<div className="space-y-4 mb-6"><div><label className="text-xs text-white/50 uppercase font-bold">API ID</label><input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mt-1" placeholder="Enter API ID"/></div><div><label className="text-xs text-white/50 uppercase font-bold">API TOKEN</label><input type="password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mt-1" placeholder="••••••••••"/></div></div>
<button className="w-full py-3 bg-brand-500 rounded-xl text-white font-bold mb-3">Update Settings</button>
<button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium mb-3">Test Connection</button>
<button className="w-full text-red-400 text-sm font-medium py-2">Disconnect Partner</button>
<p className="text-center text-[10px] text-white/30 mt-4">🔒 SECURE CONNECTION VIA TLS 1.3</p>
</div></div></div>)}
</DashboardLayout>);}
