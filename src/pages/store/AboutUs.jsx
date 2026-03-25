import React,{useState,useEffect} from'react';import DashboardLayout from'../../components/shared/DashboardLayout';import{useStoreManagement}from'../../hooks/useStore';import{ownerApi}from'../../utils/api';import toast from'react-hot-toast';import{Save,FileText}from'lucide-react';
export default function AboutUs(){
  const{currentStore,setCurrentStore}=useStoreManagement();
  const[story,setStory]=useState('');const[mission,setMission]=useState('');const[saving,setSaving]=useState(false);
  useEffect(()=>{if(currentStore){setStory(currentStore.about_story||'');setMission(currentStore.about_mission||'');}},[currentStore?.id]);
  const save=async()=>{setSaving(true);try{const{data}=await ownerApi.updateStore(currentStore.id,{about_story:story,about_mission:mission});setCurrentStore(data);toast.success('Saved!');}catch{toast.error('Failed');}setSaving(false);};
  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold">About Us</h1><p className="text-sm text-gray-400 mt-1">Tell your customers about your brand</p></div><button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2"><Save size={16}/>{saving?'Saving...':'Save'}</button></div>
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass-card-solid p-6"><div className="flex items-center gap-2 mb-4"><FileText size={18} className="text-brand-500"/><h3 className="font-bold">Our Story</h3></div><textarea className="input-field" rows={8} value={story} onChange={e=>setStory(e.target.value)} placeholder="Tell your customers how your brand started, what drives you, and what makes you unique..."/><p className="text-xs text-gray-400 mt-2">This appears on your store's About page</p></div>
      <div className="glass-card-solid p-6"><div className="flex items-center gap-2 mb-4"><FileText size={18} className="text-purple-500"/><h3 className="font-bold">Our Mission</h3></div><textarea className="input-field" rows={8} value={mission} onChange={e=>setMission(e.target.value)} placeholder="What is your brand's mission? What problem do you solve for customers?"/><p className="text-xs text-gray-400 mt-2">Short mission statement for your brand</p></div>
    </div>
    <div className="glass-card-solid p-6 mt-6"><h3 className="font-bold mb-4">Preview</h3><div className="bg-gray-50 rounded-xl p-8"><h2 className="text-2xl font-black text-gray-900 mb-4">About {currentStore?.name||'Our Store'}</h2>{story?<p className="text-gray-600 leading-relaxed mb-4">{story}</p>:<p className="text-gray-400 italic">Your story will appear here...</p>}{mission&&<div className="mt-4 p-4 bg-brand-50 rounded-xl"><p className="text-sm font-bold text-brand-600 mb-1">Our Mission</p><p className="text-gray-700">{mission}</p></div>}</div></div>
  </DashboardLayout>);
}
