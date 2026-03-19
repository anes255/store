import React,{useState,useEffect} from'react';import{useStoreManagement}from'../../hooks/useStore';import DashboardLayout from'../../components/shared/DashboardLayout';import api from'../../utils/api';import toast from'react-hot-toast';import{Globe,Check,X,Save,Search,Truck}from'lucide-react';
export default function ShippingWilayas(){const{currentStore}=useStoreManagement();const[wilayas,setWilayas]=useState([]);const[search,setSearch]=useState('');const[filter,setFilter]=useState('all');const[loading,setLoading]=useState(true);
useEffect(()=>{load();},[currentStore?.id]);
const load=async()=>{if(!currentStore?.id)return;try{const{data}=await api.get(`/manage/stores/${currentStore.id}/shipping-wilayas`);setWilayas(data);}catch{}setLoading(false);};
const seed=async()=>{try{await api.post(`/manage/stores/${currentStore.id}/shipping-wilayas/seed`);toast.success('58 wilayas loaded!');load();}catch{toast.error('Failed');}};
const updatePrice=(id,field,val)=>{setWilayas(wilayas.map(w=>w.id===id?{...w,[field]:val}:w));};
const filtered=wilayas.filter(w=>{if(search&&!w.wilaya_name.toLowerCase().includes(search.toLowerCase())&&!w.wilaya_code.includes(search))return false;if(filter==='active'&&!w.is_active)return false;if(filter==='inactive'&&w.is_active!==false)return false;return true;});
const total=wilayas.length;const active=wilayas.filter(w=>w.is_active!==false).length;const inactive=total-active;
return(<DashboardLayout>
<div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 mb-6 text-white">
<div className="flex items-center gap-2 mb-1"><span className="badge bg-brand-500 text-white text-[10px]">CONFIGURATION LOGISTIQUE</span></div>
<h1 className="text-3xl font-bold">Gestion des <span className="text-brand-400">Wilayas de livraison</span></h1>
<p className="text-white/60 mt-2 text-sm">Personnalisez les tarifs et l'accessibilité de livraison pour chaque province algérienne.</p>
<div className="grid grid-cols-3 gap-6 mt-6">
<div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><Globe size={20}/></div><div><p className="text-xs text-white/50 uppercase">Total des Wilayas</p><p className="text-2xl font-bold">{total}</p></div></div>
<div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Check size={20} className="text-emerald-400"/></div><div><p className="text-xs text-white/50 uppercase">Wilayas Actives</p><p className="text-2xl font-bold text-emerald-400">{active}</p></div></div>
<div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center"><X size={20} className="text-red-400"/></div><div><p className="text-xs text-white/50 uppercase">Wilayas Inactives</p><p className="text-2xl font-bold text-red-400">{inactive}</p></div></div>
</div></div>
{wilayas.length===0?(<div className="glass-card-solid p-12 text-center"><Truck size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 mb-4">No shipping wilayas configured yet.</p><button onClick={seed} className="btn-primary">Load All 58 Wilayas</button></div>):(<>
<div className="flex items-center gap-4 mb-4">
<div className="relative flex-1 max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input-field !pl-9" placeholder="Chercher par nom ou code..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
<div className="flex items-center gap-2 text-sm"><span className="text-gray-500 font-semibold">ÉTAT:</span>{['all','active','inactive'].map(f=>(<button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-bold ${filter===f?'bg-red-500 text-white':'bg-gray-100 text-gray-500'}`}>{f==='all'?'Tous':f==='active'?'Actives':'Inactives'}</button>))}</div>
<button onClick={seed} className="btn-primary text-xs flex items-center gap-1"><Save size={14}/>Enregistrer les modifications</button>
</div>
<div className="glass-card-solid overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase"><th className="px-4 py-3">Wilaya</th><th className="px-4 py-3">Prix à Domicile</th><th className="px-4 py-3">Prix au Bureau</th><th className="px-4 py-3">Commandes Reçues</th><th className="px-4 py-3">État</th><th className="px-4 py-3">Actions</th></tr></thead>
<tbody>{filtered.map((w,i)=>(<tr key={w.id} className="border-t border-gray-100 hover:bg-gray-50/50">
<td className="px-4 py-3"><div className="flex items-center gap-3"><span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i%3===0?'bg-brand-100 text-brand-600':'bg-gray-100 text-gray-600'}`}>{w.wilaya_code}</span><div><p className="font-semibold text-gray-800">{w.wilaya_name}</p><p className="text-[10px] text-brand-500">✎ GESTION DES BUREAUX DE LIVRAISON</p></div></div></td>
<td className="px-4 py-3"><input type="number" className="input-field !w-24 !py-1.5 text-sm text-center" value={w.home_delivery_price||''} onChange={e=>updatePrice(w.id,'home_delivery_price',e.target.value)}/></td>
<td className="px-4 py-3"><input type="number" className="input-field !w-24 !py-1.5 text-sm text-center" value={w.desk_delivery_price||''} onChange={e=>updatePrice(w.id,'desk_delivery_price',e.target.value)}/></td>
<td className="px-4 py-3"><span className="flex items-center gap-1"><span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">0</span></span></td>
<td className="px-4 py-3"><select className="input-field !w-28 !py-1.5 text-xs font-bold" defaultValue="active"><option value="active">ACTIVE</option><option value="inactive">INACTIVE</option></select></td>
<td className="px-4 py-3"><button className="text-gray-400 hover:text-gray-600">⋯</button></td>
</tr>))}</tbody></table></div></>)}
</DashboardLayout>);}
