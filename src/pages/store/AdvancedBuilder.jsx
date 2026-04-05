import React,{useState,useEffect} from'react';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import{ownerApi}from'../../utils/api';
import toast from'react-hot-toast';
import{Plus,X,Save,Trash2,ChevronUp,ChevronDown,Eye,EyeOff,Type,Image,Layout,Package,Copy,Monitor,Smartphone,Star,Sparkles,Zap,Layers}from'lucide-react';

const FONTS=['Inter','Arial','Georgia','Playfair Display','Poppins','Roboto','Montserrat','Lora','Raleway','Cairo','Tajawal'];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);

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

// ═══════════════════════════════════════════
//  TEMPLATES
// ═══════════════════════════════════════════
const TEMPLATES=[
  {name:'Modern Minimal',desc:'Clean white, bold typography, Apple-inspired',colors:['#ffffff','#111111','#fafafa'],
    sections:[
      {id:uid(),type:'hero',visible:true,style:{bg:'#ffffff',textColor:'#111111',padding:'80',fontFamily:'Inter',borderRadius:'0',maxWidth:'1200'},content:{title:'Less is More.',subtitle:'Premium products, thoughtfully curated for people who value simplicity.',btnText:'Explore Collection',btnLink:'#products',titleSize:'64',subtitleSize:'18',btnColor:'#111111',bgImage:'',overlay:'0',align:'center',height:'550'}},
      {id:uid(),type:'features',visible:true,style:{bg:'#fafafa',textColor:'#333333',padding:'50',fontFamily:'Inter',borderRadius:'0',maxWidth:'1000'},content:{items:[{icon:'✦',title:'Free Shipping',desc:'On all orders above 3000 DZD'},{icon:'◆',title:'Premium Quality',desc:'Handpicked, tested, guaranteed'},{icon:'●',title:'24/7 Support',desc:'We are always here for you'}],columns:'3'}},
      {id:uid(),type:'products',visible:true,style:{bg:'#ffffff',textColor:'#111111',padding:'60',fontFamily:'Inter',borderRadius:'0',maxWidth:'1200'},content:{title:'New Arrivals',titleSize:'32',columns:'4',mobileColumns:'2',cardStyle:'minimal',showPrice:true,showName:true,showBtn:true,limit:'8',featured:false}},
      {id:uid(),type:'banner',visible:true,style:{bg:'#111111',textColor:'#ffffff',padding:'50',fontFamily:'Inter',borderRadius:'0',maxWidth:'1200'},content:{text:'Join 10,000+ happy customers',btnText:'Shop Now',btnLink:'#products',fontSize:'28',align:'center'}},
      {id:uid(),type:'testimonials',visible:true,style:{bg:'#fafafa',textColor:'#333333',padding:'60',fontFamily:'Inter',borderRadius:'0',maxWidth:'1000'},content:{title:'What People Say',titleSize:'28',items:[{name:'Amira K.',text:'The quality exceeded my expectations. Packaging was beautiful too.',rating:5},{name:'Sofiane M.',text:'Fast delivery to Oran. Will definitely order again.',rating:5},{name:'Lina B.',text:'Finally a store that delivers on time. Love it!',rating:4}]}},
  ]},
  {name:'Bold & Dark',desc:'Dark theme, neon accents, high contrast',colors:['#0a0a0a','#22d3ee','#111111'],
    sections:[
      {id:uid(),type:'hero',visible:true,style:{bg:'#0a0a0a',textColor:'#ffffff',padding:'80',fontFamily:'Montserrat',borderRadius:'0',maxWidth:'1200'},content:{title:'STAND OUT.',subtitle:'Bold products for bold people. Algerian quality, worldwide standards.',btnText:'SHOP NOW',btnLink:'#products',titleSize:'72',subtitleSize:'16',btnColor:'#22d3ee',bgImage:'',overlay:'0',align:'center',height:'600'}},
      {id:uid(),type:'features',visible:true,style:{bg:'#111111',textColor:'#e5e5e5',padding:'40',fontFamily:'Montserrat',borderRadius:'0',maxWidth:'1000'},content:{items:[{icon:'⚡',title:'FAST DELIVERY',desc:'48h across Algeria'},{icon:'🛡️',title:'SECURE PAYMENT',desc:'CCP, BaridiMob, COD'},{icon:'🔄',title:'FREE RETURNS',desc:'No questions asked'}],columns:'3'}},
      {id:uid(),type:'products',visible:true,style:{bg:'#0a0a0a',textColor:'#ffffff',padding:'60',fontFamily:'Montserrat',borderRadius:'0',maxWidth:'1200'},content:{title:'TRENDING NOW',titleSize:'36',columns:'4',mobileColumns:'2',cardStyle:'border',showPrice:true,showName:true,showBtn:true,limit:'8',featured:false}},
      {id:uid(),type:'banner',visible:true,style:{bg:'#22d3ee',textColor:'#0a0a0a',padding:'40',fontFamily:'Montserrat',borderRadius:'0',maxWidth:'1200'},content:{text:'LIMITED DROP — 30% OFF EVERYTHING',btnText:'GRAB YOURS',btnLink:'#products',fontSize:'26',align:'center'}},
      {id:uid(),type:'text',visible:true,style:{bg:'#111111',textColor:'#a3a3a3',padding:'50',fontFamily:'Montserrat',borderRadius:'0',maxWidth:'700'},content:{text:'We believe every Algerian deserves access to premium products without the premium markup. That is our promise.',fontSize:'18',lineHeight:'1.8',align:'center',maxWidth:'700'}},
      {id:uid(),type:'testimonials',visible:true,style:{bg:'#0a0a0a',textColor:'#e5e5e5',padding:'60',fontFamily:'Montserrat',borderRadius:'0',maxWidth:'1000'},content:{title:'CUSTOMER REVIEWS',titleSize:'28',items:[{name:'Yacine',text:'The dark packaging matches the vibe. 10/10 unboxing.',rating:5},{name:'Rania',text:'Ordered at midnight, arrived next day. Incredible.',rating:5},{name:'Karim',text:'Best online store in Algeria. Period.',rating:5}]}},
  ]},
  {name:'Boutique Elegant',desc:'Luxury fashion feel, serif fonts, soft tones',colors:['#faf8f5','#8b6f47','#ffffff'],
    sections:[
      {id:uid(),type:'hero',visible:true,style:{bg:'#faf8f5',textColor:'#2c1810',padding:'90',fontFamily:'Playfair Display',borderRadius:'0',maxWidth:'1200'},content:{title:'Timeless Elegance',subtitle:'Curated collections for the refined taste. Handcrafted with passion.',btnText:'Discover',btnLink:'#products',titleSize:'56',subtitleSize:'16',btnColor:'#8b6f47',bgImage:'',overlay:'0',align:'center',height:'520'}},
      {id:uid(),type:'text',visible:true,style:{bg:'#ffffff',textColor:'#5c4a3a',padding:'50',fontFamily:'Lora',borderRadius:'0',maxWidth:'700'},content:{text:'Each piece in our collection tells a story. We work with local artisans to bring you products that blend tradition with contemporary design.',fontSize:'17',lineHeight:'1.9',align:'center',maxWidth:'650'}},
      {id:uid(),type:'products',visible:true,style:{bg:'#faf8f5',textColor:'#2c1810',padding:'60',fontFamily:'Playfair Display',borderRadius:'0',maxWidth:'1100'},content:{title:'The Collection',titleSize:'34',columns:'3',mobileColumns:'2',cardStyle:'flat',showPrice:true,showName:true,showBtn:false,limit:'6',featured:false}},
      {id:uid(),type:'banner',visible:true,style:{bg:'#8b6f47',textColor:'#ffffff',padding:'50',fontFamily:'Playfair Display',borderRadius:'0',maxWidth:'1200'},content:{text:'New Season — Now Available',btnText:'View Lookbook',btnLink:'#products',fontSize:'30',align:'center'}},
      {id:uid(),type:'features',visible:true,style:{bg:'#ffffff',textColor:'#5c4a3a',padding:'50',fontFamily:'Lora',borderRadius:'0',maxWidth:'900'},content:{items:[{icon:'🎁',title:'Gift Wrapping',desc:'Complimentary on all orders'},{icon:'✨',title:'Artisan Made',desc:'Locally sourced materials'},{icon:'💌',title:'Personal Touch',desc:'Handwritten note included'}],columns:'3'}},
      {id:uid(),type:'testimonials',visible:true,style:{bg:'#faf8f5',textColor:'#2c1810',padding:'60',fontFamily:'Lora',borderRadius:'0',maxWidth:'1000'},content:{title:'Client Stories',titleSize:'30',items:[{name:'Nadia L.',text:'The packaging alone made me feel special. Beautiful products.',rating:5},{name:'Farid H.',text:'Bought a gift for my wife. She absolutely loved it.',rating:5},{name:'Salima R.',text:'Quality you can feel. Not your average online store.',rating:5}]}},
  ]},
  {name:'Fresh & Vibrant',desc:'Colorful, energetic, perfect for young brands',colors:['#fef3c7','#ef4444','#fdf2f8'],
    sections:[
      {id:uid(),type:'hero',visible:true,style:{bg:'#fef3c7',textColor:'#1e1b4b',padding:'70',fontFamily:'Poppins',borderRadius:'0',maxWidth:'1200'},content:{title:'Hey there! 👋',subtitle:'Fresh products, fast delivery, zero hassle. Welcome to your new favorite store!',btnText:'Let\'s Go! →',btnLink:'#products',titleSize:'52',subtitleSize:'18',btnColor:'#ef4444',bgImage:'',overlay:'0',align:'center',height:'480'}},
      {id:uid(),type:'features',visible:true,style:{bg:'#ffffff',textColor:'#374151',padding:'40',fontFamily:'Poppins',borderRadius:'0',maxWidth:'1000'},content:{items:[{icon:'🚀',title:'Super Fast',desc:'Delivery in 24-48h'},{icon:'💯',title:'100% Original',desc:'No fakes, ever'},{icon:'🎉',title:'Weekly Deals',desc:'New offers every Friday'},{icon:'💬',title:'Live Chat',desc:'We reply in minutes'}],columns:'4'}},
      {id:uid(),type:'products',visible:true,style:{bg:'#fdf2f8',textColor:'#1e1b4b',padding:'60',fontFamily:'Poppins',borderRadius:'0',maxWidth:'1200'},content:{title:'Hot Right Now 🔥',titleSize:'30',columns:'4',mobileColumns:'2',cardStyle:'shadow',showPrice:true,showName:true,showBtn:true,limit:'8',featured:false}},
      {id:uid(),type:'banner',visible:true,style:{bg:'#ef4444',textColor:'#ffffff',padding:'40',fontFamily:'Poppins',borderRadius:'16',maxWidth:'1100'},content:{text:'🎁 Use code WELCOME for 15% OFF!',btnText:'Claim Now',btnLink:'#products',fontSize:'22',align:'center'}},
      {id:uid(),type:'products',visible:true,style:{bg:'#ffffff',textColor:'#1e1b4b',padding:'60',fontFamily:'Poppins',borderRadius:'0',maxWidth:'1200'},content:{title:'Best Sellers ⭐',titleSize:'30',columns:'3',mobileColumns:'2',cardStyle:'shadow',showPrice:true,showName:true,showBtn:true,limit:'6',featured:true}},
      {id:uid(),type:'testimonials',visible:true,style:{bg:'#fef3c7',textColor:'#1e1b4b',padding:'50',fontFamily:'Poppins',borderRadius:'0',maxWidth:'1000'},content:{title:'Happy Customers 💛',titleSize:'28',items:[{name:'Amine',text:'Super fast delivery and exactly as shown. Will buy again!',rating:5},{name:'Meriem',text:'Love the packaging and the little thank you card inside 😍',rating:5},{name:'Bilal',text:'Best prices anywhere. Already on my 3rd order.',rating:5}]}},
  ]},
  {name:'Professional Store',desc:'Clean business layout, trust-focused, high conversion',colors:['#1e3a5f','#2563eb','#f8fafc'],
    sections:[
      {id:uid(),type:'hero',visible:true,style:{bg:'#1e3a5f',textColor:'#ffffff',padding:'80',fontFamily:'Inter',borderRadius:'0',maxWidth:'1200'},content:{title:'Quality You Can Trust',subtitle:'Algeria\'s most reliable online store. Over 50,000 orders delivered.',btnText:'Browse Products',btnLink:'#products',titleSize:'48',subtitleSize:'17',btnColor:'#2563eb',bgImage:'',overlay:'0',align:'center',height:'500'}},
      {id:uid(),type:'features',visible:true,style:{bg:'#ffffff',textColor:'#1e293b',padding:'50',fontFamily:'Inter',borderRadius:'0',maxWidth:'1100'},content:{items:[{icon:'🏆',title:'#1 Rated',desc:'4.9/5 from 2000+ reviews'},{icon:'📦',title:'58 Wilayas',desc:'We deliver everywhere'},{icon:'💳',title:'Flexible Payment',desc:'CCP, BaridiMob, COD'},{icon:'🔒',title:'Buyer Protection',desc:'Full refund guarantee'}],columns:'4'}},
      {id:uid(),type:'products',visible:true,style:{bg:'#f8fafc',textColor:'#1e293b',padding:'60',fontFamily:'Inter',borderRadius:'0',maxWidth:'1200'},content:{title:'Featured Products',titleSize:'28',columns:'4',mobileColumns:'2',cardStyle:'shadow',showPrice:true,showName:true,showBtn:true,limit:'8',featured:false}},
      {id:uid(),type:'banner',visible:true,style:{bg:'#2563eb',textColor:'#ffffff',padding:'45',fontFamily:'Inter',borderRadius:'0',maxWidth:'1200'},content:{text:'Free shipping on orders over 5000 DZD',btnText:'Start Shopping',btnLink:'#products',fontSize:'24',align:'center'}},
      {id:uid(),type:'text',visible:true,style:{bg:'#ffffff',textColor:'#475569',padding:'50',fontFamily:'Inter',borderRadius:'0',maxWidth:'800'},content:{text:'We started with a simple idea: Algerians deserve a shopping experience that is fast, reliable, and fair. Every product is quality-checked. Every order is tracked. Every customer matters.',fontSize:'16',lineHeight:'1.8',align:'center',maxWidth:'700'}},
      {id:uid(),type:'testimonials',visible:true,style:{bg:'#f8fafc',textColor:'#1e293b',padding:'60',fontFamily:'Inter',borderRadius:'0',maxWidth:'1000'},content:{title:'Customer Reviews',titleSize:'28',items:[{name:'Mohamed A.',text:'Professional service. Package arrived well-packed and on time.',rating:5},{name:'Djamila F.',text:'Ordering for 6 months. Never a single issue.',rating:5},{name:'Omar T.',text:'Support responded in 5 minutes. Very impressed.',rating:5}]}},
  ]},
  {name:'عربي أنيق',desc:'تصميم عربي أنيق مع خط Cairo وألوان دافئة',colors:['#fefce8','#b45309','#fffbeb'],
    sections:[
      {id:uid(),type:'hero',visible:true,style:{bg:'#fefce8',textColor:'#451a03',padding:'80',fontFamily:'Cairo',borderRadius:'0',maxWidth:'1200'},content:{title:'أهلاً وسهلاً بكم',subtitle:'منتجات جزائرية أصيلة بجودة عالية وأسعار مناسبة',btnText:'تسوّق الآن',btnLink:'#products',titleSize:'52',subtitleSize:'18',btnColor:'#b45309',bgImage:'',overlay:'0',align:'center',height:'500'}},
      {id:uid(),type:'features',visible:true,style:{bg:'#fffbeb',textColor:'#78350f',padding:'40',fontFamily:'Cairo',borderRadius:'0',maxWidth:'1000'},content:{items:[{icon:'🚚',title:'توصيل سريع',desc:'لجميع الولايات 58'},{icon:'💰',title:'أسعار مميزة',desc:'أفضل الأسعار في السوق'},{icon:'✅',title:'جودة مضمونة',desc:'منتجات أصلية 100%'}],columns:'3'}},
      {id:uid(),type:'products',visible:true,style:{bg:'#ffffff',textColor:'#451a03',padding:'60',fontFamily:'Cairo',borderRadius:'0',maxWidth:'1200'},content:{title:'المنتجات المميزة',titleSize:'32',columns:'4',mobileColumns:'2',cardStyle:'shadow',showPrice:true,showName:true,showBtn:true,limit:'8',featured:false}},
      {id:uid(),type:'banner',visible:true,style:{bg:'#b45309',textColor:'#ffffff',padding:'45',fontFamily:'Cairo',borderRadius:'0',maxWidth:'1200'},content:{text:'🎉 خصم 20% على أول طلب',btnText:'اطلب الآن',btnLink:'#products',fontSize:'26',align:'center'}},
      {id:uid(),type:'testimonials',visible:true,style:{bg:'#fefce8',textColor:'#451a03',padding:'60',fontFamily:'Cairo',borderRadius:'0',maxWidth:'1000'},content:{title:'آراء العملاء',titleSize:'30',items:[{name:'أحمد',text:'جودة ممتازة وتوصيل سريع. شكراً لكم',rating:5},{name:'فاطمة',text:'أحسن متجر إلكتروني في الجزائر',rating:5},{name:'ياسين',text:'المنتجات طابقة للصور تماماً. ممتاز',rating:5}]}},
  ]},
];

const defaultSection=(type)=>{
  const base={id:uid(),type,visible:true,style:{bg:'#ffffff',textColor:'#1f2937',padding:'60',fontFamily:'Inter',borderRadius:'0',maxWidth:'1200'}};
  const defs={hero:{title:'Welcome',subtitle:'Discover amazing products',btnText:'Shop Now',btnLink:'#products',titleSize:'48',subtitleSize:'20',btnColor:'#7C3AED',bgImage:'',overlay:'0.3',align:'center',height:'500'},products:{title:'Our Products',titleSize:'28',columns:'4',mobileColumns:'2',cardStyle:'shadow',showPrice:true,showName:true,showBtn:true,limit:'8',featured:false},text:{text:'Add your content here.',fontSize:'16',lineHeight:'1.7',align:'left',maxWidth:'800'},image:{src:'',alt:'',width:'100',height:'auto',align:'center',rounded:'12',link:''},banner:{text:'Special Offer!',btnText:'Shop Now',btnLink:'#',fontSize:'24',align:'center'},spacer:{height:'60'},features:{items:[{icon:'🚚',title:'Fast Delivery',desc:'All 58 wilayas'},{icon:'💳',title:'Secure Payment',desc:'Multiple options'},{icon:'🔄',title:'Easy Returns',desc:'30-day policy'}],columns:'3'},testimonials:{title:'What Customers Say',titleSize:'28',items:[{name:'Ahmed',text:'Great quality!',rating:5},{name:'Sara',text:'Best prices!',rating:5}]},custom_html:{html:'<div style="text-align:center;padding:20px;"><h2>Custom Section</h2></div>'}};
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
    {section.type==='hero'&&<><hr/><p className="text-[10px] font-bold text-brand-500 uppercase">Hero</p><div><p className="text-[10px] text-gray-400">Title</p><input className="input-field !py-1 text-xs" value={c.title||''} onChange={e=>setC('title',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Subtitle</p><input className="input-field !py-1 text-xs" value={c.subtitle||''} onChange={e=>setC('subtitle',e.target.value)}/></div><div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Title Size</p><input type="number" className="input-field !py-1 text-xs" value={c.titleSize||'48'} onChange={e=>setC('titleSize',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Sub Size</p><input type="number" className="input-field !py-1 text-xs" value={c.subtitleSize||'20'} onChange={e=>setC('subtitleSize',e.target.value)}/></div></div><div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Button</p><input className="input-field !py-1 text-xs" value={c.btnText||''} onChange={e=>setC('btnText',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Btn Color</p><div className="flex gap-1"><input type="color" className="w-6 h-6 rounded" value={c.btnColor||'#7C3AED'} onChange={e=>setC('btnColor',e.target.value)}/><input className="input-field flex-1 !py-0.5 text-[10px]" value={c.btnColor||''} onChange={e=>setC('btnColor',e.target.value)}/></div></div></div><div><p className="text-[10px] text-gray-400">Height</p><input type="number" className="input-field !py-1 text-xs" value={c.height||'500'} onChange={e=>setC('height',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">BG Image</p><input className="input-field !py-1 text-xs" value={c.bgImage||''} onChange={e=>setC('bgImage',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Align</p><div className="flex gap-1">{['left','center','right'].map(a=><button key={a} onClick={()=>setC('align',a)} className={`flex-1 py-1 rounded text-xs font-bold ${c.align===a?'bg-brand-500 text-white':'bg-gray-100'}`}>{a}</button>)}</div></div></>}
    {section.type==='products'&&<><hr/><p className="text-[10px] font-bold text-brand-500 uppercase">Products</p><div><p className="text-[10px] text-gray-400">Title</p><input className="input-field !py-1 text-xs" value={c.title||''} onChange={e=>setC('title',e.target.value)}/></div><div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Columns</p><select className="input-field !py-1 text-xs" value={c.columns||'4'} onChange={e=>setC('columns',e.target.value)}><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></div><div><p className="text-[10px] text-gray-400">Limit</p><input type="number" className="input-field !py-1 text-xs" value={c.limit||'8'} onChange={e=>setC('limit',e.target.value)}/></div></div><div><p className="text-[10px] text-gray-400">Card Style</p><select className="input-field !py-1 text-xs" value={c.cardStyle||'shadow'} onChange={e=>setC('cardStyle',e.target.value)}><option value="shadow">Shadow</option><option value="border">Border</option><option value="flat">Flat</option><option value="minimal">Minimal</option></select></div><label className="flex items-center gap-2"><input type="checkbox" checked={c.showPrice!==false} onChange={e=>setC('showPrice',e.target.checked)}/><span className="text-xs">Price</span></label><label className="flex items-center gap-2"><input type="checkbox" checked={c.showBtn!==false} onChange={e=>setC('showBtn',e.target.checked)}/><span className="text-xs">Cart btn</span></label><label className="flex items-center gap-2"><input type="checkbox" checked={c.featured||false} onChange={e=>setC('featured',e.target.checked)}/><span className="text-xs">Featured only</span></label></>}
    {section.type==='text'&&<><hr/><div><p className="text-[10px] text-gray-400">Content</p><textarea className="input-field !py-1 text-xs" rows={4} value={c.text||''} onChange={e=>setC('text',e.target.value)}/></div><div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Size</p><input type="number" className="input-field !py-1 text-xs" value={c.fontSize||'16'} onChange={e=>setC('fontSize',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Line H</p><input className="input-field !py-1 text-xs" value={c.lineHeight||'1.7'} onChange={e=>setC('lineHeight',e.target.value)}/></div></div><div><p className="text-[10px] text-gray-400">Align</p><div className="flex gap-1">{['left','center','right'].map(a=><button key={a} onClick={()=>setC('align',a)} className={`flex-1 py-1 rounded text-xs font-bold ${c.align===a?'bg-brand-500 text-white':'bg-gray-100'}`}>{a}</button>)}</div></div></>}
    {section.type==='image'&&<><hr/><div><p className="text-[10px] text-gray-400">Image URL</p><input className="input-field !py-1 text-xs" value={c.src||''} onChange={e=>setC('src',e.target.value)}/></div><div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Width %</p><input type="number" className="input-field !py-1 text-xs" value={c.width||'100'} onChange={e=>setC('width',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Rounded</p><input type="number" className="input-field !py-1 text-xs" value={c.rounded||'12'} onChange={e=>setC('rounded',e.target.value)}/></div></div></>}
    {section.type==='banner'&&<><hr/><div><p className="text-[10px] text-gray-400">Text</p><input className="input-field !py-1 text-xs" value={c.text||''} onChange={e=>setC('text',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Font Size</p><input type="number" className="input-field !py-1 text-xs" value={c.fontSize||'24'} onChange={e=>setC('fontSize',e.target.value)}/></div><div className="grid grid-cols-2 gap-2"><div><p className="text-[10px] text-gray-400">Button</p><input className="input-field !py-1 text-xs" value={c.btnText||''} onChange={e=>setC('btnText',e.target.value)}/></div><div><p className="text-[10px] text-gray-400">Link</p><input className="input-field !py-1 text-xs" value={c.btnLink||''} onChange={e=>setC('btnLink',e.target.value)}/></div></div></>}
    {section.type==='spacer'&&<div><p className="text-[10px] text-gray-400">Height</p><input type="number" className="input-field !py-1 text-xs" value={c.height||'60'} onChange={e=>setC('height',e.target.value)}/></div>}
    {section.type==='features'&&<><hr/><div><p className="text-[10px] text-gray-400">Columns</p><select className="input-field !py-1 text-xs" value={c.columns||'3'} onChange={e=>setC('columns',e.target.value)}><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div>{(c.items||[]).map((it,i)=><div key={i} className="p-2 bg-gray-50 rounded-lg space-y-1"><div className="flex gap-1"><input className="input-field !py-0.5 text-xs w-10" value={it.icon||''} onChange={e=>{const a=[...c.items];a[i]={...a[i],icon:e.target.value};setC('items',a);}}/><input className="input-field !py-0.5 text-xs flex-1" value={it.title||''} onChange={e=>{const a=[...c.items];a[i]={...a[i],title:e.target.value};setC('items',a);}}/><button onClick={()=>{const a=[...c.items];a.splice(i,1);setC('items',a);}} className="text-red-400"><X size={12}/></button></div><input className="input-field !py-0.5 text-xs" value={it.desc||''} onChange={e=>{const a=[...c.items];a[i]={...a[i],desc:e.target.value};setC('items',a);}}/></div>)}<button onClick={()=>setC('items',[...(c.items||[]),{icon:'⭐',title:'Feature',desc:'Desc'}])} className="text-xs text-brand-600 font-bold">+ Add</button></>}
    {section.type==='testimonials'&&<><hr/><div><p className="text-[10px] text-gray-400">Title</p><input className="input-field !py-1 text-xs" value={c.title||''} onChange={e=>setC('title',e.target.value)}/></div>{(c.items||[]).map((it,i)=><div key={i} className="p-2 bg-gray-50 rounded-lg space-y-1"><div className="flex gap-1"><input className="input-field !py-0.5 text-xs w-20" value={it.name||''} onChange={e=>{const a=[...c.items];a[i]={...a[i],name:e.target.value};setC('items',a);}}/><select className="input-field !py-0.5 text-xs w-14" value={it.rating||5} onChange={e=>{const a=[...c.items];a[i]={...a[i],rating:parseInt(e.target.value)};setC('items',a);}}><option value={5}>5★</option><option value={4}>4★</option><option value={3}>3★</option></select><button onClick={()=>{const a=[...c.items];a.splice(i,1);setC('items',a);}} className="text-red-400"><X size={12}/></button></div><textarea className="input-field !py-0.5 text-xs" rows={2} value={it.text||''} onChange={e=>{const a=[...c.items];a[i]={...a[i],text:e.target.value};setC('items',a);}}/></div>)}<button onClick={()=>setC('items',[...(c.items||[]),{name:'Customer',text:'Great!',rating:5}])} className="text-xs text-brand-600 font-bold">+ Add</button></>}
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
  return null;
}

export default function AdvancedBuilder(){
  const{currentStore,setCurrentStore}=useStoreManagement();
  const[sections,setSections]=useState([]);
  const[selected,setSelected]=useState(null);
  const[showAdd,setShowAdd]=useState(false);
  const[showTemplates,setShowTemplates]=useState(false);
  const[saving,setSaving]=useState(false);
  const[preview,setPreview]=useState('desktop');
  const[dirty,setDirty]=useState(false);

  useEffect(()=>{
    if(!currentStore)return;
    const cfg=currentStore.config||{};
    if(cfg.page_builder&&Array.isArray(cfg.page_builder)&&cfg.page_builder.length>0)setSections(cfg.page_builder);
    else{setSections([]);setShowTemplates(true);}
  },[currentStore?.id]);

  const upd=(i,s)=>{const n=[...sections];n[i]=s;setSections(n);setDirty(true);};
  const move=(i,d)=>{const n=[...sections];[n[i],n[i+d]]=[n[i+d],n[i]];setSections(n);setSelected(i+d);setDirty(true);};
  const rm=(i)=>{setSections(sections.filter((_,j)=>j!==i));if(selected===i)setSelected(null);setDirty(true);};
  const dup=(i)=>{const s={...JSON.parse(JSON.stringify(sections[i])),id:uid()};const n=[...sections];n.splice(i+1,0,s);setSections(n);setDirty(true);};
  const add=(type)=>{setSections([...sections,defaultSection(type)]);setSelected(sections.length);setShowAdd(false);setDirty(true);};
  const toggle=(i)=>{const n=[...sections];n[i]={...n[i],visible:!n[i].visible};setSections(n);setDirty(true);};
  const applyTemplate=(t)=>{const fresh=JSON.parse(JSON.stringify(t.sections)).map(s=>({...s,id:uid()}));setSections(fresh);setSelected(null);setShowTemplates(false);setDirty(true);toast.success(`"${t.name}" template applied!`);};
  const save=async()=>{setSaving(true);try{const{data}=await ownerApi.updateStore(currentStore.id,{page_builder:sections});setCurrentStore(data);setDirty(false);toast.success('Saved!');}catch{toast.error('Failed');}setSaving(false);};

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-4">
      <div><h1 className="text-2xl font-bold">Page Builder</h1><p className="text-sm text-gray-400 mt-1">Build your storefront exactly how you want</p></div>
      <div className="flex items-center gap-2">
        <button onClick={()=>setShowTemplates(true)} className="px-3 py-2 bg-purple-50 text-purple-600 rounded-xl text-sm font-bold flex items-center gap-1.5 hover:bg-purple-100"><Layers size={14}/>Templates</button>
        <div className="flex bg-gray-100 rounded-lg p-0.5"><button onClick={()=>setPreview('desktop')} className={`p-1.5 rounded-md ${preview==='desktop'?'bg-white shadow-sm':'text-gray-400'}`}><Monitor size={14}/></button><button onClick={()=>setPreview('mobile')} className={`p-1.5 rounded-md ${preview==='mobile'?'bg-white shadow-sm':'text-gray-400'}`}><Smartphone size={14}/></button></div>
        <button onClick={save} disabled={saving||!dirty} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"><Save size={14}/>{saving?'Saving...':'Save'}</button>
      </div>
    </div>

    <div className="flex gap-4" style={{height:'calc(100vh - 160px)'}}>
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

      <div className="flex-1 bg-gray-100 rounded-2xl overflow-y-auto p-3">
        <div className={`mx-auto bg-white rounded-xl shadow-sm overflow-hidden ${preview==='mobile'?'max-w-[375px]':'max-w-[900px]'}`}>
          {sections.filter(s=>s.visible).length===0?<div className="py-16 text-center"><Layers size={36} className="mx-auto text-gray-300 mb-3"/><p className="text-sm text-gray-400 mb-3">No sections yet</p><button onClick={()=>setShowTemplates(true)} className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-bold">Choose a Template</button></div>:
          sections.filter(s=>s.visible).map(sec=>(
            <div key={sec.id} onClick={()=>setSelected(sections.indexOf(sec))} className={`cursor-pointer transition-all ${selected===sections.indexOf(sec)?'ring-2 ring-brand-400 ring-inset':''}`}><Preview section={sec}/></div>
          ))}
        </div>
      </div>

      <div className="w-64 shrink-0 bg-white rounded-2xl border border-gray-200 overflow-y-auto p-3">
        {selected!==null&&sections[selected]?<div>
          <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-xs text-gray-900">{SECTION_TYPES.find(t=>t.type===sections[selected].type)?.label||'Section'}</h3><button onClick={()=>setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X size={12}/></button></div>
          <StylePanel section={sections[selected]} onChange={s=>upd(selected,s)}/>
        </div>:<div className="text-center py-10"><Layout size={28} className="mx-auto text-gray-300 mb-2"/><p className="text-xs text-gray-400">Click a section to edit</p></div>}
      </div>
    </div>

    {/* Add Section Modal */}
    {showAdd&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowAdd(false)}><div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold">Add Section</h2><button onClick={()=>setShowAdd(false)}><X size={18}/></button></div>
      <div className="space-y-1.5">{SECTION_TYPES.map(t=>{const Icon=t.icon;return<button key={t.type} onClick={()=>add(t.type)} className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-brand-400 text-left flex items-center gap-3 transition-all"><div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0"><Icon size={16} className="text-brand-500"/></div><div><p className="font-bold text-sm text-gray-900">{t.label}</p><p className="text-[10px] text-gray-400">{t.desc}</p></div></button>;})}</div>
    </div></div>}

    {/* Templates Modal */}
    {showTemplates&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={()=>setShowTemplates(false)}><div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between mb-5"><div><h2 className="text-xl font-bold">Choose a Template</h2><p className="text-sm text-gray-400 mt-1">Pick a design and customize it your way</p></div><button onClick={()=>setShowTemplates(false)}><X size={20}/></button></div>
      <div className="grid grid-cols-2 gap-4">
        {TEMPLATES.map((t,ti)=>(
          <button key={ti} onClick={()=>{if(sections.length>0&&!confirm('This will replace your current page. Continue?'))return;applyTemplate(t);}} className="text-left rounded-2xl border-2 border-gray-200 hover:border-brand-400 overflow-hidden transition-all hover:shadow-lg group">
            {/* Mini preview */}
            <div className="h-36 overflow-hidden relative">
              <div className="transform scale-[0.25] origin-top-left w-[400%]">
                {t.sections.filter(s=>s.visible).slice(0,3).map((sec,si)=><Preview key={si} section={sec}/>)}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent"/>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-gray-900">{t.name}</p>
                <div className="flex gap-1 ml-auto">{t.colors.map((c,ci)=><div key={ci} style={{backgroundColor:c}} className="w-4 h-4 rounded-full border border-gray-200"/>)}</div>
              </div>
              <p className="text-xs text-gray-400">{t.desc}</p>
              <p className="text-[10px] text-brand-500 font-bold mt-2">{t.sections.length} sections</p>
            </div>
          </button>
        ))}
      </div>
      {sections.length===0&&<p className="text-center text-xs text-gray-400 mt-4">You can fully customize any template after applying it</p>}
    </div></div>}
  </DashboardLayout>);
}
