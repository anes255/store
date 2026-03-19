import React,{useState} from'react';import DashboardLayout from'../../components/shared/DashboardLayout';import toast from'react-hot-toast';import{Save,FileText,Heart,Clock,Globe}from'lucide-react';
export default function AboutUs(){const[story,setStory]=useState('');
return(<DashboardLayout>
<div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold">About us</h1><p className="text-sm text-gray-500">Tell your brand story and build trust with your customers</p></div><button onClick={()=>toast.success('Saved!')} className="btn-primary flex items-center gap-2"><Save size={16}/>Save</button></div>
<div className="grid lg:grid-cols-3 gap-6">
<div className="lg:col-span-2 glass-card-solid p-6"><div className="flex items-center gap-2 mb-4"><FileText size={18} className="text-gray-500"/><h3 className="font-bold text-gray-900">Your Brand Story</h3></div>
<textarea className="input-field min-h-[300px]" rows={12} value={story} onChange={e=>setStory(e.target.value)} placeholder={"Write about your store history, mission, and what makes you special...\n\nExample:\nWe started in 2020 with a simple mission: to provide the highest quality products at fair prices.\nOur team is dedicated to sourcing the best materials and ensuring every customer has a great experience.\n\nSupport for Markdown is planned!"}/>
<p className="text-xs text-gray-400 mt-2">{story.length} CHARACTERS</p>
<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 text-sm text-amber-800"><p>ℹ Your 'About Us' page is one of the most visited pages on your store. A compelling story can increase your conversion rate by building emotional connection and trust.</p></div></div>
<div className="space-y-4">
<div className="bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl p-6 text-white"><h3 className="font-bold mb-3">Quick Tips</h3><ul className="space-y-2 text-sm text-white/90"><li>• Share your company's mission and values clearly.</li><li>• Explain the problem you solve for your customers.</li><li>• Keep it authentic and human — don't be afraid to show personality!</li></ul></div>
{[{icon:Heart,label:'CORE VALUES',desc:'Build Connection',color:'bg-pink-50 text-pink-500'},{icon:Clock,label:'HERITAGE',desc:'Share your History',color:'bg-blue-50 text-blue-500'},{icon:Globe,label:'IMPACT',desc:'Your Reach',color:'bg-emerald-50 text-emerald-500'}].map((c,i)=>{const I=c.icon;return(<div key={i} className="glass-card-solid p-5 flex items-center gap-3"><div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center`}><I size={18}/></div><div><p className="text-[10px] text-gray-400 uppercase font-bold">{c.label}</p><p className="font-semibold text-gray-800 text-sm">{c.desc}</p></div></div>);})}
</div></div>
</DashboardLayout>);}
