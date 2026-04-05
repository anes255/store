import React,{useState,useEffect,useRef} from'react';import DashboardLayout from'../../components/shared/DashboardLayout';import{useStoreManagement}from'../../hooks/useStore';import{ownerApi}from'../../utils/api';import toast from'react-hot-toast';import{Plus,X,Save,Trash2,ChevronUp,ChevronDown,Eye,EyeOff,Type,Image,Layout,Grid3X3,Columns,AlignLeft,AlignCenter,AlignRight,Palette,Move,Copy,Monitor,Smartphone,Undo2,Settings2,ShoppingBag,MessageSquare,Star,Sparkles,ArrowUp,ArrowDown}from'lucide-react';

const SECTION_TYPES=[
  {type:'hero',label:'Hero Banner',icon:Layout,desc:'Large banner with title and subtitle'},
  {type:'products',label:'Products Grid',icon:Grid3X3,desc:'Display products in a grid'},
  {type:'text',label:'Text Block',icon:Type,desc:'Custom text content'},
  {type:'image',label:'Image',icon:Image,desc:'Full-width or contained image'},
  {type:'banner',label:'Promo Banner',icon:Sparkles,desc:'Promotional banner with CTA'},
  {type:'categories',label:'Categories',icon:Columns,desc:'Show product categories'},
  {type:'testimonials',label:'Testimonials',icon:MessageSquare,desc:'Customer reviews showcase'},
  {type:'spacer',label:'Spacer',icon:ArrowDown,desc:'Empty space between sections'},
  {type:'features',label:'Features/Trust',icon:Star,desc:'Feature icons with text'},
  {type:'custom_html',label:'Custom HTML',icon:Settings2,desc:'Raw HTML content'},
];

const FONTS=['Inter','Arial','Georgia','Playfair Display','Poppins','Roboto','Montserrat','Lora','Raleway','Cairo','Tajawal'];

const defaultSection=(type)=>{
  const base={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),type,visible:true,
    style:{bg:'#ffffff',textColor:'#1f2937',padding:'60',fontFamily:'Inter',borderRadius:'0',maxWidth:'1200'}};
  switch(type){
    case'hero':return{...base,content:{title:'Welcome to Our Store',subtitle:'Discover amazing products',btnText:'Shop Now',btnLink:'#products',
      titleSize:'48',subtitleSize:'20',btnColor:'#7C3AED',bgImage:'',overlay:'0.3',align:'center',height:'500'}};
    case'products':return{...base,content:{title:'Our Products',titleSize:'28',columns:'4',mobileColumns:'2',cardStyle:'shadow',showPrice:true,showName:true,showBtn:true,limit:'8',featured:false}};
    case'text':return{...base,content:{text:'Add your content here. You can write anything you want — store description, policies, announcements.',fontSize:'16',lineHeight:'1.7',align:'left',maxWidth:'800'}};
    case'image':return{...base,content:{src:'',alt:'',width:'100',height:'auto',align:'center',rounded:'12',link:''}};
    case'banner':return{...base,content:{text:'Special Offer! Get 20% OFF',btnText:'Shop Now',btnLink:'#products',bg:'#7C3AED',textColor:'#ffffff',fontSize:'24',align:'center'},style:{...base.style,bg:'#7C3AED',textColor:'#ffffff',padding:'40'}};
    case'categories':return{...base,content:{title:'Shop by Category',titleSize:'28',columns:'3',style:'card'}};
    case'testimonials':return{...base,content:{title:'What Customers Say',titleSize:'28',items:[
      {name:'Ahmed',text:'Great quality products and fast delivery!',rating:5},
      {name:'Sara',text:'Love shopping here. Best prices in Algeria!',rating:5},
      {name:'Yacine',text:'Excellent customer service. Highly recommended.',rating:4}
    ]}};
    case'spacer':return{...base,content:{height:'60'},style:{...base.style,padding:'0',bg:'transparent'}};
    case'features':return{...base,content:{items:[
      {icon:'🚚',title:'Free Delivery',desc:'All 58 wilayas'},
      {icon:'💳',title:'Secure Payment',desc:'Multiple options'},
      {icon:'🔄',title:'Easy Returns',desc:'30-day policy'}
    ],columns:'3'}};
    case'custom_html':return{...base,content:{html:'<div style="text-align:center;padding:20px;"><h2>Custom Section</h2><p>Write any HTML here</p></div>'}};
    default:return base;
  }
};

function StylePanel({section,onChange}){
  const s=section.style||{};const c=section.content||{};
  const set=(k,v)=>onChange({...section,style:{...s,[k]:v}});
  const setC=(k,v)=>onChange({...section,content:{...c,[k]:v}});

  return(<div className="space-y-4 text-sm">
    {/* Common styles */}
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Background</p>
      <div className="flex gap-2">
        <input type="color" className="w-8 h-8 rounded cursor-pointer" value={s.bg||'#ffffff'} onChange={e=>set('bg',e.target.value)}/>
        <input className="input-field flex-1 !py-1.5 text-xs" value={s.bg||''} onChange={e=>set('bg',e.target.value)} placeholder="#ffffff"/>
      </div>
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Text Color</p>
      <div className="flex gap-2">
        <input type="color" className="w-8 h-8 rounded cursor-pointer" value={s.textColor||'#1f2937'} onChange={e=>set('textColor',e.target.value)}/>
        <input className="input-field flex-1 !py-1.5 text-xs" value={s.textColor||''} onChange={e=>set('textColor',e.target.value)}/>
      </div>
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Font</p>
      <select className="input-field !py-1.5 text-xs" value={s.fontFamily||'Inter'} onChange={e=>set('fontFamily',e.target.value)}>
        {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Padding</p><input type="number" className="input-field !py-1.5 text-xs" value={s.padding||'60'} onChange={e=>set('padding',e.target.value)}/></div>
      <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Corner Radius</p><input type="number" className="input-field !py-1.5 text-xs" value={s.borderRadius||'0'} onChange={e=>set('borderRadius',e.target.value)}/></div>
    </div>
    <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Max Width (px)</p><input type="number" className="input-field !py-1.5 text-xs" value={s.maxWidth||'1200'} onChange={e=>set('maxWidth',e.target.value)}/></div>

    {/* Type-specific content */}
    {section.type==='hero'&&<>
      <hr/>
      <p className="text-[10px] font-bold text-brand-500 uppercase">Hero Settings</p>
      <div><p className="text-[10px] text-gray-400">Title</p><input className="input-field !py-1.5 text-xs" value={c.title||''} onChange={e=>setC('title',e.target.value)}/></div>
      <div><p className="text-[10px] text-gray-400">Subtitle</p><input className="input-field !py-1.5 text-xs" value={c.subtitle||''} onChange={e=>setC('subtitle',e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-2">
        <div><p className="text-[10px] text-gray-400">Title Size</p><input type="number" className="input-field !py-1.5 text-xs" value={c.titleSize||'48'} onChange={e=>setC('titleSize',e.target.value)}/></div>
        <div><p className="text-[10px] text-gray-400">Subtitle Size</p><input type="number" className="input-field !py-1.5 text-xs" value={c.subtitleSize||'20'} onChange={e=>setC('subtitleSize',e.target.value)}/></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><p className="text-[10px] text-gray-400">Button Text</p><input className="input-field !py-1.5 text-xs" value={c.btnText||''} onChange={e=>setC('btnText',e.target.value)}/></div>
        <div><p className="text-[10px] text-gray-400">Button Color</p><div className="flex gap-1"><input type="color" className="w-7 h-7 rounded" value={c.btnColor||'#7C3AED'} onChange={e=>setC('btnColor',e.target.value)}/><input className="input-field flex-1 !py-1 text-[10px]" value={c.btnColor||''} onChange={e=>setC('btnColor',e.target.value)}/></div></div>
      </div>
      <div><p className="text-[10px] text-gray-400">Height (px)</p><input type="number" className="input-field !py-1.5 text-xs" value={c.height||'500'} onChange={e=>setC('height',e.target.value)}/></div>
      <div><p className="text-[10px] text-gray-400">Background Image URL</p><input className="input-field !py-1.5 text-xs" value={c.bgImage||''} onChange={e=>setC('bgImage',e.target.value)} placeholder="https://..."/></div>
      <div><p className="text-[10px] text-gray-400">Alignment</p><div className="flex gap-1">{['left','center','right'].map(a=><button key={a} onClick={()=>setC('align',a)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${c.align===a?'bg-brand-500 text-white':'bg-gray-100'}`}>{a}</button>)}</div></div>
    </>}

    {section.type==='products'&&<>
      <hr/>
      <p className="text-[10px] font-bold text-brand-500 uppercase">Products Settings</p>
      <div><p className="text-[10px] text-gray-400">Section Title</p><input className="input-field !py-1.5 text-xs" value={c.title||''} onChange={e=>setC('title',e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-2">
        <div><p className="text-[10px] text-gray-400">Columns</p><select className="input-field !py-1.5 text-xs" value={c.columns||'4'} onChange={e=>setC('columns',e.target.value)}><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></div>
        <div><p className="text-[10px] text-gray-400">Mobile Cols</p><select className="input-field !py-1.5 text-xs" value={c.mobileColumns||'2'} onChange={e=>setC('mobileColumns',e.target.value)}><option value="1">1</option><option value="2">2</option></select></div>
      </div>
      <div><p className="text-[10px] text-gray-400">Max Products</p><input type="number" className="input-field !py-1.5 text-xs" value={c.limit||'8'} onChange={e=>setC('limit',e.target.value)}/></div>
      <div><p className="text-[10px] text-gray-400">Card Style</p><select className="input-field !py-1.5 text-xs" value={c.cardStyle||'shadow'} onChange={e=>setC('cardStyle',e.target.value)}><option value="shadow">Shadow</option><option value="border">Border</option><option value="flat">Flat</option><option value="minimal">Minimal</option></select></div>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={c.featured||false} onChange={e=>setC('featured',e.target.checked)}/><span className="text-xs">Featured only</span></label>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={c.showPrice!==false} onChange={e=>setC('showPrice',e.target.checked)}/><span className="text-xs">Show price</span></label>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={c.showBtn!==false} onChange={e=>setC('showBtn',e.target.checked)}/><span className="text-xs">Show add-to-cart</span></label>
    </>}

    {section.type==='text'&&<>
      <hr/>
      <p className="text-[10px] font-bold text-brand-500 uppercase">Text Settings</p>
      <div><p className="text-[10px] text-gray-400">Content</p><textarea className="input-field !py-1.5 text-xs" rows={5} value={c.text||''} onChange={e=>setC('text',e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-2">
        <div><p className="text-[10px] text-gray-400">Font Size</p><input type="number" className="input-field !py-1.5 text-xs" value={c.fontSize||'16'} onChange={e=>setC('fontSize',e.target.value)}/></div>
        <div><p className="text-[10px] text-gray-400">Line Height</p><input className="input-field !py-1.5 text-xs" value={c.lineHeight||'1.7'} onChange={e=>setC('lineHeight',e.target.value)}/></div>
      </div>
      <div><p className="text-[10px] text-gray-400">Alignment</p><div className="flex gap-1">{['left','center','right'].map(a=><button key={a} onClick={()=>setC('align',a)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${c.align===a?'bg-brand-500 text-white':'bg-gray-100'}`}>{a}</button>)}</div></div>
    </>}

    {section.type==='image'&&<>
      <hr/>
      <p className="text-[10px] font-bold text-brand-500 uppercase">Image Settings</p>
      <div><p className="text-[10px] text-gray-400">Image URL</p><input className="input-field !py-1.5 text-xs" value={c.src||''} onChange={e=>setC('src',e.target.value)} placeholder="https://..."/></div>
      <div className="grid grid-cols-2 gap-2">
        <div><p className="text-[10px] text-gray-400">Width %</p><input type="number" className="input-field !py-1.5 text-xs" value={c.width||'100'} onChange={e=>setC('width',e.target.value)}/></div>
        <div><p className="text-[10px] text-gray-400">Rounded (px)</p><input type="number" className="input-field !py-1.5 text-xs" value={c.rounded||'12'} onChange={e=>setC('rounded',e.target.value)}/></div>
      </div>
      <div><p className="text-[10px] text-gray-400">Link (optional)</p><input className="input-field !py-1.5 text-xs" value={c.link||''} onChange={e=>setC('link',e.target.value)}/></div>
      <div><p className="text-[10px] text-gray-400">Alignment</p><div className="flex gap-1">{['left','center','right'].map(a=><button key={a} onClick={()=>setC('align',a)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${c.align===a?'bg-brand-500 text-white':'bg-gray-100'}`}>{a}</button>)}</div></div>
    </>}

    {section.type==='banner'&&<>
      <hr/>
      <p className="text-[10px] font-bold text-brand-500 uppercase">Banner Settings</p>
      <div><p className="text-[10px] text-gray-400">Text</p><input className="input-field !py-1.5 text-xs" value={c.text||''} onChange={e=>setC('text',e.target.value)}/></div>
      <div><p className="text-[10px] text-gray-400">Font Size</p><input type="number" className="input-field !py-1.5 text-xs" value={c.fontSize||'24'} onChange={e=>setC('fontSize',e.target.value)}/></div>
      <div className="grid grid-cols-2 gap-2">
        <div><p className="text-[10px] text-gray-400">Button Text</p><input className="input-field !py-1.5 text-xs" value={c.btnText||''} onChange={e=>setC('btnText',e.target.value)}/></div>
        <div><p className="text-[10px] text-gray-400">Button Link</p><input className="input-field !py-1.5 text-xs" value={c.btnLink||''} onChange={e=>setC('btnLink',e.target.value)}/></div>
      </div>
    </>}

    {section.type==='spacer'&&<>
      <hr/>
      <div><p className="text-[10px] text-gray-400">Height (px)</p><input type="number" className="input-field !py-1.5 text-xs" value={c.height||'60'} onChange={e=>setC('height',e.target.value)}/></div>
    </>}

    {section.type==='features'&&<>
      <hr/>
      <p className="text-[10px] font-bold text-brand-500 uppercase">Features</p>
      <div><p className="text-[10px] text-gray-400">Columns</p><select className="input-field !py-1.5 text-xs" value={c.columns||'3'} onChange={e=>setC('columns',e.target.value)}><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div>
      {(c.items||[]).map((item,i)=>(
        <div key={i} className="p-2 bg-gray-50 rounded-lg space-y-1">
          <div className="flex gap-1"><input className="input-field !py-1 text-xs w-12" value={item.icon||''} onChange={e=>{const it=[...c.items];it[i]={...it[i],icon:e.target.value};setC('items',it);}}/><input className="input-field !py-1 text-xs flex-1" value={item.title||''} onChange={e=>{const it=[...c.items];it[i]={...it[i],title:e.target.value};setC('items',it);}}/><button onClick={()=>{const it=[...c.items];it.splice(i,1);setC('items',it);}} className="text-red-400"><X size={12}/></button></div>
          <input className="input-field !py-1 text-xs" value={item.desc||''} onChange={e=>{const it=[...c.items];it[i]={...it[i],desc:e.target.value};setC('items',it);}} placeholder="Description"/>
        </div>
      ))}
      <button onClick={()=>setC('items',[...(c.items||[]),{icon:'⭐',title:'Feature',desc:'Description'}])} className="text-xs text-brand-600 font-bold hover:underline">+ Add Feature</button>
    </>}

    {section.type==='testimonials'&&<>
      <hr/>
      <p className="text-[10px] font-bold text-brand-500 uppercase">Testimonials</p>
      <div><p className="text-[10px] text-gray-400">Title</p><input className="input-field !py-1.5 text-xs" value={c.title||''} onChange={e=>setC('title',e.target.value)}/></div>
      {(c.items||[]).map((item,i)=>(
        <div key={i} className="p-2 bg-gray-50 rounded-lg space-y-1">
          <div className="flex gap-1"><input className="input-field !py-1 text-xs w-20" value={item.name||''} onChange={e=>{const it=[...c.items];it[i]={...it[i],name:e.target.value};setC('items',it);}} placeholder="Name"/><select className="input-field !py-1 text-xs w-14" value={item.rating||5} onChange={e=>{const it=[...c.items];it[i]={...it[i],rating:parseInt(e.target.value)};setC('items',it);}}><option value={5}>5★</option><option value={4}>4★</option><option value={3}>3★</option></select><button onClick={()=>{const it=[...c.items];it.splice(i,1);setC('items',it);}} className="text-red-400"><X size={12}/></button></div>
          <textarea className="input-field !py-1 text-xs" rows={2} value={item.text||''} onChange={e=>{const it=[...c.items];it[i]={...it[i],text:e.target.value};setC('items',it);}}/>
        </div>
      ))}
      <button onClick={()=>setC('items',[...(c.items||[]),{name:'Customer',text:'Great store!',rating:5}])} className="text-xs text-brand-600 font-bold hover:underline">+ Add Review</button>
    </>}

    {section.type==='categories'&&<>
      <hr/>
      <div><p className="text-[10px] text-gray-400">Title</p><input className="input-field !py-1.5 text-xs" value={c.title||''} onChange={e=>setC('title',e.target.value)}/></div>
      <div><p className="text-[10px] text-gray-400">Columns</p><select className="input-field !py-1.5 text-xs" value={c.columns||'3'} onChange={e=>setC('columns',e.target.value)}><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div>
      <div><p className="text-[10px] text-gray-400">Style</p><select className="input-field !py-1.5 text-xs" value={c.style||'card'} onChange={e=>setC('style',e.target.value)}><option value="card">Card</option><option value="pill">Pill</option><option value="minimal">Minimal</option></select></div>
    </>}

    {section.type==='custom_html'&&<>
      <hr/>
      <div><p className="text-[10px] text-gray-400">HTML Code</p><textarea className="input-field !py-1.5 text-xs font-mono" rows={8} value={c.html||''} onChange={e=>setC('html',e.target.value)}/></div>
    </>}
  </div>);
}

function SectionPreview({section}){
  const s=section.style||{};const c=section.content||{};
  const wrap={backgroundColor:s.bg||'#fff',color:s.textColor||'#1f2937',padding:`${(s.padding||60)/4}px`,fontFamily:s.fontFamily||'Inter',borderRadius:`${s.borderRadius||0}px`};

  if(section.type==='hero'){
    return(<div style={{...wrap,minHeight:`${(c.height||500)/4}px`,backgroundImage:c.bgImage?`url(${c.bgImage})`:'none',backgroundSize:'cover',backgroundPosition:'center',display:'flex',alignItems:'center',justifyContent:c.align||'center',textAlign:c.align||'center',position:'relative'}}>
      {c.bgImage&&<div style={{position:'absolute',inset:0,backgroundColor:`rgba(0,0,0,${c.overlay||0.3})`}}/>}
      <div style={{position:'relative',zIndex:1}}><p style={{fontSize:`${(c.titleSize||48)/3}px`,fontWeight:900}}>{c.title}</p><p style={{fontSize:`${(c.subtitleSize||20)/3}px`,opacity:0.8,marginTop:4}}>{c.subtitle}</p>{c.btnText&&<div style={{marginTop:8,display:'inline-block',padding:'4px 12px',backgroundColor:c.btnColor||'#7C3AED',color:'#fff',borderRadius:6,fontSize:10,fontWeight:700}}>{c.btnText}</div>}</div>
    </div>);
  }
  if(section.type==='products'){
    const cols=parseInt(c.columns)||4;
    return(<div style={wrap}><p style={{fontSize:`${(c.titleSize||28)/3}px`,fontWeight:800,textAlign:'center',marginBottom:8}}>{c.title}</p><div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:6}}>{Array.from({length:Math.min(parseInt(c.limit)||4,8)}).map((_,i)=><div key={i} style={{backgroundColor:'#f3f4f6',borderRadius:8,overflow:'hidden'}}><div style={{height:40,backgroundColor:'#e5e7eb'}}/><div style={{padding:4}}><div style={{height:6,backgroundColor:'#d1d5db',borderRadius:3,marginBottom:3,width:'70%'}}/>{c.showPrice!==false&&<div style={{height:5,backgroundColor:'#a78bfa',borderRadius:3,width:'40%'}}/>}</div></div>)}</div></div>);
  }
  if(section.type==='text'){
    return(<div style={{...wrap,textAlign:c.align||'left'}}><p style={{fontSize:`${(c.fontSize||16)/3}px`,lineHeight:c.lineHeight||'1.7',maxWidth:c.maxWidth?`${c.maxWidth/3}px`:'none',margin:c.align==='center'?'0 auto':'0'}}>{c.text}</p></div>);
  }
  if(section.type==='image'){
    return(<div style={{...wrap,textAlign:c.align||'center'}}>{c.src?<img src={c.src} style={{width:`${c.width||100}%`,borderRadius:`${c.rounded||12}px`,maxWidth:'100%'}} alt=""/>:<div style={{height:60,backgroundColor:'#e5e7eb',borderRadius:`${c.rounded||12}px`,display:'flex',alignItems:'center',justifyContent:'center'}}><Image size={20} className="text-gray-400"/></div>}</div>);
  }
  if(section.type==='banner'){
    return(<div style={{...wrap,textAlign:c.align||'center'}}><p style={{fontSize:`${(c.fontSize||24)/3}px`,fontWeight:800}}>{c.text}</p>{c.btnText&&<div style={{marginTop:6,display:'inline-block',padding:'4px 10px',backgroundColor:'#fff',color:s.bg||'#7C3AED',borderRadius:6,fontSize:9,fontWeight:700}}>{c.btnText}</div>}</div>);
  }
  if(section.type==='spacer')return<div style={{height:`${(c.height||60)/4}px`}}/>;
  if(section.type==='features'){
    const cols=parseInt(c.columns)||3;
    return(<div style={wrap}><div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:8,textAlign:'center'}}>{(c.items||[]).map((f,i)=><div key={i}><span style={{fontSize:16}}>{f.icon}</span><p style={{fontWeight:700,fontSize:9,marginTop:2}}>{f.title}</p><p style={{fontSize:7,opacity:0.6}}>{f.desc}</p></div>)}</div></div>);
  }
  if(section.type==='testimonials'){
    return(<div style={wrap}><p style={{fontSize:`${(c.titleSize||28)/3}px`,fontWeight:800,textAlign:'center',marginBottom:8}}>{c.title}</p><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>{(c.items||[]).map((t,i)=><div key={i} style={{backgroundColor:'#f9fafb',padding:6,borderRadius:8}}><p style={{fontSize:7}}>{t.text}</p><p style={{fontSize:6,fontWeight:700,marginTop:3}}>— {t.name}</p><p style={{fontSize:6,color:'#f59e0b'}}>{'★'.repeat(t.rating||5)}</p></div>)}</div></div>);
  }
  if(section.type==='categories'){
    const cols=parseInt(c.columns)||3;
    return(<div style={wrap}><p style={{fontSize:`${(c.titleSize||28)/3}px`,fontWeight:800,textAlign:'center',marginBottom:8}}>{c.title}</p><div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:6}}>{[1,2,3].map(i=><div key={i} style={{height:30,backgroundColor:'#f3f4f6',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:7,fontWeight:700,color:'#9ca3af'}}>Category {i}</span></div>)}</div></div>);
  }
  if(section.type==='custom_html')return<div style={wrap}><div style={{fontSize:8,color:'#6b7280',textAlign:'center'}}>Custom HTML Block</div></div>;
  return<div style={wrap}><p className="text-xs text-gray-400">Unknown section</p></div>;
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
    if(cfg.page_builder&&Array.isArray(cfg.page_builder))setSections(cfg.page_builder);
    else setSections([defaultSection('hero'),defaultSection('products'),defaultSection('features')]);
  },[currentStore?.id]);

  const update=(idx,s)=>{const n=[...sections];n[idx]=s;setSections(n);setDirty(true);};
  const move=(idx,dir)=>{const n=[...sections];const t=n[idx];n[idx]=n[idx+dir];n[idx+dir]=t;setSections(n);setSelected(idx+dir);setDirty(true);};
  const remove=(idx)=>{setSections(sections.filter((_,i)=>i!==idx));if(selected===idx)setSelected(null);setDirty(true);};
  const duplicate=(idx)=>{const s={...sections[idx],id:Date.now().toString(36)+Math.random().toString(36).slice(2,6)};const n=[...sections];n.splice(idx+1,0,s);setSections(n);setDirty(true);};
  const add=(type)=>{setSections([...sections,defaultSection(type)]);setSelected(sections.length);setShowAdd(false);setDirty(true);};
  const toggle=(idx)=>{const n=[...sections];n[idx]={...n[idx],visible:!n[idx].visible};setSections(n);setDirty(true);};

  const save=async()=>{
    setSaving(true);
    try{
      const{data}=await ownerApi.updateStore(currentStore.id,{page_builder:sections});
      setCurrentStore(data);setDirty(false);toast.success('Page saved!');
    }catch{toast.error('Failed');}
    setSaving(false);
  };

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-4">
      <div><h1 className="text-2xl font-bold">Page Builder</h1><p className="text-sm text-gray-400 mt-1">Build your storefront exactly how you want</p></div>
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 rounded-lg p-0.5">{[{k:'desktop',i:Monitor},{k:'mobile',i:Smartphone}].map(v=>{const I=v.i;return<button key={v.k} onClick={()=>setPreview(v.k)} className={`p-1.5 rounded-md ${preview===v.k?'bg-white shadow-sm':'text-gray-400'}`}><I size={14}/></button>;})}</div>
        <button onClick={save} disabled={saving||!dirty} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"><Save size={14}/>{saving?'Saving...':'Save'}</button>
      </div>
    </div>

    <div className="flex gap-4" style={{height:'calc(100vh - 160px)'}}>
      {/* LEFT: Section list */}
      <div className="w-64 shrink-0 space-y-2 overflow-y-auto pr-2">
        {sections.map((sec,i)=>{
          const T=SECTION_TYPES.find(t=>t.type===sec.type);const Icon=T?.icon||Layout;
          return(
            <div key={sec.id} onClick={()=>setSelected(i)} className={`p-3 rounded-xl cursor-pointer transition-all ${selected===i?'bg-brand-50 ring-2 ring-brand-400':'bg-white border border-gray-200 hover:border-gray-300'} ${!sec.visible?'opacity-40':''}`}>
              <div className="flex items-center gap-2">
                <Icon size={14} className={selected===i?'text-brand-500':'text-gray-400'}/>
                <span className="text-xs font-bold text-gray-700 flex-1 truncate">{T?.label||sec.type}</span>
                <div className="flex gap-0.5">
                  {i>0&&<button onClick={e=>{e.stopPropagation();move(i,-1);}} className="p-0.5 hover:bg-gray-200 rounded"><ChevronUp size={10}/></button>}
                  {i<sections.length-1&&<button onClick={e=>{e.stopPropagation();move(i,1);}} className="p-0.5 hover:bg-gray-200 rounded"><ChevronDown size={10}/></button>}
                  <button onClick={e=>{e.stopPropagation();toggle(i);}} className="p-0.5 hover:bg-gray-200 rounded">{sec.visible?<Eye size={10}/>:<EyeOff size={10}/>}</button>
                  <button onClick={e=>{e.stopPropagation();duplicate(i);}} className="p-0.5 hover:bg-gray-200 rounded"><Copy size={10}/></button>
                  <button onClick={e=>{e.stopPropagation();remove(i);}} className="p-0.5 hover:bg-red-100 rounded text-red-400"><Trash2 size={10}/></button>
                </div>
              </div>
            </div>
          );
        })}
        <button onClick={()=>setShowAdd(true)} className="w-full p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-brand-400 hover:text-brand-500 flex items-center justify-center gap-2 text-xs font-bold"><Plus size={14}/>Add Section</button>
      </div>

      {/* CENTER: Preview */}
      <div className="flex-1 bg-gray-100 rounded-2xl overflow-y-auto p-4">
        <div className={`mx-auto bg-white rounded-xl shadow-sm overflow-hidden ${preview==='mobile'?'max-w-[375px]':'max-w-[900px]'}`}>
          {sections.filter(s=>s.visible).map((sec,i)=>(
            <div key={sec.id} onClick={()=>setSelected(sections.indexOf(sec))} className={`cursor-pointer transition-all ${selected===sections.indexOf(sec)?'ring-2 ring-brand-400 ring-inset':''}`}>
              <SectionPreview section={sec}/>
            </div>
          ))}
          {sections.filter(s=>s.visible).length===0&&<div className="py-20 text-center text-gray-400 text-sm">No visible sections. Add one from the left.</div>}
        </div>
      </div>

      {/* RIGHT: Properties */}
      <div className="w-72 shrink-0 bg-white rounded-2xl border border-gray-200 overflow-y-auto p-4">
        {selected!==null&&sections[selected]?(
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-gray-900">{SECTION_TYPES.find(t=>t.type===sections[selected].type)?.label||'Section'}</h3>
              <button onClick={()=>setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X size={14}/></button>
            </div>
            <StylePanel section={sections[selected]} onChange={s=>update(selected,s)}/>
          </div>
        ):(
          <div className="text-center py-12"><Settings2 size={32} className="mx-auto text-gray-300 mb-3"/><p className="text-sm text-gray-400">Click a section to edit its style and content</p></div>
        )}
      </div>
    </div>

    {/* Add Section Modal */}
    {showAdd&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowAdd(false)}><div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Add Section</h2><button onClick={()=>setShowAdd(false)}><X size={20}/></button></div>
      <div className="space-y-2">
        {SECTION_TYPES.map(t=>{const Icon=t.icon;return(
          <button key={t.type} onClick={()=>add(t.type)} className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-brand-400 text-left flex items-center gap-4 transition-all">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0"><Icon size={18} className="text-brand-500"/></div>
            <div><p className="font-bold text-sm text-gray-900">{t.label}</p><p className="text-xs text-gray-400">{t.desc}</p></div>
          </button>
        );})}
      </div>
    </div></div>}
  </DashboardLayout>);
}
