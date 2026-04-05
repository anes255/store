import React,{useState,useEffect} from'react';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import{ownerApi}from'../../utils/api';
import toast from'react-hot-toast';
import{Plus,X,Save,Trash2,ChevronUp,ChevronDown,Eye,EyeOff,Type,Image,Layout,Package,Copy,Monitor,Smartphone,Star,Sparkles,Zap}from'lucide-react';

const FONTS=['Inter','Arial','Georgia','Playfair Display','Poppins','Roboto','Montserrat','Lora','Raleway','Cairo','Tajawal'];

const SECTION_TYPES=[
  {type:'hero',label:'Hero Banner',icon:Layout,desc:'Large banner with title and subtitle'},
  {type:'products',label:'Products Grid',icon:Package,desc:'Display products in a grid'},
  {type:'text',label:'Text Block',icon:Type,desc:'Custom text content'},
  {type:'image',label:'Image',icon:Image,desc:'Full-width or contained image'},
  {type:'banner',label:'Promo Banner',icon:Sparkles,desc:'Promotional banner with CTA'},
  {type:'spacer',label:'Spacer',icon:ChevronDown,desc:'Empty space between sections'},
  {type:'features',label:'Features/Trust',icon:Star,desc:'Feature icons with text'},
  {type:'testimonials',label:'Testimonials',icon:Star,desc:'Customer reviews showcase'},
  {type:'custom_html',label:'Custom HTML',icon:Zap,desc:'Raw HTML content'},
];

const defaultSection=(type)=>{
  const base={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),type,visible:true,
    style:{bg:'#ffffff',textColor:'#1f2937',padding:'60',fontFamily:'Inter',borderRadius:'0',maxWidth:'1200'}};
  const defs={
    hero:{title:'Welcome to Our Store',subtitle:'Discover amazing products',btnText:'Shop Now',btnLink:'#products',titleSize:'48',subtitleSize:'20',btnColor:'#7C3AED',bgImage:'',overlay:'0.3',align:'center',height:'500'},
    products:{title:'Our Products',titleSize:'28',columns:'4',mobileColumns:'2',cardStyle:'shadow',showPrice:true,showName:true,showBtn:true,limit:'8',featured:false},
    text:{text:'Add your content here.',fontSize:'16',lineHeight:'1.7',align:'left',maxWidth:'800'},
    image:{src:'',alt:'',width:'100',height:'auto',align:'center',rounded:'12',link:''},
    banner:{text:'Special Offer! Get 20% OFF',btnText:'Shop Now',btnLink:'#',fontSize:'24',align:'center'},
    spacer:{height:'60'},
    features:{items:[{icon:'🚚',title:'Fast Delivery',desc:'All 58 wilayas'},{icon:'💳',title:'Secure Payment',desc:'Multiple options'},{icon:'🔄',title:'Easy Returns',desc:'30-day policy'}],columns:'3'},
    testimonials:{title:'What Customers Say',titleSize:'28',items:[{name:'Ahmed',text:'Great quality!',rating:5},{name:'Sara',text:'Best prices!',rating:5},{name:'Yacine',text:'Excellent service.',rating:4}]},
    custom_html:{html:'<div style="text-align:center;padding:20px;"><h2>Custom Section</h2></div>'},
  };
  if(type==='banner')base.style={...base.style,bg:'#7C3AED',textColor:'#ffffff',padding:'40'};
  if(type==='spacer')base.style={...base.style,padding:'0',bg:'transparent'};
  return{...base,content:defs[type]||{}};
};

function StylePanel({section,onChange}){
  const s=section.style||{};const c=section.content||{};
  const set=(k,v)=>onChange({...section,style:{...s,[k]:v}});
  const setC=(k,v)=>onChange({...section,content:{...c,[k]:v}});
  return(<div className="space-y-3 text-sm">
    <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Background</p><div className="flex gap-2"><input type="color" className="w-8 h-8 rounded cursor-pointer" value={s.bg||'#ffffff'} onChange={e=>set('bg',e.target.value)}/><input className="input-field flex-1 !py-1 text-xs" value={s.bg||''} onChange={e=>set('bg',e.target.value)}/></div></div>
    <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Text Color</p><div className="flex gap-2"><input type="color" className="w-8 h-8 rounded cursor-pointer" value={s.textColor||'#1f2937'} onChange={e=>set('textColor',e.target.value)}/><input className="input-field flex-1 !py-1 text-xs" value={s.textColor||''} onChange={e=>set('textColor',e.target.value)}/></div></div>
    <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Font</p><select className="input-field !py-1 text-xs" value={s.fontFamily||'Inter'} onChange={e=>set('fontFamily',e.target.value)}>{FONTS.map(f=><option key={f} value={f}>{f}</option>)}</select></div>
    <div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Padding</p><input type="number" className="input-field !py-1 text-xs" value={s.padding||'60'} onChange={e=>set('padding',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Radius</p><input type="number" className="input-field !py-1 text-xs" value={s.borderRadius||'0'} onChange={e=>set('borderRadius',e.target.value)}/></div></div>
    <div><p className="text-[10px] text-gray-400">Max Width</p><input type="number" className="input-field !py-1 text-xs" value={s.maxWidth||'1200'} onChange={e=>set('maxWidth',e.target.value)}/></div>

    {section.type==='hero'&&<><hr/><p className="text-[10px] font-bold text-brand-500 uppercase">Hero</p>
      <div><p className="text-[10px] text-gray-400">Title</p><input className="input-field !py-1 text-xs" value={c.title||''} onChange={e=>setC('title',e.target.value)}/></div>
      <div><p className="text-[10px] text-gray-400">Subtitle</p><input className="input-field !py-1 text-xs" value={c.subtitle||''} onChange={e=>setC('subtitle',e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Title Size</p><input type="number" className="input-field !py-1 text-xs" value={c.titleSize||'48'} onChange={e=>setC('titleSize',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Sub Size</p><input type="number" className="input-field !py-1 text-xs" value={c.subtitleSize||'20'} onChange={e=>setC('subtitleSize',e.target.value)}/></div></div>
      <div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Button</p><input className="input-field !py-1 text-xs" value={c.btnText||''} onChange={e=>setC('btnText',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Btn Color</p><div className="flex gap-1"><input type="color" className="w-6 h-6 rounded" value={c.btnColor||'#7C3AED'} onChange={e=>setC('btnColor',e.target.value)}/><input className="input-field flex-1 !py-0.5 text-[10px]" value={c.btnColor||''} onChange={e=>setC('btnColor',e.target.value)}/></div></div></div>
      <div><p className="text-[10px] text-gray-400">Height (px)</p><input type="number" className="input-field !py-1 text-xs" value={c.height||'500'} onChange={e=>setC('height',e.target.value)}/></div>
      <div><p className="text-[10px] text-gray-400">BG Image URL</p><input className="input-field !py-1 text-xs" value={c.bgImage||''} onChange={e=>setC('bgImage',e.target.value)}/></div>
      <div><p className="text-[10px] text-gray-400">Align</p><div className="flex gap-1">{['left','center','right'].map(a=><button key={a} onClick={()=>setC('align',a)} className={`flex-1 py-1 rounded text-xs font-bold ${c.align===a?'bg-brand-500 text-white':'bg-gray-100'}`}>{a}</button>)}</div></div>
    </>}

    {section.type==='products'&&<><hr/><p className="text-[10px] font-bold text-brand-500 uppercase">Products</p>
      <div><p className="text-[10px] text-gray-400">Title</p><input className="input-field !py-1 text-xs" value={c.title||''} onChange={e=>setC('title',e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Columns</p><select className="input-field !py-1 text-xs" value={c.columns||'4'} onChange={e=>setC('columns',e.target.value)}><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></div><div><p className="text-[10px] text-gray-400">Limit</p><input type="number" className="input-field !py-1 text-xs" value={c.limit||'8'} onChange={e=>setC('limit',e.target.value)}/></div></div>
      <div><p className="text-[10px] text-gray-400">Card Style</p><select className="input-field !py-1 text-xs" value={c.cardStyle||'shadow'} onChange={e=>setC('cardStyle',e.target.value)}><option value="shadow">Shadow</option><option value="border">Border</option><option value="flat">Flat</option><option value="minimal">Minimal</option></select></div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={c.showPrice!==false} onChange={e=>setC('showPrice',e.target.checked)}/><span className="text-xs">Show price</span></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={c.showBtn!==false} onChange={e=>setC('showBtn',e.target.checked)}/><span className="text-xs">Show cart button</span></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={c.featured||false} onChange={e=>setC('featured',e.target.checked)}/><span className="text-xs">Featured only</span></label>
    </>}

    {section.type==='text'&&<><hr/>
      <div><p className="text-[10px] text-gray-400">Content</p><textarea className="input-field !py-1 text-xs" rows={4} value={c.text||''} onChange={e=>setC('text',e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Size</p><input type="number" className="input-field !py-1 text-xs" value={c.fontSize||'16'} onChange={e=>setC('fontSize',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Line H</p><input className="input-field !py-1 text-xs" value={c.lineHeight||'1.7'} onChange={e=>setC('lineHeight',e.target.value)}/></div></div>
      <div><p className="text-[10px] text-gray-400">Align</p><div className="flex gap-1">{['left','center','right'].map(a=><button key={a} onClick={()=>setC('align',a)} className={`flex-1 py-1 rounded text-xs font-bold ${c.align===a?'bg-brand-500 text-white':'bg-gray-100'}`}>{a}</button>)}</div></div>
    </>}

    {section.type==='image'&&<><hr/>
      <div><p className="text-[10px] text-gray-400">Image URL</p><input className="input-field !py-1 text-xs" value={c.src||''} onChange={e=>setC('src',e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Width %</p><input type="number" className="input-field !py-1 text-xs" value={c.width||'100'} onChange={e=>setC('width',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Rounded</p><input type="number" className="input-field !py-1 text-xs" value={c.rounded||'12'} onChange={e=>setC('rounded',e.target.value)}/></div></div>
      <div><p className="text-[10px] text-gray-400">Link</p><input className="input-field !py-1 text-xs" value={c.link||''} onChange={e=>setC('link',e.target.value)}/></div>
    </>}

    {section.type==='banner'&&<><hr/>
      <div><p className="text-[10px] text-gray-400">Text</p><input className="input-field !py-1 text-xs" value={c.text||''} onChange={e=>setC('text',e.target.value)}/></div>
      <div><p className="text-[10px] text-gray-400">Font Size</p><input type="number" className="input-field !py-1 text-xs" value={c.fontSize||'24'} onChange={e=>setC('fontSize',e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Button</p><input className="input-field !py-1 text-xs" value={c.btnText||''} onChange={e=>setC('btnText',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Link</p><input className="input-field !py-1 text-xs" value={c.btnLink||''} onChange={e=>setC('btnLink',e.target.value)}/></div></div>
    </>}

    {section.type==='spacer'&&<div><p className="text-[10px] text-gray-400">Height</p><input type="number" className="input-field !py-1 text-xs" value={c.height||'60'} onChange={e=>setC('height',e.target.value)}/></div>}

    {section.type==='features'&&<><hr/>
      <div><p className="text-[10px] text-gray-400">Columns</p><select className="input-field !py-1 text-xs" value={c.columns||'3'} onChange={e=>setC('columns',e.target.value)}><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div>
      {(c.items||[]).map((it,i)=><div key={i} className="p-2 bg-gray-50 rounded-lg space-y-1">
        <div className="flex gap-1"><input className="input-field !py-0.5 text-xs w-10" value={it.icon||''} onChange={e=>{const a=[...c.items];a[i]={...a[i],icon:e.target.value};setC('items',a);}}/><input className="input-field !py-0.5 text-xs flex-1" value={it.title||''} onChange={e=>{const a=[...c.items];a[i]={...a[i],title:e.target.value};setC('items',a);}}/><button onClick={()=>{const a=[...c.items];a.splice(i,1);setC('items',a);}} className="text-red-400"><X size={12}/></button></div>
        <input className="input-field !py-0.5 text-xs" value={it.desc||''} onChange={e=>{const a=[...c.items];a[i]={...a[i],desc:e.target.value};setC('items',a);}} placeholder="Description"/>
      </div>)}
      <button onClick={()=>setC('items',[...(c.items||[]),{icon:'⭐',title:'Feature',desc:'Description'}])} className="text-xs text-brand-600 font-bold">+ Add</button>
    </>}

    {section.type==='testimonials'&&<><hr/>
      <div><p className="text-[10px] text-gray-400">Title</p><input className="input-field !py-1 text-xs" value={c.title||''} onChange={e=>setC('title',e.target.value)}/></div>
      {(c.items||[]).map((it,i)=><div key={i} className="p-2 bg-gray-50 rounded-lg space-y-1">
        <div className="flex gap-1"><input className="input-field !py-0.5 text-xs w-20" value={it.name||''} onChange={e=>{const a=[...c.items];a[i]={...a[i],name:e.target.value};setC('items',a);}} placeholder="Name"/><select className="input-field !py-0.5 text-xs w-14" value={it.rating||5} onChange={e=>{const a=[...c.items];a[i]={...a[i],rating:parseInt(e.target.value)};setC('items',a);}}><option value={5}>5★</option><option value={4}>4★</option><option value={3}>3★</option></select><button onClick={()=>{const a=[...c.items];a.splice(i,1);setC('items',a);}} className="text-red-400"><X size={12}/></button></div>
        <textarea className="input-field !py-0.5 text-xs" rows={2} value={it.text||''} onChange={e=>{const a=[...c.items];a[i]={...a[i],text:e.target.value};setC('items',a);}}/>
      </div>)}
      <button onClick={()=>setC('items',[...(c.items||[]),{name:'Customer',text:'Great!',rating:5}])} className="text-xs text-brand-600 font-bold">+ Add</button>
    </>}

    {section.type==='custom_html'&&<><hr/><div><p className="text-[10px] text-gray-400">HTML</p><textarea className="input-field !py-1 text-xs font-mono" rows={6} value={c.html||''} onChange={e=>setC('html',e.target.value)}/></div></>}
  </div>);
}

function Preview({section}){
  const s=section.style||{};const c=section.content||{};
  const wrap={backgroundColor:s.bg||'#fff',color:s.textColor||'#1f2937',padding:`${(parseInt(s.padding)||60)/4}px`,fontFamily:s.fontFamily||'Inter',borderRadius:`${s.borderRadius||0}px`};
  if(section.type==='hero')return<div style={{...wrap,minHeight:`${(parseInt(c.height)||500)/4}px`,backgroundImage:c.bgImage?`url(${c.bgImage})`:'none',backgroundSize:'cover',backgroundPosition:'center',display:'flex',alignItems:'center',justifyContent:'center',textAlign:c.align||'center',position:'relative'}}>{c.bgImage&&<div style={{position:'absolute',inset:0,backgroundColor:`rgba(0,0,0,${c.overlay||0.3})`}}/>}<div style={{position:'relative',zIndex:1}}><p style={{fontSize:`${(parseInt(c.titleSize)||48)/3}px`,fontWeight:900}}>{c.title}</p><p style={{fontSize:`${(parseInt(c.subtitleSize)||20)/3}px`,opacity:0.7,marginTop:3}}>{c.subtitle}</p>{c.btnText&&<div style={{marginTop:6,display:'inline-block',padding:'3px 10px',backgroundColor:c.btnColor||'#7C3AED',color:'#fff',borderRadius:5,fontSize:9,fontWeight:700}}>{c.btnText}</div>}</div></div>;
  if(section.type==='products'){const cols=parseInt(c.columns)||4;return<div style={wrap}>{c.title&&<p style={{fontSize:`${(parseInt(c.titleSize)||28)/3}px`,fontWeight:800,textAlign:'center',marginBottom:6}}>{c.title}</p>}<div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:4}}>{Array.from({length:Math.min(parseInt(c.limit)||4,6)}).map((_,i)=><div key={i} style={{backgroundColor:'#f3f4f6',borderRadius:6,overflow:'hidden'}}><div style={{height:30,backgroundColor:'#e5e7eb'}}/><div style={{padding:3}}><div style={{height:4,backgroundColor:'#d1d5db',borderRadius:2,width:'70%',marginBottom:2}}/>{c.showPrice!==false&&<div style={{height:4,backgroundColor:'#a78bfa',borderRadius:2,width:'40%'}}/>}</div></div>)}</div></div>;}
  if(section.type==='text')return<div style={{...wrap,textAlign:c.align||'left'}}><p style={{fontSize:`${(parseInt(c.fontSize)||16)/3}px`,lineHeight:c.lineHeight||'1.7'}}>{c.text}</p></div>;
  if(section.type==='image')return<div style={{...wrap,textAlign:c.align||'center'}}>{c.src?<img src={c.src} style={{width:`${c.width||100}%`,borderRadius:`${c.rounded||12}px`,maxWidth:'100%'}} alt=""/>:<div style={{height:40,backgroundColor:'#e5e7eb',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af',fontSize:10}}>No image</div>}</div>;
  if(section.type==='banner')return<div style={{...wrap,textAlign:c.align||'center'}}><p style={{fontSize:`${(parseInt(c.fontSize)||24)/3}px`,fontWeight:800}}>{c.text}</p>{c.btnText&&<div style={{marginTop:4,display:'inline-block',padding:'2px 8px',border:'1px solid currentColor',borderRadius:4,fontSize:8}}>{c.btnText}</div>}</div>;
  if(section.type==='spacer')return<div style={{height:`${(parseInt(c.height)||60)/4}px`}}/>;
  if(section.type==='features'){const cols=parseInt(c.columns)||3;return<div style={wrap}><div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:6,textAlign:'center'}}>{(c.items||[]).map((f,i)=><div key={i}><span style={{fontSize:14}}>{f.icon}</span><p style={{fontWeight:700,fontSize:8,marginTop:1}}>{f.title}</p><p style={{fontSize:6,opacity:0.6}}>{f.desc}</p></div>)}</div></div>;}
  if(section.type==='testimonials')return<div style={wrap}>{c.title&&<p style={{fontSize:`${(parseInt(c.titleSize)||28)/3}px`,fontWeight:800,textAlign:'center',marginBottom:6}}>{c.title}</p>}<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4}}>{(c.items||[]).map((t,i)=><div key={i} style={{backgroundColor:'#f9fafb',padding:4,borderRadius:6}}><p style={{fontSize:6}}>{t.text}</p><p style={{fontSize:5,fontWeight:700,marginTop:2}}>— {t.name}</p></div>)}</div></div>;
  if(section.type==='custom_html')return<div style={wrap}><div style={{fontSize:7,color:'#9ca3af',textAlign:'center'}}>Custom HTML</div></div>;
  return<div style={wrap}><p style={{fontSize:8,color:'#ccc'}}>Unknown</p></div>;
}

export default function AdvancedBuilder(){
  const{currentStore,setCurrentStore}=useStoreManagement();
  const[sections,setSections]=useState([]);
  const[selected,setSelected]=useState(null);
  const[showAdd,setShowAdd]=useState(false);
  const[saving,setSaving]=useState(false);
  const[preview,setPreview]=useState('desktop');
  const[dirty,setDirty]=useState(false);

  useEffect(()=>{
    if(!currentStore)return;
    const cfg=currentStore.config||{};
    if(cfg.page_builder&&Array.isArray(cfg.page_builder)&&cfg.page_builder.length>0)setSections(cfg.page_builder);
    else setSections([defaultSection('hero'),defaultSection('products'),defaultSection('features')]);
  },[currentStore?.id]);

  const upd=(i,s)=>{const n=[...sections];n[i]=s;setSections(n);setDirty(true);};
  const move=(i,d)=>{const n=[...sections];[n[i],n[i+d]]=[n[i+d],n[i]];setSections(n);setSelected(i+d);setDirty(true);};
  const rm=(i)=>{setSections(sections.filter((_,j)=>j!==i));if(selected===i)setSelected(null);setDirty(true);};
  const dup=(i)=>{const s={...JSON.parse(JSON.stringify(sections[i])),id:Date.now().toString(36)+Math.random().toString(36).slice(2,6)};const n=[...sections];n.splice(i+1,0,s);setSections(n);setDirty(true);};
  const add=(type)=>{setSections([...sections,defaultSection(type)]);setSelected(sections.length);setShowAdd(false);setDirty(true);};
  const toggle=(i)=>{const n=[...sections];n[i]={...n[i],visible:!n[i].visible};setSections(n);setDirty(true);};

  const save=async()=>{setSaving(true);try{const{data}=await ownerApi.updateStore(currentStore.id,{page_builder:sections});setCurrentStore(data);setDirty(false);toast.success('Saved!');}catch{toast.error('Failed');}setSaving(false);};

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-4">
      <div><h1 className="text-2xl font-bold">Page Builder</h1><p className="text-sm text-gray-400 mt-1">Build your storefront exactly how you want</p></div>
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 rounded-lg p-0.5"><button onClick={()=>setPreview('desktop')} className={`p-1.5 rounded-md ${preview==='desktop'?'bg-white shadow-sm':'text-gray-400'}`}><Monitor size={14}/></button><button onClick={()=>setPreview('mobile')} className={`p-1.5 rounded-md ${preview==='mobile'?'bg-white shadow-sm':'text-gray-400'}`}><Smartphone size={14}/></button></div>
        <button onClick={save} disabled={saving||!dirty} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"><Save size={14}/>{saving?'Saving...':'Save'}</button>
      </div>
    </div>

    <div className="flex gap-4" style={{height:'calc(100vh - 160px)'}}>
      {/* Sections list */}
      <div className="w-56 shrink-0 space-y-1.5 overflow-y-auto pr-1">
        {sections.map((sec,i)=>{const T=SECTION_TYPES.find(t=>t.type===sec.type);const Icon=T?.icon||Layout;return(
          <div key={sec.id} onClick={()=>setSelected(i)} className={`p-2.5 rounded-xl cursor-pointer transition-all ${selected===i?'bg-brand-50 ring-2 ring-brand-400':'bg-white border border-gray-200 hover:border-gray-300'} ${!sec.visible?'opacity-40':''}`}>
            <div className="flex items-center gap-2">
              <Icon size={13} className={selected===i?'text-brand-500':'text-gray-400'}/>
              <span className="text-[11px] font-bold text-gray-700 flex-1 truncate">{T?.label||sec.type}</span>
              <div className="flex gap-px">
                {i>0&&<button onClick={e=>{e.stopPropagation();move(i,-1);}} className="p-0.5 hover:bg-gray-200 rounded"><ChevronUp size={10}/></button>}
                {i<sections.length-1&&<button onClick={e=>{e.stopPropagation();move(i,1);}} className="p-0.5 hover:bg-gray-200 rounded"><ChevronDown size={10}/></button>}
                <button onClick={e=>{e.stopPropagation();toggle(i);}} className="p-0.5 hover:bg-gray-200 rounded">{sec.visible?<Eye size={10}/>:<EyeOff size={10}/>}</button>
                <button onClick={e=>{e.stopPropagation();dup(i);}} className="p-0.5 hover:bg-gray-200 rounded"><Copy size={10}/></button>
                <button onClick={e=>{e.stopPropagation();rm(i);}} className="p-0.5 hover:bg-red-100 rounded text-red-400"><Trash2 size={10}/></button>
              </div>
            </div>
          </div>);})}
        <button onClick={()=>setShowAdd(true)} className="w-full p-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-brand-400 hover:text-brand-500 flex items-center justify-center gap-1.5 text-xs font-bold"><Plus size={13}/>Add Section</button>
      </div>

      {/* Preview */}
      <div className="flex-1 bg-gray-100 rounded-2xl overflow-y-auto p-3">
        <div className={`mx-auto bg-white rounded-xl shadow-sm overflow-hidden ${preview==='mobile'?'max-w-[375px]':'max-w-[900px]'}`}>
          {sections.filter(s=>s.visible).map(sec=>(
            <div key={sec.id} onClick={()=>setSelected(sections.indexOf(sec))} className={`cursor-pointer transition-all ${selected===sections.indexOf(sec)?'ring-2 ring-brand-400 ring-inset':''}`}><Preview section={sec}/></div>
          ))}
          {sections.filter(s=>s.visible).length===0&&<div className="py-16 text-center text-gray-400 text-sm">No sections. Add one.</div>}
        </div>
      </div>

      {/* Properties */}
      <div className="w-64 shrink-0 bg-white rounded-2xl border border-gray-200 overflow-y-auto p-3">
        {selected!==null&&sections[selected]?<div>
          <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-xs text-gray-900">{SECTION_TYPES.find(t=>t.type===sections[selected].type)?.label||'Section'}</h3><button onClick={()=>setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X size={12}/></button></div>
          <StylePanel section={sections[selected]} onChange={s=>upd(selected,s)}/>
        </div>:<div className="text-center py-10"><Layout size={28} className="mx-auto text-gray-300 mb-2"/><p className="text-xs text-gray-400">Click a section to edit</p></div>}
      </div>
    </div>

    {showAdd&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowAdd(false)}><div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold">Add Section</h2><button onClick={()=>setShowAdd(false)}><X size={18}/></button></div>
      <div className="space-y-1.5">{SECTION_TYPES.map(t=>{const Icon=t.icon;return<button key={t.type} onClick={()=>add(t.type)} className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-brand-400 text-left flex items-center gap-3 transition-all"><div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0"><Icon size={16} className="text-brand-500"/></div><div><p className="font-bold text-sm text-gray-900">{t.label}</p><p className="text-[10px] text-gray-400">{t.desc}</p></div></button>;})}</div>
    </div></div>}
  </DashboardLayout>);
}
