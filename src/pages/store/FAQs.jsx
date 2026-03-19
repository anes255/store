import React,{useState} from'react';import DashboardLayout from'../../components/shared/DashboardLayout';import toast from'react-hot-toast';import{Plus,Save,GripVertical,Trash2}from'lucide-react';
export default function FAQs(){const[faqs,setFaqs]=useState([{q:'Do you offer delivery to all wilayas?',a:'Yes, we deliver to all 58 wilayas of Algeria.'},{q:'How long does delivery take?',a:'Most orders arrive within 2-5 business days depending on your location.'},{q:'Can I pay cash on delivery?',a:'Yes, cash on delivery (COD) is our primary payment method.'}]);
const add=()=>setFaqs([...faqs,{q:'',a:''}]);
const update=(i,field,val)=>{const n=[...faqs];n[i][field]=val;setFaqs(n);};
const remove=(i)=>setFaqs(faqs.filter((_,idx)=>idx!==i));
return(<DashboardLayout>
<div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold">FAQs</h1><p className="text-sm text-gray-500">Manage common questions for your customers</p></div><button onClick={add} className="btn-primary flex items-center gap-2"><Plus size={16}/>Add Question</button></div>
<div className="space-y-4">
{faqs.map((f,i)=>(<div key={i} className="glass-card-solid p-6"><div className="flex items-center gap-3 mb-3"><GripVertical size={16} className="text-gray-300 cursor-grab"/><p className="text-xs text-brand-500 font-bold uppercase">Question {i+1}</p><button onClick={()=>remove(i)} className="ml-auto text-red-400 hover:text-red-600"><Trash2 size={14}/></button></div>
<input className="input-field mb-3" value={f.q} onChange={e=>update(i,'q',e.target.value)} placeholder="Enter question..."/>
<p className="text-xs text-gray-400 uppercase font-bold mb-1">Answer</p>
<textarea className="input-field" rows={3} value={f.a} onChange={e=>update(i,'a',e.target.value)} placeholder="Enter answer..."/>
</div>))}
</div>
<div className="flex justify-end mt-6"><button onClick={()=>toast.success('FAQs saved!')} className="btn-primary flex items-center gap-2"><Save size={16}/>Save</button></div>
</DashboardLayout>);}
