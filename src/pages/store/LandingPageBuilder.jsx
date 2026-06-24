import React,{useState,useEffect,useRef,useCallback}from'react';
import{useTranslation}from'react-i18next';
import DashboardLayout from'../../components/shared/DashboardLayout';
import{useStoreManagement}from'../../hooks/useStore';
import{productApi,ownerApi}from'../../utils/api';
import toast from'react-hot-toast';
import{Rocket,Plus,Trash2,ChevronDown,ChevronUp,Eye,Copy,Settings,Type,Palette,Save,ExternalLink,Package,Wand2,GripVertical,Image,Layout,Zap,ToggleLeft,ToggleRight,Timer,Star,Sparkles,Globe,MousePointer,Layers,RefreshCw,Pipette,Shield,Brain,X}from'lucide-react';
import{aiApi}from'../../utils/api';

/* ═══ BLOCK PALETTE — addable section blocks for the page builder (use the
   injected .lp-* design system; text is inline-editable, images click-to-replace) */
const _CK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const _TRUCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h13v10H3z"/><path d="M16 10h4l1 3v4h-5"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>';
const _GRAD="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='12'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23e9e9ef'/%3E%3Cstop offset='1' stop-color='%23d7d7e0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='16' height='12' fill='url(%23g)'/%3E%3C/svg%3E";
const PB_PALETTE=[
  {label:'Heading',icon:Type,make:()=>`<section class="lp-section"><div class="lp-wrap"><div class="lp-head"><span class="lp-eyebrow">قسم</span><h2 class="lp-h2">عنوان جديد</h2><p class="lp-sub">اكتب وصفاً هنا</p></div></div></section>`},
  {label:'Benefits',icon:Sparkles,make:()=>`<section class="lp-section"><div class="lp-wrap"><div class="lp-head"><h2 class="lp-h2">المميزات</h2></div><div class="lp-bens">${[0,0,0,0].map(()=>`<div class="lp-ben"><div class="lp-icn">${_CK}</div><h3>ميزة:</h3><p>وصف الميزة</p></div>`).join('')}</div></div></section>`},
  {label:'Checklist',icon:Layout,make:()=>`<section class="lp-section" style="background:#fff"><div class="lp-wrap"><div class="lp-feature"><div><h3 class="lp-h3">عنوان الميزة</h3><ul class="lp-checks"><li>نقطة أولى</li><li>نقطة ثانية</li><li>نقطة ثالثة</li></ul></div><div class="lp-feature-media"><div class="lp-pframe" style="aspect-ratio:4/3;box-shadow:none;border:0"><img src="${_GRAD}" alt=""></div></div></div></div></section>`},
  {label:'Image band',icon:Image,make:()=>`<section class="lp-section"><div class="lp-wrap"><div class="lp-band"><img src="${_GRAD}" alt=""><div class="lp-band-in"><h2 class="lp-h2">عنوان</h2><p class="lp-lead" style="color:#fff;margin-inline:auto">نص تسويقي قصير</p></div></div></div></section>`},
  {label:'Delivery',icon:Package,make:()=>`<section class="lp-section"><div class="lp-wrap"><div class="lp-cod"><div class="lp-cod-ic">${_TRUCK}</div><div><h3>الدفع عند الاستلام</h3><p>توصيل سريع لكل ولايات الجزائر.</p></div></div></div></section>`},
  {label:'How to order',icon:Layers,make:()=>`<section class="lp-section" style="background:#fff"><div class="lp-wrap"><div class="lp-head"><h2 class="lp-h2">كيف تطلب</h2></div><div class="lp-steps"><div class="lp-step"><h3>اختر المنتج</h3><p>اختر المنتج والكمية</p></div><div class="lp-step"><h3>أدخل معلوماتك</h3><p>الاسم والهاتف والولاية</p></div><div class="lp-step"><h3>استلم وادفع</h3><p>تدفع عند الاستلام</p></div></div></div></section>`},
  {label:'FAQ',icon:MousePointer,make:()=>`<section class="lp-section"><div class="lp-wrap"><div class="lp-head"><h2 class="lp-h2">أسئلة شائعة</h2></div><div class="lp-faq"><details open><summary>سؤالك هنا؟</summary><p>الجواب هنا.</p></details><details><summary>سؤال آخر؟</summary><p>الجواب هنا.</p></details></div></div></section>`},
  {label:'CTA',icon:Zap,make:(pid)=>`<section class="lp-section"><div class="lp-wrap"><div class="lp-final"><h2 class="lp-h2">احصل عليه اليوم</h2><p>اطلب الآن وادفع عند الاستلام.</p><button class="lp-btn lp-btn-xl" data-order data-add-product="${pid}">اطلب الآن</button></div></div></section>`},
  {label:'Divider',icon:Star,make:()=>`<section class="lp-section" style="padding:14px 0"><div class="lp-wrap"><div class="lp-divider"><span class="lp-chip">الدفع عند الاستلام</span><span class="lp-chip">توصيل سريع</span></div></div></section>`},
];

/* ═══════════════════════════════════════════════════════════════════════
   COLOR EXTRACTION + SMART THEME ENGINE
   Extracts dominant colors from product images, then generates a unique
   harmonious palette per landing page using UI/UX design principles:
   - 60-30-10 color rule (bg-accent-CTA)
   - WCAG contrast ratios for text readability
   - Complementary / analogous / triadic harmony options
   ═══════════════════════════════════════════════════════════════════════ */

// Extract dominant colors from an image URL via canvas sampling
function extractColors(imgUrl){
  return new Promise((resolve)=>{
    if(!imgUrl){resolve([]);return;}
    const img=new window.Image();
    img.crossOrigin='anonymous';
    img.onload=()=>{
      try{
        const canvas=document.createElement('canvas');
        const size=64; // sample at 64×64 for speed
        canvas.width=size;canvas.height=size;
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,size,size);
        const data=ctx.getImageData(0,0,size,size).data;
        // Bucket colors into 8×8×8 grid
        const buckets={};
        for(let i=0;i<data.length;i+=4){
          const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
          if(a<128)continue; // skip transparent
          const kr=Math.round(r/32)*32,kg=Math.round(g/32)*32,kb=Math.round(b/32)*32;
          const key=`${kr},${kg},${kb}`;
          if(!buckets[key])buckets[key]={r:0,g:0,b:0,count:0};
          buckets[key].r+=r;buckets[key].g+=g;buckets[key].b+=b;buckets[key].count++;
        }
        const sorted=Object.values(buckets).sort((a,b)=>b.count-a.count).slice(0,8);
        const colors=sorted.map(b=>{
          const r=Math.round(b.r/b.count),g=Math.round(b.g/b.count),bl=Math.round(b.b/b.count);
          return{r,g,b:bl,hex:`#${((1<<24)|(r<<16)|(g<<8)|bl).toString(16).slice(1)}`,count:b.count};
        });
        resolve(colors);
      }catch{resolve([]);}
    };
    img.onerror=()=>resolve([]);
    img.src=imgUrl;
  });
}

// Convert RGB to HSL
function rgbToHsl(r,g,b){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){h=s=0;}
  else{
    const d=max-min;
    s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;default:h=((r-g)/d+4)/6;}
  }
  return{h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};
}

// Convert HSL to hex
function hslToHex(h,s,l){
  h=((h%360)+360)%360;s=Math.max(0,Math.min(100,s));l=Math.max(0,Math.min(100,l));
  const a=s/100*Math.min(l/100,1-l/100);
  const f=n=>{const k=(n+h/30)%12;const c=l/100-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c);};
  return `#${((1<<24)|(f(0)<<16)|(f(8)<<8)|f(4)).toString(16).slice(1)}`;
}

// Get relative luminance for contrast checks
function luminance(hex){
  const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const f=c=>c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);
  return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);
}

function contrastRatio(c1,c2){
  const l1=luminance(c1),l2=luminance(c2);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}

// Ensure text color has sufficient contrast (WCAG AA ≥ 4.5:1)
function ensureContrast(bg,preferLight=true){
  if(contrastRatio(bg,'#FFFFFF')>=4.5)return '#FFFFFF';
  if(contrastRatio(bg,'#1F2937')>=4.5)return '#1F2937';
  return preferLight?'#FFFFFF':'#111827';
}

/* ─── 12 CURATED DESIGN PRESETS ───
   Each preset defines a complete visual system following the 60-30-10 rule.
   Presets are scored against extracted image colors to find the best match. */
const THEME_PRESETS=[
  {id:'midnight-gold',name:'Midnight Gold',icon:'🌙',
    hero_bg:'#0F172A',hero_text:'#F8FAFC',cta_bg:'#D97706',cta_text_color:'#FFFFFF',
    bg_color:'#F8FAFC',text_color:'#1E293B',accent_color:'#D97706',
    layout_style:'alternating',hero_style:'centered',animation_style:'slide-up',
    hueRange:[30,50]}, // warm golds
  {id:'ocean-breeze',name:'Ocean Breeze',icon:'🌊',
    hero_bg:'#0C4A6E',hero_text:'#F0F9FF',cta_bg:'#0EA5E9',cta_text_color:'#FFFFFF',
    bg_color:'#F0F9FF',text_color:'#0C4A6E',accent_color:'#0284C7',
    layout_style:'stacked',hero_style:'split',animation_style:'fade',
    hueRange:[190,220]}, // blues
  {id:'sunset-ember',name:'Sunset Ember',icon:'🔥',
    hero_bg:'#431407',hero_text:'#FFF7ED',cta_bg:'#EA580C',cta_text_color:'#FFFFFF',
    bg_color:'#FFF7ED',text_color:'#431407',accent_color:'#DC2626',
    layout_style:'showcase',hero_style:'centered',animation_style:'zoom',
    hueRange:[0,30]}, // reds/oranges
  {id:'emerald-night',name:'Emerald Night',icon:'🌿',
    hero_bg:'#052E16',hero_text:'#F0FDF4',cta_bg:'#16A34A',cta_text_color:'#FFFFFF',
    bg_color:'#F0FDF4',text_color:'#14532D',accent_color:'#059669',
    layout_style:'alternating',hero_style:'split',animation_style:'slide-up',
    hueRange:[120,170]}, // greens
  {id:'royal-purple',name:'Royal Purple',icon:'👑',
    hero_bg:'#2E1065',hero_text:'#FAF5FF',cta_bg:'#9333EA',cta_text_color:'#FFFFFF',
    bg_color:'#FAF5FF',text_color:'#3B0764',accent_color:'#7C3AED',
    layout_style:'stacked',hero_style:'centered',animation_style:'fade',
    hueRange:[260,300]}, // purples
  {id:'rose-gold',name:'Rose Gold',icon:'🌸',
    hero_bg:'#4C0519',hero_text:'#FFF1F2',cta_bg:'#E11D48',cta_text_color:'#FFFFFF',
    bg_color:'#FFF1F2',text_color:'#4C0519',accent_color:'#F43F5E',
    layout_style:'alternating',hero_style:'minimal',animation_style:'slide-up',
    hueRange:[330,360]}, // pinks
  {id:'warm-earth',name:'Warm Earth',icon:'🏜️',
    hero_bg:'#292524',hero_text:'#FAFAF9',cta_bg:'#B45309',cta_text_color:'#FFFFFF',
    bg_color:'#FAFAF9',text_color:'#292524',accent_color:'#A16207',
    layout_style:'stacked',hero_style:'split',animation_style:'fade',
    hueRange:[25,45]}, // ambers/browns
  {id:'arctic-frost',name:'Arctic Frost',icon:'❄️',
    hero_bg:'#1E3A5F',hero_text:'#EFF6FF',cta_bg:'#2563EB',cta_text_color:'#FFFFFF',
    bg_color:'#EFF6FF',text_color:'#1E3A5F',accent_color:'#3B82F6',
    layout_style:'alternating',hero_style:'centered',animation_style:'zoom',
    hueRange:[210,240]}, // cool blues
  {id:'tropical-punch',name:'Tropical Punch',icon:'🍋',
    hero_bg:'#1A1A2E',hero_text:'#FFFBEB',cta_bg:'#F59E0B',cta_text_color:'#1F2937',
    bg_color:'#FFFBEB',text_color:'#1F2937',accent_color:'#EAB308',
    layout_style:'showcase',hero_style:'centered',animation_style:'slide-up',
    hueRange:[45,65]}, // yellows
  {id:'luxe-noir',name:'Luxe Noir',icon:'🖤',
    hero_bg:'#09090B',hero_text:'#FAFAFA',cta_bg:'#A1A1AA',cta_text_color:'#09090B',
    bg_color:'#FAFAFA',text_color:'#18181B',accent_color:'#52525B',
    layout_style:'showcase',hero_style:'minimal',animation_style:'fade',
    hueRange:null}, // neutral - matches grays
  {id:'coral-reef',name:'Coral Reef',icon:'🐚',
    hero_bg:'#1C1917',hero_text:'#FEF2F2',cta_bg:'#FB7185',cta_text_color:'#FFFFFF',
    bg_color:'#FEF2F2',text_color:'#292524',accent_color:'#F472B6',
    layout_style:'alternating',hero_style:'split',animation_style:'slide-up',
    hueRange:[300,340]}, // coral/pink
  {id:'forest-dawn',name:'Forest Dawn',icon:'🌅',
    hero_bg:'#1A2E05',hero_text:'#FEFCE8',cta_bg:'#65A30D',cta_text_color:'#FFFFFF',
    bg_color:'#FEFCE8',text_color:'#1A2E05',accent_color:'#84CC16',
    layout_style:'stacked',hero_style:'split',animation_style:'zoom',
    hueRange:[70,120]}, // lime/yellow-green
];

// Score a preset against extracted image colors (lower = better match)
function scorePreset(preset,dominantColors){
  if(!dominantColors.length)return 999;
  let bestScore=999;
  for(const color of dominantColors.slice(0,5)){
    const hsl=rgbToHsl(color.r,color.g,color.b);
    if(preset.hueRange===null){
      // Neutral preset: prefer low saturation
      const score=hsl.s;
      if(score<bestScore)bestScore=score;
    }else{
      const[minH,maxH]=preset.hueRange;
      let hueDist;
      if(minH<=maxH){
        hueDist=hsl.h>=minH&&hsl.h<=maxH?0:Math.min(Math.abs(hsl.h-minH),Math.abs(hsl.h-maxH),360-Math.abs(hsl.h-minH),360-Math.abs(hsl.h-maxH));
      }else{
        hueDist=(hsl.h>=minH||hsl.h<=maxH)?0:Math.min(Math.abs(hsl.h-minH),Math.abs(hsl.h-maxH));
      }
      // Weight by pixel count — common colors matter more
      const weight=1/(color.count||1);
      const score=hueDist*0.7+(100-hsl.s)*0.3+weight*100;
      if(score<bestScore)bestScore=score;
    }
  }
  return bestScore;
}

// Generate a custom palette from a specific dominant color
function paletteFromColor(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  const hsl=rgbToHsl(r,g,b);
  // Dark hero background: same hue, high saturation, very low lightness
  const heroBg=hslToHex(hsl.h,Math.min(hsl.s+10,90),12);
  const heroText='#FFFFFF';
  // CTA: same hue, vibrant
  const ctaBg=hslToHex(hsl.h,Math.min(hsl.s+15,85),Math.max(Math.min(hsl.l,55),40));
  const ctaText=ensureContrast(ctaBg);
  // Page background: very light tint of the hue
  const bgColor=hslToHex(hsl.h,Math.min(hsl.s,12),97);
  // Text: dark shade of the hue
  const textColor=hslToHex(hsl.h,Math.min(hsl.s,30),15);
  // Accent: the original color adjusted for vibrancy
  const accent=hslToHex(hsl.h,Math.min(hsl.s+10,80),Math.max(Math.min(hsl.l,50),35));
  return{hero_bg:heroBg,hero_text:heroText,cta_bg:ctaBg,cta_text_color:ctaText,bg_color:bgColor,text_color:textColor,accent_color:accent};
}

// Main auto-theme function: extract colors from product images, pick best preset
async function autoGenerateTheme(items,preferredPresetId=null){
  // Gather all product images
  const imageUrls=items.map(it=>it.custom_image||it.image).filter(Boolean);
  if(!imageUrls.length&&!preferredPresetId)return THEME_PRESETS[0]; // fallback

  // Extract colors from first 3 product images
  const allColors=[];
  for(const url of imageUrls.slice(0,3)){
    const colors=await extractColors(url);
    allColors.push(...colors);
  }

  // If a specific preset is requested, use it
  if(preferredPresetId){
    const preset=THEME_PRESETS.find(p=>p.id===preferredPresetId);
    if(preset)return preset;
  }

  // If we extracted colors, score each preset
  if(allColors.length){
    const scored=THEME_PRESETS.map(p=>({...p,score:scorePreset(p,allColors)}));
    scored.sort((a,b)=>a.score-b.score);
    const best=scored[0];
    // Also generate a custom palette from the most dominant color
    const dominantHex=allColors[0].hex;
    const custom=paletteFromColor(dominantHex);
    // If the custom palette has a hue close to best preset, use preset (more polished)
    // Otherwise blend: use custom colors with best preset's layout/animation
    return{...best,...custom,_dominantColor:dominantHex,_presetBase:best.id};
  }

  // No images, random preset
  return THEME_PRESETS[Math.floor(Math.random()*THEME_PRESETS.length)];
}

const EMPTY_LP={
  name:'',slug:'',enabled:true,
  hero_title:'',hero_subtitle:'',hero_bg:'#1e1b4b',hero_text:'#FFFFFF',hero_image:null,
  items:[],
  cta_text:'Order Now',cta_bg:'#10B981',cta_text_color:'#FFFFFF',
  bg_color:'#FAFAFA',text_color:'#1F2937',accent_color:'#7C3AED',
  show_reviews:true,show_countdown:false,countdown_hours:0,countdown_minutes:0,
  show_trust_badges:true,show_social_proof:true,
  layout_style:'alternating',
  animation_style:'slide-up',
  hero_style:'centered',
  ai_generated:false,
  theme_preset:null,
  language:'ar', // ar, fr, en — controls the landing page display language
  ai_hero_image:null, // GPT (gpt-image-1/DALL·E) AI-generated hero image (data URL)
  ai_section_images:[], // GPT AI-generated section images
  ai_images:[], // {id,src,description,placement} — multi AI images with placement config
};

const LANGUAGES=[
  {value:'ar',label:'العربية',flag:'🇩🇿',desc:'Arabic (Algerian)'},
  {value:'fr',label:'Français',flag:'🇫🇷',desc:'French'},
  {value:'en',label:'English',flag:'🇬🇧',desc:'English'},
];

const LAYOUT_STYLES=[
  {value:'alternating',label:'Alternating',desc:'Products alternate left/right'},
  {value:'stacked',label:'Stacked',desc:'Full-width product sections'},
  {value:'showcase',label:'Showcase',desc:'Large hero image with overlay text'},
  {value:'magazine',label:'Magazine',desc:'Hero product + editorial grid'},
  {value:'bento',label:'Bento Grid',desc:'Apple-style asymmetric tiles'},
  {value:'timeline',label:'Timeline',desc:'Step-by-step product journey'},
  {value:'cards',label:'Card Gallery',desc:'Pinterest-style card grid'},
  {value:'cinematic',label:'Cinematic',desc:'Full-screen immersive sections'},
  {value:'minimal-zen',label:'Minimal Zen',desc:'Ultra-clean centered layout'},
  {value:'split-screen',label:'Split Screen',desc:'Bold 50/50 image+text'},
  {value:'mosaic',label:'Mosaic',desc:'Asymmetric collage layout'},
  {value:'storytelling',label:'Storytelling',desc:'Narrative chapters with bleed images'},
  {value:'product-hero',label:'Product Hero',desc:'Landixo-style conversion page with inline order'},
];

const HERO_STYLES=[
  {value:'centered',label:'Centered',desc:'Classic centered hero'},
  {value:'split',label:'Split',desc:'Text left, image right'},
  {value:'minimal',label:'Minimal',desc:'Clean text-only hero'},
];

const ANIMATION_STYLES=[
  {value:'none',label:'None'},
  {value:'fade',label:'Fade In'},
  {value:'slide-up',label:'Slide Up'},
  {value:'zoom',label:'Zoom'},
];

export default function LandingPageBuilder(){
  const{t}=useTranslation();
  const{currentStore,setCurrentStore}=useStoreManagement();
  const[products,setProducts]=useState([]);
  const[pages,setPages]=useState([]);
  const[htmlEditor,setHtmlEditor]=useState(false); // block builder for the AI page
  const[pbBlocks,setPbBlocks]=useState([]); // sections of the generated page as blocks
  const pbWrapRef=useRef({className:'ai-lp',style:'',dir:'ltr'}); // .ai-lp wrapper attrs
  const pbStyleRef=useRef(''); // the page's <style> CSS (base + theme + variants)
  const blockRefs=useRef([]); // DOM refs to each editable block
  const imgReplaceRef=useRef(null); // <input type=file> for replacing an image
  const imgTargetRef=useRef(null); // the <img> currently being replaced
  const[editing,setEditing]=useState(null);
  const[saving,setSaving]=useState(false);
  const[prodSearch,setProdSearch]=useState('');
  const[generating,setGenerating]=useState(false);
  const[showAdvanced,setShowAdvanced]=useState(false);
  const[dragIdx,setDragIdx]=useState(null);
  const[themingInProgress,setThemingInProgress]=useState(false);
  const[showThemePicker,setShowThemePicker]=useState(false);

  // Read landing_pages from a store object — they may be top-level (spread from
  // config by the API) or nested in .config (object or JSON string).
  const readLandingPages=(s)=>{
    if(!s)return null;
    let lp=s.landing_pages;
    if(lp===undefined&&s.config){let c=s.config;if(typeof c==='string'){try{c=JSON.parse(c);}catch{c={};}}lp=c&&c.landing_pages;}
    return Array.isArray(lp)?lp:null;
  };
  useEffect(()=>{
    if(!currentStore?.id)return;
    productApi.getAll(currentStore.id,{}).then(r=>setProducts(r.data.products||[])).catch(()=>{});
    const local=readLandingPages(currentStore);
    if(local)setPages(local);
    // Always refresh from the server — the cached currentStore is often stripped
    // of its config/landing_pages, which made existing pages invisible here.
    ownerApi.getStores().then(r=>{
      const list=Array.isArray(r.data)?r.data:(r.data?.stores||[]);
      const full=list.find(s=>String(s.id)===String(currentStore.id));
      if(full)setCurrentStore({...currentStore,...full});
      const lps=readLandingPages(full);
      if(lps)setPages(lps); else if(!local)setPages([]);
    }).catch(()=>{if(!local)setPages([]);});
  },[currentStore?.id]);

  const save=async(updatedPages,opts={})=>{
    setSaving(true);
    try{
      const payload={landing_pages:updatedPages};
      if(opts.deleteSlug)payload.delete_landing_slug=opts.deleteSlug; // explicit delete (backend upserts otherwise)
      const{data}=await ownerApi.updateStore(currentStore.id,payload);
      setCurrentStore(data);
      // Re-sync pages from the authoritative server response so the list always
      // reflects every saved page (backend merges by slug, never drops).
      const merged=readLandingPages(data);
      setPages(Array.isArray(merged)?merged:updatedPages);
      toast.success(t('lp.saved','Landing page saved'));
    }catch{toast.error(t('lp.saveFailed','Failed to save'));}
    setSaving(false);
  };

  const addPage=()=>{
    const n=[...pages,{...EMPTY_LP,name:`Landing Page ${pages.length+1}`,slug:`lp-${Date.now().toString(36)}`,accent_color:currentStore?.primary_color||'#7C3AED'}];
    setPages(n);
    setEditing(n.length-1);
  };

  const duplicatePage=(idx)=>{
    const src=pages[idx];
    const n=[...pages,{...src,name:`${src.name} (copy)`,slug:`${src.slug}-${Date.now().toString(36).slice(-4)}`}];
    setPages(n);
    setEditing(n.length-1);
    toast.success(t('lp.duplicated','Page duplicated'));
  };

  const removePage=(idx)=>{
    const slug=pages[idx]?.slug;
    const n=pages.filter((_,i)=>i!==idx);
    setPages(n);
    if(editing===idx)setEditing(null);
    else if(editing>idx)setEditing(editing-1);
    save(n,{deleteSlug:slug}); // explicit delete so the backend (which upserts) removes it
  };

  const updatePage=(idx,patch)=>{
    setPages(prev=>prev.map((p,i)=>i===idx?{...p,...patch}:p));
  };

  const addProduct=(pageIdx,product)=>{
    const page=pages[pageIdx];
    if(page.items.find(it=>it.product_id===product.id))return;
    const item={
      product_id:product.id,
      name:product.name_en||product.name||'',
      name_fr:product.name_fr||'',
      name_ar:product.name_ar||'',
      price:product.price,
      compare_price:product.compare_at_price||product.compare_price||null,
      image:product.thumbnail||product.images?.[0]||null,
      images:Array.isArray(product.images)?product.images.filter(Boolean):[],
      description:product.description_en||product.description||'',
      quantity_offers:product.quantity_offers||[],
      headline:'',
      features:[],
      custom_image:null,
    };
    const newItems=[...page.items,item];
    updatePage(pageIdx,{items:newItems});
  };

  const addAllProducts=(pageIdx)=>{
    const page=pages[pageIdx];
    const existing=new Set(page.items.map(it=>it.product_id));
    const newItems=products.filter(p=>!existing.has(p.id)).map(p=>({
      product_id:p.id,name:p.name_en||p.name||'',name_fr:p.name_fr||'',name_ar:p.name_ar||'',
      price:p.price,compare_price:p.compare_at_price||p.compare_price||null,
      image:p.thumbnail||p.images?.[0]||null,images:Array.isArray(p.images)?p.images.filter(Boolean):[],description:p.description_en||p.description||'',
      quantity_offers:p.quantity_offers||[],
      headline:'',features:[],custom_image:null,
    }));
    if(!newItems.length){toast.error(t('lp.allAdded','All products already added'));return;}
    const allItems=[...page.items,...newItems];
    updatePage(pageIdx,{items:allItems});
    toast.success(`${newItems.length} ${t('lp.productsAdded','products added')}`);
    // Auto-theme based on ALL products after bulk add
    if(allItems.some(it=>it.image)){
      setTimeout(()=>applyAutoTheme(pageIdx),400);
    }
  };

  const removeProduct=(pageIdx,productId)=>{
    const page=pages[pageIdx];
    updatePage(pageIdx,{items:page.items.filter(it=>it.product_id!==productId)});
  };

  const updateItem=(pageIdx,itemIdx,patch)=>{
    const page=pages[pageIdx];
    const items=page.items.map((it,i)=>i===itemIdx?{...it,...patch}:it);
    updatePage(pageIdx,{items});
  };

  const moveItem=(pageIdx,from,dir)=>{
    const page=pages[pageIdx];
    const to=from+dir;
    if(to<0||to>=page.items.length)return;
    const items=[...page.items];
    [items[from],items[to]]=[items[to],items[from]];
    updatePage(pageIdx,{items});
  };

  // ─── Auto-theme: extract colors from product images & apply best palette ───
  const applyAutoTheme=useCallback(async(pageIdx,presetId=null)=>{
    const page=pages[pageIdx];
    if(!page)return;
    setThemingInProgress(true);
    try{
      const theme=await autoGenerateTheme(page.items,presetId);
      const patch={
        hero_bg:theme.hero_bg,
        hero_text:theme.hero_text,
        cta_bg:theme.cta_bg,
        cta_text_color:theme.cta_text_color,
        bg_color:theme.bg_color,
        text_color:theme.text_color,
        accent_color:theme.accent_color,
        theme_preset:theme.id||presetId||'custom',
      };
      // Only apply layout/animation from preset if user hasn't customized them
      if(!page._layoutCustomized){
        if(theme.layout_style)patch.layout_style=theme.layout_style;
        if(theme.hero_style)patch.hero_style=theme.hero_style;
        if(theme.animation_style)patch.animation_style=theme.animation_style;
      }
      updatePage(pageIdx,patch);
      const name=THEME_PRESETS.find(p=>p.id===(presetId||theme.id))?.name||t('lp.customTheme','Custom Theme');
      toast.success(`✨ ${name} ${t('lp.themeApplied','applied')}`);
    }catch{toast.error(t('lp.themeFailed','Theme generation failed'));}
    setThemingInProgress(false);
    setShowThemePicker(false);
  },[pages,t]);

  // Apply a specific preset by ID
  const applyPreset=(pageIdx,presetId)=>{
    const preset=THEME_PRESETS.find(p=>p.id===presetId);
    if(!preset)return;
    updatePage(pageIdx,{
      hero_bg:preset.hero_bg,hero_text:preset.hero_text,
      cta_bg:preset.cta_bg,cta_text_color:preset.cta_text_color,
      bg_color:preset.bg_color,text_color:preset.text_color,
      accent_color:preset.accent_color,theme_preset:preset.id,
      layout_style:preset.layout_style,hero_style:preset.hero_style,
      animation_style:preset.animation_style,
    });
    toast.success(`✨ ${preset.name} ${t('lp.themeApplied','applied')}`);
    setShowThemePicker(false);
  };

  /* ─── GPT AI Image Generation (gpt-image-1 / DALL·E 3, via backend) ─── */
  const[generatingImage,setGeneratingImage]=useState(false);
  const[generatingImageId,setGeneratingImageId]=useState(null); // track which image slot is generating

  const AI_PLACEMENTS=[
    {value:'hero',label:'Hero Background',icon:'🖼️'},
    {value:'between_products',label:'Between Products',icon:'📦'},
    {value:'before_checkout',label:'Before Checkout',icon:'🛒'},
    {value:'after_hero',label:'After Hero',icon:'⬇️'},
    {value:'footer',label:'Footer Area',icon:'📄'},
    {value:'testimonial_bg',label:'Testimonial Background',icon:'💬'},
  ];

  const generateAIImage=async(pageIdx,type='hero',customPrompt='',imageId=null)=>{
    const page=pages[pageIdx];
    if(!page?.items?.length){toast.error('Add products first');return;}
    if(imageId)setGeneratingImageId(imageId); else setGeneratingImage(true);
    try{
      const productNames=page.items.map(it=>it.name).filter(Boolean).join(', ');
      const categories=[...new Set(page.items.map(it=>it.category).filter(Boolean))].join(', ');
      const mood=page.hero_title||'premium';
      const bgHex=page.hero_bg||'#1e1b4b';
      const accentHex=page.accent_color||'#7C3AED';

      let prompt;
      if(customPrompt){
        prompt=`${customPrompt}. E-commerce context: ${productNames}. ${categories?'Category: '+categories+'.':''} Color palette: ${bgHex}, ${accentHex}. Professional, no text, no watermarks, high quality.`;
      }else{
        const prompts={
          hero:`Professional e-commerce hero banner for products: ${productNames}. ${categories?'Category: '+categories+'.':''} Mood: ${mood}. Rich, luxurious composition with dynamic lighting, elegant product arrangement. Color scheme: dark background ${bgHex} with accent ${accentHex}. Studio quality, cinematic, no text, no watermarks, commercial photography style, 16:9 aspect ratio.`,
          section:`Elegant lifestyle background for ${productNames}. Soft bokeh, ambient lighting, ${categories||'premium'} aesthetic. Minimalist, no text, complementary colors to ${accentHex}. Professional product photography backdrop.`,
          texture:`Abstract luxury texture background. Gradient mesh with colors ${bgHex} and ${accentHex}. Subtle glass morphism, silk fabric, flowing curves, premium feel. No text, no objects, pure abstract aesthetic.`,
        };
        prompt=prompts[type]||prompts.hero;
      }
      // GPT ONLY — generate the image with OpenAI (gpt-image-1 / DALL·E 3) via the backend.
      const{data}=await aiApi.generateImage({prompt,size:type==='hero'?'1536x1024':'1024x1024'});
      const dataUrl=data?.image;
      if(!dataUrl)throw new Error('no image returned');

      if(imageId){
        // Update existing image in ai_images array
        const imgs=(page.ai_images||[]).map(img=>img.id===imageId?{...img,src:dataUrl}:img);
        updatePage(pageIdx,{ai_images:imgs});
        toast.success('🎨 Image regenerated!');
      }else if(type==='hero'){
        updatePage(pageIdx,{ai_hero_image:dataUrl});
        toast.success('🎨 AI hero image generated!');
      }else{
        const existing=page.ai_section_images||[];
        updatePage(pageIdx,{ai_section_images:[...existing,dataUrl]});
        toast.success('🎨 AI section image generated!');
      }
    }catch(err){
      console.error('GPT image generation error:',err);
      toast.error(err?.response?.data?.error||'Image generation failed — check OPENAI_API_KEY');
    }
    setGeneratingImage(false);
    setGeneratingImageId(null);
  };

  const addAIImageSlot=(pageIdx)=>{
    const page=pages[pageIdx];
    const existing=page.ai_images||[];
    const newImg={id:Date.now().toString(),src:null,description:'',placement:'between_products'};
    updatePage(pageIdx,{ai_images:[...existing,newImg]});
  };

  const updateAIImage=(pageIdx,imageId,patch)=>{
    const page=pages[pageIdx];
    const imgs=(page.ai_images||[]).map(img=>img.id===imageId?{...img,...patch}:img);
    updatePage(pageIdx,{ai_images:imgs});
  };

  const removeAIImage=(pageIdx,imageId)=>{
    const page=pages[pageIdx];
    updatePage(pageIdx,{ai_images:(page.ai_images||[]).filter(img=>img.id!==imageId)});
  };

  const generateAI=async(pageIdx)=>{
    const page=pages[pageIdx];
    if(!page.items.length){toast.error(t('lp.addProductsFirst','Add products first'));return;}
    setGenerating(true);
    try{
      const aiLang=page.language||'ar';

      // Build product data for AI
      const productData=page.items.map(item=>{
        const prod=products.find(p=>p.id===item.product_id)||{};
        return{
          name_en:item.name||prod.name_en||prod.name||'',
          name_fr:item.name_fr||prod.name_fr||'',
          name_ar:item.name_ar||prod.name_ar||'',
          price:item.price,
          compare_at_price:item.compare_price,
          category_name:prod.category_name||'',
          description_en:item.description||prod.description_en||prod.description||'',
          images:prod.images||[item.image].filter(Boolean),
          thumbnail:item.image||prod.thumbnail||'',
        };
      });

      const storeInfo={
        name:currentStore?.store_name||currentStore?.name||'Store',
        currency:currentStore?.currency||'DZD',
      };

      const{data}=await aiApi.generateLanding({products:productData,store:storeInfo,language:aiLang});
      const ai=data.landing;

      if(ai){
        // Apply AI-generated layout, colors, and copy
        const patch={
          ai_generated:true,
          layout_style:ai.layout_style||'alternating',
          hero_style:ai.hero_style||'centered',
          animation_style:ai.animation_style||'slide-up',
          hero_title:ai.hero_title||page.hero_title,
          hero_subtitle:ai.hero_subtitle||page.hero_subtitle,
          cta_text:ai.cta_text||page.cta_text,
          show_trust_badges:ai.show_trust_badges!==false,
          show_social_proof:ai.show_social_proof!==false,
          show_countdown:ai.show_countdown||false,
          show_reviews:ai.show_reviews!==false,
        };

        // Apply AI colors
        if(ai.colors){
          patch.hero_bg=ai.colors.hero_bg||page.hero_bg;
          patch.hero_text=ai.colors.hero_text||page.hero_text;
          patch.cta_bg=ai.colors.cta_bg||page.cta_bg;
          patch.cta_text_color=ai.colors.cta_text_color||page.cta_text_color;
          patch.bg_color=ai.colors.bg_color||page.bg_color;
          patch.accent_color=ai.colors.accent_color||page.accent_color;
          patch.theme_preset='ai-custom';
        }

        // Apply AI product copy
        if(ai.products&&Array.isArray(ai.products)){
          const updatedItems=page.items.map((item,i)=>{
            const aiProduct=ai.products[i];
            if(!aiProduct)return item;
            return{
              ...item,
              headline:aiProduct.headline||item.headline,
              description:aiProduct.description||item.description,
              features:aiProduct.features?.length?aiProduct.features:(item.features?.length?item.features:[]),
            };
          });
          patch.items=updatedItems;
        }

        updatePage(pageIdx,patch);
        const layoutName=LAYOUT_STYLES.find(l=>l.value===ai.layout_style)?.label||ai.layout_style;
        toast.success(`✨ AI generated: ${layoutName} layout${ai.page_mood?' • '+ai.page_mood+' mood':''}`);
      }else{
        // Fallback to basic generation
        const updatedItems=page.items.map(item=>({
          ...item,
          headline:item.headline||`${item.name} — ${t('lp.aiExclusive','Exclusive Offer')}`,
          features:item.features?.length?item.features:[t('lp.aiFeature1','Premium quality materials'),t('lp.aiFeature2','Fast shipping to all 58 wilayas'),t('lp.aiFeature3','100% satisfaction guaranteed')],
          description:item.description||`${t('lp.aiDesc1','Discover')} ${item.name} — ${t('lp.aiDesc2','designed to exceed your expectations.')}`,
        }));
        updatePage(pageIdx,{items:updatedItems,ai_generated:true});
        toast.success(t('lp.aiGenerated','AI content generated! Review and customize.'));
      }
    }catch(err){
      console.error('AI generate error:',err);
      // Fallback to basic generation on error
      const updatedItems=page.items.map(item=>({
        ...item,
        headline:item.headline||`${item.name} — ${t('lp.aiExclusive','Exclusive Offer')}`,
        features:item.features?.length?item.features:[t('lp.aiFeature1','Premium quality materials'),t('lp.aiFeature2','Fast shipping to all 58 wilayas'),t('lp.aiFeature3','100% satisfaction guaranteed')],
        description:item.description||`${t('lp.aiDesc1','Discover')} ${item.name} — ${t('lp.aiDesc2','designed to exceed your expectations.')}`,
      }));
      updatePage(pageIdx,{items:updatedItems,ai_generated:true});
      toast.success(t('lp.aiGenerated','AI content generated (basic mode).'));
    }
    setGenerating(false);
  };

  // Generate a COMPLETE bespoke landing page as raw HTML, purely from AI (no templates).
  const generateFullAI=async(pageIdx)=>{
    const page=pages[pageIdx];
    if(!page.items.length){toast.error(t('lp.addProductsFirst','Add products first'));return;}
    setGenerating(true);
    try{
      const aiLang=page.language||'ar';
      const productData=page.items.map(item=>{
        const prod=products.find(p=>p.id===item.product_id)||{};
        // Variants can be a JSON string or an array; normalize and keep each
        // variant's own images so the backend can build an auto-rotating gallery.
        let vars=prod.variants;
        if(typeof vars==='string'){try{vars=JSON.parse(vars);}catch{vars=[];}}
        if(!Array.isArray(vars))vars=[];
        return{
          product_id:item.product_id,
          name_en:item.name||prod.name_en||prod.name||'',
          name_fr:item.name_fr||prod.name_fr||'',
          name_ar:item.name_ar||prod.name_ar||'',
          price:item.price,
          compare_at_price:item.compare_price,
          category_name:prod.category_name||'',
          description_en:item.description||prod.description_en||prod.description||'',
          description_ar:item.description_ar||prod.description_ar||'',
          images:(prod.images&&prod.images.length?prod.images:[item.image].filter(Boolean)),
          thumbnail:item.image||prod.thumbnail||'',
          variants:vars.map(v=>({name:v.name||v.value||'',value:v.value||'',images:Array.isArray(v.images)?v.images:[]})),
        };
      });
      const storeInfo={name:currentStore?.store_name||currentStore?.name||'Store',currency:currentStore?.currency||'DZD'};
      // Each click is an explicit "(re)generate" — ask the backend for a fresh
      // look (different template + palette) instead of the cached page, and pass
      // a unique nonce so two clicks never return the identical layout.
      const{data}=await aiApi.generateLandingHtml({products:productData,store:storeInfo,language:aiLang,regenerate:true,nonce:`${pageIdx}-${Date.now()}`});
      const len=data?.html?data.html.length:0;
      console.log('[AI page] generated html length:',len,'model:',data?.model,'image:',data?.imageModel);
      if(data?.html){
        // Persist immediately so the live page reflects the new generation — no
        // risk of viewing a stale page because the user forgot to hit Save.
        // Also store the AI theme colours so the checkout/order form below the
        // generated page matches the page instead of the default purple.
        const th=data.theme||{};
        const themeCols=th.primary?{accent_color:th.accent||th.primary,cta_bg:th.primary,cta_text_color:'#FFFFFF',bg_color:th.bg||'#FAFAFA',text_color:th.ink||'#1F2937'}:{};
        const patched=pages.map((pg,i)=>i===pageIdx?{...pg,ai_html:data.html,layout_style:'ai-custom',ai_generated:true,...themeCols}:pg);
        setPages(patched);
        try{
          await save(patched);
          toast.success(`✨ Generated ${(len/1024).toFixed(0)}KB${data.imageModel?' + image':''} & saved ✓`,{duration:6000});
        }catch(saveErr){
          console.error('[AI page] SAVE failed:',saveErr);
          toast.error(`Generated OK but SAVE failed: ${saveErr.response?.data?.error||saveErr.message||'unknown'}`,{duration:9000});
        }
      }else{
        toast.error('AI returned no HTML — try again',{duration:7000});
      }
    }catch(err){
      console.error('Full AI generate error:',err);
      const reason=err.code==='ECONNABORTED'?'timed out (try again)':(err.response?.data?.error||err.message||'failed');
      toast.error(`AI generation: ${reason}`,{duration:9000});
    }
    setGenerating(false);
  };

  // ── Block-based page builder for the AI page ──
  // The blocks ARE the sections the AI generated for THIS page, so the builder is
  // customized per page. Each block can be edited inline, reordered and removed.
  const blockName=(html)=>{
    if(/class="[^"]*lp-hero/.test(html))return t('lp.blkHero','Hero');
    if(/lp-ba\b/.test(html))return t('lp.blkBA','Before / After');
    if(/lp-vs\b/.test(html))return t('lp.blkVs','Comparison');
    if(/lp-specs/.test(html))return t('lp.blkSpecs','Specs');
    if(/lp-cod/.test(html))return t('lp.blkCod','Delivery');
    if(/lp-steps/.test(html))return t('lp.blkSteps','How to order');
    if(/lp-faq/.test(html))return t('lp.blkFaq','FAQ');
    if(/lp-final/.test(html))return t('lp.blkFinal','Final CTA');
    if(/lp-var\b/.test(html))return t('lp.blkVar','Variants');
    if(/lp-bens|lp-card/.test(html))return t('lp.blkBenefits','Benefits');
    if(/lp-divider/.test(html))return t('lp.blkDivider','Divider');
    if(/lp-feature/.test(html))return t('lp.blkFeature','Feature');
    return t('lp.blkSection','Section');
  };
  const openPageBuilder=()=>{
    if(!form.ai_html){toast.error(form.too_large?t('lp.tooLargeRegen','This page is from an old heavy version — please AI Regenerate it first'):t('lp.regenFirst','Generate the page first (AI Generate)'));return;}
    try{
      const tmp=document.createElement('div');tmp.innerHTML=form.ai_html||'';
      const wrap=tmp.querySelector('.ai-lp')||tmp;
      pbWrapRef.current={
        className:(wrap.getAttribute&&wrap.getAttribute('class'))||'ai-lp',
        style:(wrap.getAttribute&&wrap.getAttribute('style'))||'',
        dir:(wrap.getAttribute&&wrap.getAttribute('dir'))||'ltr',
      };
      pbStyleRef.current=[...wrap.querySelectorAll(':scope > style')].map(s=>s.textContent).join('\n');
      const blocks=[...wrap.children].filter(c=>c.tagName!=='STYLE').map((c,i)=>({id:'b'+i+'_'+Math.random().toString(36).slice(2,7),html:c.outerHTML}));
      blockRefs.current=[];
      setPbBlocks(blocks);
      setHtmlEditor(true);
    }catch(e){toast.error('Could not open the page builder');}
  };
  const pbSync=(arr)=>arr.map((b,i)=>blockRefs.current[i]?{...b,html:blockRefs.current[i].innerHTML}:b);
  const pbMove=(from,to)=>setPbBlocks(bs=>{const s=pbSync(bs);if(to<0||to>=s.length)return s;const n=[...s];const[m]=n.splice(from,1);n.splice(to,0,m);return n;});
  const pbDelete=(idx)=>setPbBlocks(bs=>pbSync(bs).filter((_,i)=>i!==idx));
  // Add a NEW block from the palette (like the super-admin builder). Appends to
  // the end (then it can be moved up); inline-editable + image-replaceable.
  const addPbBlock=(make)=>{
    const pid=(pages[editing]?.items?.[0]?.product_id)||'';
    setPbBlocks(bs=>[...pbSync(bs),{id:'b'+Date.now()+Math.random().toString(36).slice(2,5),html:make(pid)}]);
    setTimeout(()=>{const el=document.querySelector('.lp-pb-canvas');if(el)el.scrollTop=el.scrollHeight;},80);
  };
  const onEditorClick=(e)=>{
    const img=e.target.closest('img');
    if(img){e.preventDefault();imgTargetRef.current=img;imgReplaceRef.current?.click();}
  };
  const onImgReplace=(e)=>{
    const f=e.target.files?.[0];const tgt=imgTargetRef.current;e.target.value='';
    if(!f||!tgt)return;
    const r=new FileReader();r.onload=()=>{tgt.src=r.result;};r.readAsDataURL(f);
  };
  const saveHtmlEditor=async()=>{
    const synced=pbSync(pbBlocks);
    const w=pbWrapRef.current;
    const openTag=`<div class="${w.className}"${w.style?` style="${w.style.replace(/"/g,'&quot;')}"`:''}${w.dir?` dir="${w.dir}"`:''}>`;
    const html=`${openTag}<style>${pbStyleRef.current}</style>${synced.map(b=>b.html).join('')}</div>`;
    const patched=pages.map((pg,i)=>i===editing?{...pg,ai_html:html,layout_style:'ai-custom',ai_generated:true}:pg);
    setPages(patched);setHtmlEditor(false);
    try{await save(patched);toast.success(t('lp.pageSaved','Page saved ✓'));}
    catch(e){toast.error('Save failed: '+(e.response?.data?.error||e.message||'unknown'));}
  };

  const filteredProducts=products.filter(p=>!prodSearch||(p.name_en||p.name||'').toLowerCase().includes(prodSearch.toLowerCase()));
  const storeSlug=currentStore?.slug;
  const baseUrl=typeof window!=='undefined'?window.location.origin:'';
  const form=editing!==null?pages[editing]:null;

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Rocket size={22} className="text-violet-500"/>{t('lp.title','Landing Pages')}</h1>
        <p className="text-sm text-gray-400 mt-1">{t('lp.subtitle','Create scroll-to-checkout landing pages for your products')}</p>
      </div>
      <button onClick={addPage} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14}/>{t('lp.newPage','New Landing Page')}</button>
    </div>

    {/* Page list */}
    {!form&&<div className="space-y-3">
      {pages.length===0&&<div className="glass-card-solid p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4"><Rocket size={28} className="text-violet-500"/></div>
        <p className="text-gray-700 font-bold text-lg">{t('lp.noPages','No landing pages yet')}</p>
        <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">{t('lp.noPagesDesc','Create a landing page to showcase your products with a scroll-to-checkout experience')}</p>
        <button onClick={addPage} className="btn-primary mt-5 text-sm"><Plus size={14} className="inline mr-1"/>{t('lp.createFirst','Create Your First Landing Page')}</button>
      </div>}
      {pages.map((pg,i)=>(
        <div key={i} className="glass-card-solid p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner" style={{backgroundColor:pg.hero_bg||'#1e1b4b'}}><Rocket size={18} className="text-white"/></div>
            <div>
              <p className="font-bold text-sm">{pg.name||`Landing Page ${i+1}`}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-gray-400">{pg.items?.length||0} {t('lp.products','products')}</span>
                {pg.enabled?<span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/>{t('lp.live','LIVE')}</span>:<span className="text-[10px] text-gray-400">{t('lp.draft','DRAFT')}</span>}
                {pg.layout_style&&<span className="text-[10px] text-gray-400 capitalize">{pg.layout_style}</span>}
                {pg.ai_generated&&<span className="text-[10px] font-bold text-violet-500 flex items-center gap-0.5"><Brain size={8}/>AI</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {pg.enabled&&storeSlug&&<a href={`/s/${storeSlug}/lp/${pg.slug}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-violet-500 rounded-lg hover:bg-violet-50 transition-colors" title={t('lp.preview','Preview')}><ExternalLink size={14}/></a>}
            <button onClick={()=>duplicatePage(i)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors" title={t('lp.duplicate','Duplicate')}><Copy size={14}/></button>
            <button onClick={()=>setEditing(i)} className="btn-ghost text-xs">{t('lp.edit','Edit')}</button>
            <button onClick={()=>removePage(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
          </div>
        </div>
      ))}
    </div>}

    {/* ═══ EDITOR ═══ */}
    {form&&<div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={()=>setEditing(null)} className="btn-ghost text-xs flex items-center gap-1"><ChevronDown size={12} className="rotate-90"/>{t('lp.backToList','Back to List')}</button>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto Theme button */}
          <div className="relative">
            <button onClick={()=>setShowThemePicker(!showThemePicker)} disabled={themingInProgress} className="btn-ghost text-xs flex items-center gap-1.5 text-pink-600 hover:bg-pink-50 border border-pink-200">
              {themingInProgress?<RefreshCw size={13} className="animate-spin"/>:<Palette size={13}/>}
              {themingInProgress?t('lp.theming','Theming...'):t('lp.autoTheme','Auto Theme')}
              <ChevronDown size={10}/>
            </button>
            {/* Theme preset picker dropdown */}
            {showThemePicker&&<div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-[380px] max-h-[480px] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><Sparkles size={12} className="text-pink-500"/>{t('lp.chooseTheme','Choose Theme')}</p>
                <button onClick={()=>setShowThemePicker(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              </div>
              {/* Smart auto button */}
              <button onClick={()=>applyAutoTheme(editing)} disabled={themingInProgress||!form.items.length} className="w-full mb-3 p-3 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 hover:bg-violet-100 transition-all flex items-center gap-3 disabled:opacity-40">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-pink-500 to-amber-500 flex items-center justify-center shrink-0"><Pipette size={16} className="text-white"/></div>
                <div className="text-left">
                  <p className="text-xs font-bold text-violet-700">{t('lp.smartAutoTheme','Smart Auto Theme')}</p>
                  <p className="text-[10px] text-violet-500">{t('lp.smartAutoThemeDesc','Analyzes your product images and generates a matching color palette')}</p>
                </div>
              </button>
              {/* Presets grid */}
              <div className="grid grid-cols-2 gap-2">
                {THEME_PRESETS.map(p=>(
                  <button key={p.id} onClick={()=>applyPreset(editing,p.id)} className={`p-2.5 rounded-xl border-2 text-left transition-all hover:shadow-md group ${form.theme_preset===p.id?'border-violet-500 ring-2 ring-violet-200':'border-gray-100 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{p.icon}</span>
                      <span className="text-[11px] font-bold text-gray-700 truncate">{p.name}</span>
                    </div>
                    {/* Color preview swatches */}
                    <div className="flex gap-0.5 h-5 rounded-lg overflow-hidden">
                      <div className="flex-[3]" style={{backgroundColor:p.hero_bg}}/>
                      <div className="flex-[2]" style={{backgroundColor:p.accent_color}}/>
                      <div className="flex-1" style={{backgroundColor:p.cta_bg}}/>
                      <div className="flex-[2]" style={{backgroundColor:p.bg_color,border:'1px solid #eee'}}/>
                    </div>
                  </button>
                ))}
              </div>
            </div>}
          </div>
          {/* ONE button generates the entire page (layout, copy, graphics) with GPT. */}
          <button onClick={()=>generateFullAI(editing)} disabled={generating} title={t('lp.fullAiHint','Generate the entire page from scratch with GPT')} className="text-xs flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-all text-white shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.97] disabled:opacity-60" style={{background:'linear-gradient(135deg, #7C3AED, #0EA5E9)'}}>
            {generating?<RefreshCw size={13} className="animate-spin"/>:<Wand2 size={13}/>}
            {generating?t('lp.generating','AI Generating...'):(form?.ai_html?t('lp.aiRegenerate','AI Regenerate'):t('lp.aiGenerate','AI Generate'))}
          </button>
          {form?.ai_html&&<button onClick={openPageBuilder} title={t('lp.editPageHint','Edit, reorder and remove the page sections')} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-violet-600 bg-violet-50 hover:bg-violet-100 active:scale-[0.97]"><Layers size={13}/>{t('lp.editPage','Edit Page')}</button>}
          {form?.ai_html&&<button onClick={()=>updatePage(editing,{ai_html:'',layout_style:form.layout_style==='ai-custom'?'alternating':form.layout_style})} title={t('lp.fullAiClear','Clear the AI page')} className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-all text-gray-500 bg-gray-100 hover:bg-gray-200 active:scale-[0.97]"><X size={13}/></button>}
          {form.enabled&&storeSlug&&<a href={`/s/${storeSlug}/lp/${form.slug}`} target="_blank" rel="noreferrer" className="btn-ghost text-xs flex items-center gap-1"><Eye size={12}/>{t('lp.preview','Preview')}</a>}
          <button onClick={()=>save(pages)} disabled={saving} className="btn-primary text-xs flex items-center gap-1.5"><Save size={12}/>{saving?t('lp.saving','Saving...'):t('lp.save','Save')}</button>
        </div>
      </div>

      {/* ─── PAGE NAME + STATUS + LANGUAGE ─── */}
      <div className="glass-card-solid p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.pageName','Page Name')}</label><input className="input-field !py-2 text-sm" value={form.name} onChange={e=>updatePage(editing,{name:e.target.value})}/></div>
          <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.urlSlug','URL Slug')}</label><input className="input-field !py-2 text-sm font-mono" value={form.slug} onChange={e=>updatePage(editing,{slug:e.target.value.replace(/[^a-z0-9-]/g,'')})}/></div>
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.language','Language')}</label>
            <div className="flex gap-1.5 mt-1">
              {LANGUAGES.map(l=>(
                <button key={l.value} onClick={()=>updatePage(editing,{language:l.value})} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${(form.language||'ar')===l.value?'bg-violet-50 text-violet-700 border-2 border-violet-400 shadow-sm':'bg-gray-50 text-gray-500 border-2 border-gray-100 hover:border-gray-300'}`}>
                  <span>{l.flag}</span>
                  <span className="hidden sm:inline">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>updatePage(editing,{enabled:!form.enabled})} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${form.enabled?'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-gray-50 text-gray-500 border border-gray-200'}`}>
              {form.enabled?<ToggleRight size={16}/>:<ToggleLeft size={16}/>}
              {form.enabled?t('lp.enabled','Enabled'):t('lp.disabled','Disabled')}
            </button>
          </div>
        </div>
        {storeSlug&&form.slug&&<div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mt-3">
          <Globe size={12} className="text-gray-400 shrink-0"/>
          <code className="text-[11px] font-mono text-violet-600 flex-1 truncate">{baseUrl}/s/{storeSlug}/lp/{form.slug}</code>
          <button onClick={()=>{navigator.clipboard.writeText(`${baseUrl}/s/${storeSlug}/lp/${form.slug}`);toast.success(t('lp.copied','Copied!'));}} className="p-1 text-gray-400 hover:text-violet-500 shrink-0"><Copy size={12}/></button>
        </div>}
      </div>

      {/* ─── PRODUCTS ─── */}
      <div className="glass-card-solid p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><Package size={15} className="text-violet-500"/>{t('lp.productsSection','Products')} <span className="text-gray-400 font-normal">({form.items.length})</span></h3>
          <button onClick={()=>addAllProducts(editing)} className="btn-ghost text-[11px] flex items-center gap-1"><Plus size={11}/>{t('lp.addAll','Add All')}</button>
        </div>

        {/* Product picker */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <input className="input-field !py-2 text-sm" placeholder={t('lp.searchToAdd','Search products to add...')} value={prodSearch} onChange={e=>setProdSearch(e.target.value)}/>
          <div className="max-h-36 overflow-y-auto space-y-0.5">
            {filteredProducts.filter(p=>!form.items.find(it=>it.product_id===p.id)).slice(0,12).map(p=>(
              <button key={p.id} onClick={()=>addProduct(editing,p)} className="w-full flex items-center gap-2.5 p-2 hover:bg-white rounded-lg text-left transition-colors group">
                {p.thumbnail?<img src={p.thumbnail} className="w-8 h-8 rounded-lg object-cover"/>:<div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center"><Package size={11} className="text-gray-400"/></div>}
                <span className="text-xs font-medium flex-1 truncate">{p.name_en||p.name}</span>
                <span className="text-[10px] font-bold text-gray-400">{parseFloat(p.price).toLocaleString()} {currentStore?.currency||'DZD'}</span>
                <Plus size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
              </button>
            ))}
            {filteredProducts.filter(p=>!form.items.find(it=>it.product_id===p.id)).length===0&&<p className="text-xs text-gray-400 py-3 text-center">{t('lp.noMoreProducts','All products added')}</p>}
          </div>
        </div>

        {/* Product list */}
        <div className="space-y-3">
          {form.items.map((item,idx)=>(
            <div key={item.product_id} className="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={()=>moveItem(editing,idx,-1)} disabled={idx===0} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronUp size={12}/></button>
                    <button onClick={()=>moveItem(editing,idx,1)} disabled={idx===form.items.length-1} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20"><ChevronDown size={12}/></button>
                  </div>
                  {item.image?<img src={item.custom_image||item.image} className="w-14 h-14 rounded-xl object-cover shadow-sm"/>:<div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center"><Package size={18} className="text-gray-300"/></div>}
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.compare_price&&parseFloat(item.compare_price)>0&&<span className="text-[10px] line-through text-gray-400">{parseFloat(item.compare_price).toLocaleString()}</span>}
                      <span className="text-xs font-bold text-emerald-600">{parseFloat(item.price).toLocaleString()} {currentStore?.currency||'DZD'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={()=>removeProduct(editing,item.product_id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.headline','Headline')}</label><input className="input-field !py-1.5 text-xs" placeholder={t('lp.headlinePh','e.g. Limited Time Offer!')} value={item.headline} onChange={e=>updateItem(editing,idx,{headline:e.target.value})}/></div>
                <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.description','Description')}</label><textarea className="input-field !py-1.5 text-xs" rows={1} placeholder={t('lp.descPh','Product selling points...')} value={item.description} onChange={e=>updateItem(editing,idx,{description:e.target.value})}/></div>
              </div>
              <div className="mt-2"><label className="text-[10px] text-gray-400 font-bold">{t('lp.features','Key Features')} <span className="font-normal text-gray-300">({t('lp.featuresHint','one per line')})</span></label><textarea className="input-field !py-1.5 text-xs" rows={2} placeholder={t('lp.featuresPh','Premium quality\nFast delivery\n30-day guarantee')} value={(item.features||[]).join('\n')} onChange={e=>updateItem(editing,idx,{features:e.target.value.split('\n')})}/></div>
              {/* ─── Product images manager (gallery shown on landing page) ─── */}
              {(item.images||[]).length>0&&(
                <div className="mt-2">
                  <label className="text-[10px] text-gray-400 font-bold">{t('lp.productImages','Product Images')} <span className="font-normal text-gray-300">({t('lp.productImagesHint','star = main, shown as a gallery')})</span></label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(item.images||[]).map((src,ii)=>{
                      const isMain=(item.custom_image||item.image)===src;
                      return(
                        <div key={ii} className="relative w-14 h-14 rounded-lg overflow-hidden group/img" style={{boxShadow:isMain?'0 0 0 2px #10b981':'0 0 0 1px rgba(0,0,0,0.1)'}}>
                          <img src={src} className="w-full h-full object-cover"/>
                          <button type="button" onClick={()=>updateItem(editing,idx,{image:src,custom_image:null})} title={t('lp.setMain','Set as main')} className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full flex items-center justify-center ${isMain?'bg-emerald-500 text-white':'bg-white/80 text-gray-500'}`}><Star size={9} fill={isMain?'currentColor':'none'}/></button>
                          <button type="button" onClick={()=>{const nx=(item.images||[]).filter(s=>s!==src);updateItem(editing,idx,{images:nx,...(isMain?{image:nx[0]||null}:{})});}} title={t('common.delete','Remove')} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"><X size={9}/></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
          {form.items.length===0&&<div className="text-center py-8 text-gray-400"><Package size={32} className="mx-auto mb-2 opacity-50"/><p className="text-sm">{t('lp.noProductsYet','Add products from the picker above')}</p></div>}
        </div>
      </div>

      {/* ─── ADVANCED SETTINGS (toggle) ─── */}
      <button onClick={()=>setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-5 py-3 glass-card-solid hover:shadow-sm transition-shadow rounded-xl">
        <span className="font-bold text-sm flex items-center gap-2"><Settings size={15} className="text-gray-400"/>{t('lp.advancedSettings','Advanced Settings')}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAdvanced?'rotate-180':''}`}/>
      </button>

      {showAdvanced&&<div className="space-y-4">
        {/* Hero section */}
        <div className="glass-card-solid p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2"><Type size={14} className="text-indigo-500"/>{t('lp.heroSection','Hero Section')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.heroTitle','Title')}</label><input className="input-field !py-2 text-sm" placeholder={t('lp.heroTitlePh','Your Amazing Products')} value={form.hero_title} onChange={e=>updatePage(editing,{hero_title:e.target.value})}/></div>
            <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.heroSubtitle','Subtitle')}</label><input className="input-field !py-2 text-sm" placeholder={t('lp.heroSubPh','Scroll down to discover our exclusive offers')} value={form.hero_subtitle} onChange={e=>updatePage(editing,{hero_subtitle:e.target.value})}/></div>
          </div>
          {/* Hero style */}
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase mb-2 block">{t('lp.heroStyle','Hero Style')}</label>
            <div className="flex gap-2">
              {HERO_STYLES.map(s=>(
                <button key={s.value} onClick={()=>updatePage(editing,{hero_style:s.value})} className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${form.hero_style===s.value?'border-violet-500 bg-violet-50':'border-gray-200 hover:border-gray-300'}`}>
                  <p className="text-xs font-bold">{s.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div><label className="text-[10px] text-gray-400 font-bold uppercase">{t('lp.ctaText','CTA Button Text')}</label><input className="input-field !py-2 text-sm" value={form.cta_text} onChange={e=>updatePage(editing,{cta_text:e.target.value})}/></div>
          {/* AI Hero Image */}
          {form.ai_hero_image&&(
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1"><Image size={10}/>{t('lp.aiHeroImage','AI Hero Image')}</label>
                <button onClick={()=>updatePage(editing,{ai_hero_image:null})} className="text-[10px] text-red-400 hover:text-red-600 font-bold">{t('common.delete','Remove')}</button>
              </div>
              <img src={form.ai_hero_image} alt="AI Hero" className="w-full h-32 object-cover rounded-xl ring-1 ring-black/10"/>
            </div>
          )}
          {/* Hero preview */}
          <div className="rounded-xl overflow-hidden shadow-lg relative" style={{backgroundColor:form.hero_bg}}>
            {form.ai_hero_image&&<img src={form.ai_hero_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40"/>}
            <div className="relative p-8 text-center">
              <h2 className="text-xl font-black tracking-tight" style={{color:form.hero_text}}>{form.hero_title||t('lp.heroTitlePh','Your Amazing Products')}</h2>
              <p className="text-sm mt-2 opacity-80" style={{color:form.hero_text}}>{form.hero_subtitle||t('lp.heroSubPh','Scroll down to discover')}</p>
              <button className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg" style={{backgroundColor:form.cta_bg,color:form.cta_text_color}}>{form.cta_text||'Order Now'}</button>
            </div>
          </div>

        </div>

        {/* Colors */}
        <div className="glass-card-solid p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2"><Palette size={14} className="text-pink-500"/>{t('lp.colors','Colors & Theme')}</h3>
            <div className="flex items-center gap-2">
              {form.theme_preset&&<span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 flex items-center gap-1">
                {THEME_PRESETS.find(p=>p.id===form.theme_preset)?.icon||'🎨'} {THEME_PRESETS.find(p=>p.id===form.theme_preset)?.name||t('lp.customTheme','Custom')}
              </span>}
              <button onClick={()=>applyAutoTheme(editing)} disabled={themingInProgress||!form.items.length} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors flex items-center gap-1 disabled:opacity-30">
                <RefreshCw size={10}/>{t('lp.regenerateColors','Regenerate')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {key:'hero_bg',label:t('lp.heroBg','Hero BG'),def:'#1e1b4b'},
              {key:'hero_text',label:t('lp.heroTextColor','Hero Text'),def:'#FFFFFF'},
              {key:'cta_bg',label:t('lp.ctaColor','Button'),def:'#10B981'},
              {key:'cta_text_color',label:t('lp.ctaTextColor','Button Text'),def:'#FFFFFF'},
              {key:'bg_color',label:t('lp.pageBg','Page BG'),def:'#FAFAFA'},
              {key:'accent_color',label:t('lp.accent','Accent'),def:'#7C3AED'},
            ].map(c=>(
              <div key={c.key}>
                <label className="text-[10px] text-gray-400 font-bold">{c.label}</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input type="color" value={form[c.key]||c.def} onChange={e=>updatePage(editing,{[c.key]:e.target.value})} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer shrink-0"/>
                  <input className="input-field !py-1 text-[10px] flex-1 font-mono" value={form[c.key]||c.def} onChange={e=>updatePage(editing,{[c.key]:e.target.value})}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layout & Animation */}
        <div className="glass-card-solid p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2"><Layout size={14} className="text-blue-500"/>{t('lp.layoutAnimation','Layout & Animation')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Layout grid takes full width, animation below */}
            <div className="sm:col-span-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase mb-2 block">{t('lp.productLayout','Product Layout')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {LAYOUT_STYLES.map(s=>(
                  <button key={s.value} onClick={()=>updatePage(editing,{layout_style:s.value,_layoutCustomized:true})} className={`p-2.5 rounded-xl border-2 text-left text-xs transition-all hover:shadow-md ${form.layout_style===s.value?'border-violet-500 bg-violet-50 ring-2 ring-violet-200':'border-gray-100 hover:border-gray-300'}`}>
                    <p className="font-bold text-gray-700 text-[11px]">{t(`lp.layout_${s.value}`,s.label)}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{t(`lp.layoutDesc_${s.value}`,s.desc)}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase mb-2 block">{t('lp.animationStyle','Animation Style')}</label>
              <div className="space-y-1.5">
                {ANIMATION_STYLES.map(s=>(
                  <button key={s.value} onClick={()=>updatePage(editing,{animation_style:s.value})} className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${form.animation_style===s.value?'border-violet-400 bg-violet-50 font-bold':'border-gray-200 hover:border-gray-300'}`}>
                    <MousePointer size={12} className={form.animation_style===s.value?'text-violet-500':'text-gray-400'}/>{s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Extra toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
            {[
              {key:'show_trust_badges',label:t('lp.trustBadges','Trust Badges'),icon:Shield},
              {key:'show_social_proof',label:t('lp.socialProof','Social Proof'),icon:Star},
              {key:'show_reviews',label:t('lp.reviews','Reviews'),icon:Star},
              {key:'show_countdown',label:t('lp.countdown','Countdown'),icon:Timer},
            ].map(({key,label,icon:Icon})=>(
              <label key={key} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                <input type="checkbox" checked={form[key]!==false} onChange={e=>updatePage(editing,{[key]:e.target.checked})} className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600"/>
                <Icon size={12} className="text-gray-400"/>
                <span className="text-[11px] font-bold text-gray-600">{label}</span>
              </label>
            ))}
          </div>

          {form.show_countdown&&<div className="grid grid-cols-2 gap-3 pt-2">
            <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.countdownHours','Hours')}</label><input type="number" min="0" className="input-field !py-1.5 text-xs" value={form.countdown_hours||''} onChange={e=>updatePage(editing,{countdown_hours:parseInt(e.target.value)||0})}/></div>
            <div><label className="text-[10px] text-gray-400 font-bold">{t('lp.countdownMinutes','Minutes')}</label><input type="number" min="0" className="input-field !py-1.5 text-xs" value={form.countdown_minutes||''} onChange={e=>updatePage(editing,{countdown_minutes:parseInt(e.target.value)||0})}/></div>
          </div>}
        </div>
      </div>}

      {/* Save */}
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={()=>setEditing(null)} className="btn-ghost text-sm">{t('lp.cancel','Cancel')}</button>
        <button onClick={()=>save(pages)} disabled={saving} className="btn-primary text-sm flex items-center gap-2"><Save size={14}/>{saving?t('lp.saving','Saving...'):t('lp.savePage','Save Landing Page')}</button>
      </div>
    </div>}

    {/* ═══ VISUAL PAGE EDITOR — edit any text inline, click an image to replace ═══ */}
    {htmlEditor&&form?.ai_html&&(
      <div className="fixed inset-0 z-[80] bg-gray-100 flex flex-col">
        <input ref={imgReplaceRef} type="file" accept="image/*" className="hidden" onChange={onImgReplace}/>
        {/* Header — mirrors the super-admin Page Builder */}
        <div className="bg-white border-b shadow-sm px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Layers size={20} className="text-violet-500 shrink-0"/>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-black text-gray-900 truncate">{t('lp.pageBuilder','Page Builder')}</h1>
              <p className="text-[11px] text-gray-500 truncate hidden sm:block">{t('lp.editPageTip','Click any text to edit it. Click an image to replace it.')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button onClick={()=>setHtmlEditor(false)} className="px-3 md:px-4 py-2 bg-gray-100 rounded-xl text-xs md:text-sm font-bold text-gray-600 hover:bg-gray-200 flex items-center gap-1"><X size={14}/>{t('lp.cancel','Cancel')}</button>
            {form.enabled&&storeSlug&&<a href={`/s/${storeSlug}/lp/${form.slug}`} target="_blank" rel="noreferrer" className="px-3 md:px-4 py-2 bg-gray-100 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1"><Eye size={14}/>{t('lp.preview','Preview')}</a>}
            <button onClick={saveHtmlEditor} disabled={saving} className="px-4 md:px-6 py-2.5 text-white rounded-xl text-xs md:text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2" style={{backgroundColor:'#7C3AED'}}><Save size={16}/>{saving?t('lp.saving','Saving...'):t('lp.save','Save')}</button>
          </div>
        </div>
        {/* Add-block palette — like the super-admin builder */}
        <div className="bg-white border-b px-3 md:px-6 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-gray-400 shrink-0 flex items-center gap-1"><Plus size={12}/>{t('lp.addBlock','Add block')}:</span>
          {PB_PALETTE.map(b=>{const Ic=b.icon||Layout;return(
            <button key={b.label} onClick={()=>addPbBlock(b.make)} className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-violet-100 hover:text-violet-700 transition-colors"><Ic size={13}/>{t('lp.blk'+b.label.replace(/[^A-Za-z]/g,''),b.label)}</button>
          );})}
        </div>
        {/* Canvas — one card per generated section (block) */}
        <div className="lp-pb-canvas flex-1 overflow-y-auto py-5 px-3">
          {/* Page CSS (base + theme + variants) + theme vars on every block wrapper + editor affordances */}
          <style dangerouslySetInnerHTML={{__html:`${pbStyleRef.current}\n${pbWrapRef.current.style?`.lp-pb .ai-lp{${pbWrapRef.current.style}}`:''}\n.lp-pb .ai-lp .lp-section,.lp-pb .ai-lp .lp-card,.lp-pb .ai-lp .lp-feature{animation:none!important}\n.lp-pb [data-order]{cursor:text}\n.lp-pb img{cursor:pointer;outline:2px dashed transparent;outline-offset:2px}\n.lp-pb img:hover{outline-color:#7C3AED}\n.lp-pb [contenteditable]:focus{outline:none}`}}/>
          <div className="lp-pb max-w-[520px] mx-auto space-y-3">
            {pbBlocks.length===0&&<div className="bg-white rounded-2xl p-10 text-center ring-1 ring-gray-200"><Layers size={40} className="mx-auto text-gray-300 mb-3"/><p className="text-gray-500 font-bold">{t('lp.noBlocks','No sections found')}</p></div>}
            {pbBlocks.map((b,i)=>(
              <div key={b.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><span className="w-5 h-5 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center text-[10px]">{i+1}</span>{blockName(b.html)}</div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={()=>pbMove(i,i-1)} disabled={i===0} title={t('lp.moveUp','Move up')} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-25"><ChevronUp size={15}/></button>
                    <button onClick={()=>pbMove(i,i+1)} disabled={i===pbBlocks.length-1} title={t('lp.moveDown','Move down')} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-25"><ChevronDown size={15}/></button>
                    <button onClick={()=>{if(confirm(t('lp.deleteBlockConfirm','Remove this section?')))pbDelete(i);}} title={t('lp.delete','Delete')} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>
                <div ref={el=>blockRefs.current[i]=el} className={pbWrapRef.current.className} dir={pbWrapRef.current.dir} contentEditable suppressContentEditableWarning onClick={onEditorClick} dangerouslySetInnerHTML={{__html:b.html}}/>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">{t('lp.editPageHelp','Each card is a section of your page • click text to edit • click an image to replace • reorder or delete with the buttons • Save when done')}</p>
        </div>
      </div>
    )}
  </DashboardLayout>);
}
