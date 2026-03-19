import React,{useState,useEffect} from'react';import{useStoreManagement}from'../../hooks/useStore';import{ownerApi}from'../../utils/api';import DashboardLayout from'../../components/shared/DashboardLayout';import toast from'react-hot-toast';import{Save,Phone,Mail,MapPin,Globe}from'lucide-react';
export default function ContactInfo(){const{currentStore}=useStoreManagement();const[f,setF]=useState({});
useEffect(()=>{if(currentStore)setF(currentStore);},[currentStore]);
const s=(k)=>(e)=>setF({...f,[k]:e.target.value});
const save=async()=>{try{await ownerApi.updateStore(currentStore.id,f);toast.success('Saved!');}catch{toast.error('Failed');}};
return(<DashboardLayout>
<div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold">Contact information</h1><p className="text-sm text-gray-500">Manage your store's contact information</p></div><button onClick={save} className="btn-primary flex items-center gap-2"><Save size={16}/>Save</button></div>
<div className="glass-card-solid p-6 mb-6"><h3 className="font-bold text-lg mb-4">Contact Details</h3>
<div className="grid md:grid-cols-2 gap-4"><div><label className="input-label flex items-center gap-1"><Phone size={14}/>Phone Number</label><input className="input-field" placeholder="+213 XX XX XX XX XX" value={f.contact_phone||''} onChange={s('contact_phone')}/></div><div><label className="input-label flex items-center gap-1"><Mail size={14}/>Email Address</label><input className="input-field" placeholder="contact@store.com" value={f.contact_email||''} onChange={s('contact_email')}/></div></div>
<div className="mt-4"><label className="input-label flex items-center gap-1"><MapPin size={14}/>Physical Address</label><textarea className="input-field" rows={2} placeholder="123 Main Street, Algiers, Algeria" value={f.contact_address||''} onChange={s('contact_address')}/></div>
<div className="mt-4"><label className="input-label flex items-center gap-1"><Globe size={14}/>Website URL</label><input className="input-field" placeholder="https://www.yourstore.com" value={f.website_url||''} onChange={s('website_url')}/></div></div>
<div className="glass-card-solid p-6"><h3 className="font-bold text-lg mb-4">Social Media</h3>
<div className="grid md:grid-cols-2 gap-4">
{[{icon:'📘',label:'Facebook',key:'social_facebook',ph:'https://facebook.com/yourstore'},{icon:'📸',label:'Instagram',key:'social_instagram',ph:'https://instagram.com/yourstore'},{icon:'🐦',label:'Twitter (X)',key:'twitter',ph:'https://twitter.com/yourstore'},{icon:'💼',label:'LinkedIn',key:'linkedin',ph:'https://linkedin.com/company/yourstore'},{icon:'📺',label:'YouTube',key:'youtube',ph:'https://youtube.com/@yourstore'},{icon:'🎵',label:'TikTok',key:'social_tiktok',ph:'https://tiktok.com/@yourstore'},{icon:'👻',label:'Snapchat',key:'snapchat',ph:'https://snapchat.com/add/yourstore'},{icon:'📌',label:'Pinterest',key:'pinterest',ph:'https://pinterest.com/yourstore'}].map(x=>(<div key={x.key}><label className="input-label flex items-center gap-1"><span>{x.icon}</span>{x.label}</label><input className="input-field" placeholder={x.ph} value={f[x.key]||''} onChange={s(x.key)}/></div>))}
</div></div>
</DashboardLayout>);}
