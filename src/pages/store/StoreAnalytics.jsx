import React,{useState,useEffect,useMemo,useRef} from'react';import{useStoreManagement}from'../../hooks/useStore';import DashboardLayout from'../../components/shared/DashboardLayout';import api from'../../utils/api';import{BarChart3,TrendingUp,ShoppingCart,DollarSign,Users,RefreshCw,ArrowUpRight,ArrowDownRight}from'lucide-react';
import{AreaChart,Area,BarChart,Bar,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend}from'recharts';
import { useTranslation } from 'react-i18next';

const STATUS_COLORS={pending:'#f59e0b',new_order:'#f59e0b',pending_payment:'#eab308',confirmed:'#3b82f6',preparing:'#8b5cf6',shipped:'#06b6d4',in_transit:'#0ea5e9',delivered:'#10b981',cancelled:'#ef4444',canceled:'#ef4444',returned:'#f97316',refunded:'#6b7280'};
// Stores can define their own statuses; give those distinct colours too.
const FALLBACK_COLORS=['#6366f1','#ec4899','#14b8a6','#f97316','#84cc16','#a855f7','#0ea5e9','#64748b'];

export default function StoreAnalytics(){
  const { t } = useTranslation();
  const{currentStore}=useStoreManagement();
  const[data,setData]=useState(null);
  const[loading,setLoading]=useState(true);
  const[dateRange,setDateRange]=useState('30d');

  // Everything on this page comes from /analytics, computed server-side over
  // ALL orders in the selected range (not the dashboard's 10 latest orders).
  const[error,setError]=useState(false);
  // Only the latest request may update the page — switching the range quickly
  // (or React's double effect in dev) otherwise let an older reply win.
  const reqId=useRef(0);
  const load=()=>{if(!currentStore?.id)return;const id=++reqId.current;setLoading(true);setError(false);
    api.get(`/owner/stores/${currentStore.id}/analytics`,{params:{range:dateRange},timeout:45000})
      .then(r=>{if(id===reqId.current)setData(r.data);})
      .catch(()=>{if(id===reqId.current){setData(null);setError(true);}})
      .finally(()=>{if(id===reqId.current)setLoading(false);});};
  useEffect(()=>{load();},[currentStore?.id,dateRange]);

  const tot=data?.totals||{};
  const unit=data?.unit||'day';
  const filteredSales=useMemo(()=>(data?.series||[]).map(d=>({date:d.date,revenue:Number(d.revenue)||0,orders:Number(d.orders)||0})),[data]);
  const filteredOrders=data?.recentOrders||[];
  const filteredStats={totalRevenue:tot.revenue||0,totalOrders:tot.orders||0};
  const s={totalCustomers:tot.customers||0,storeVisits:tot.visits||0,totalProducts:tot.products||0};
  const avgOV=tot.avgOrder||0;
  const convRate=tot.conversion||0;
  const statusBreakdown=useMemo(()=>(data?.status||[]).map((r,i)=>({name:String(r.name).replace(/_/g,' '),value:r.value,fill:STATUS_COLORS[r.name]||FALLBACK_COLORS[i%FALLBACK_COLORS.length]})),[data]);
  const topProducts=useMemo(()=>(data?.topProducts||[]).map(p=>({name:p.name.length>18?p.name.slice(0,18)+'…':p.name,qty:p.qty})),[data]);

  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtDate=(v)=>{const p=String(v||'').split('-');if(p.length<3)return v;return unit==='month'?`${MONTHS[+p[1]-1]} ${p[0].slice(2)}`:`${p[2]}/${p[1]}`;};
  const currency=currentStore?.currency||'DZD';

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 size={22} className="text-brand-500"/>{t('storePage.analytics','Analytics')}</h1><p className="text-sm text-gray-400 mt-1">{currentStore?.name||t('storePage.store','Store')} {t('storePage.performance','performance')}</p></div>
      <div className="flex items-center gap-2">
        <select value={dateRange} onChange={e=>setDateRange(e.target.value)} className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 font-medium">
          <option value="7d">{t('storePage.last7Days','Last 7 Days')}</option>
          <option value="30d">{t('storePage.last30Days','Last 30 Days')}</option>
          <option value="3m">{t('storePage.last3Months','Last 3 Months')}</option>
          <option value="6m">{t('storePage.last6Months','Last 6 Months')}</option>
          <option value="1y">{t('storePage.lastYear','Last Year')}</option>
          <option value="all">{t('storePage.allTime','All Time')}</option>
        </select>
        <button onClick={load} className="btn-ghost text-xs flex items-center gap-1"><RefreshCw size={14}/>{t('storePage.refresh','Refresh')}</button>
      </div>
    </div>

    {loading?<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin"/></div>:error?<div className="glass-card-solid p-8 text-center"><p className="text-sm text-gray-500 mb-3">{t('storePage.analyticsLoadFailed','Could not load analytics.')}</p><button onClick={load} className="btn-primary text-xs">{t('storePage.retry','Retry')}</button></div>:<>

    {/* Stat cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[
        {label:t('storePage.totalRevenue','Total Revenue'),value:`${parseFloat(filteredStats.totalRevenue||0).toLocaleString()} ${currency}`,icon:DollarSign,gradient:'from-emerald-500 to-teal-500'},
        {label:t('storePage.totalOrders','Total Orders'),value:filteredStats.totalOrders||0,icon:ShoppingCart,gradient:'from-purple-500 to-pink-500'},
        {label:t('storePage.customers','Customers'),value:s.totalCustomers||0,icon:Users,gradient:'from-blue-500 to-cyan-500'},
        {label:t('storePage.avgOrder','Avg Order'),value:`${avgOV.toLocaleString()} ${currency}`,icon:TrendingUp,gradient:'from-amber-500 to-orange-500'},
      ].map((c,i)=>{const Icon=c.icon;return(
        <div key={i} className="glass-card-solid p-5">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-md`}><Icon size={16} className="text-white"/></div>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{c.label}</p>
          <p className="text-xl font-black text-gray-900 mt-0.5">{c.value}</p>
        </div>
      );})}
    </div>

    {/* Secondary stats */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="glass-card-solid p-4 text-center"><p className="text-xs text-gray-400">{t('storePage.storeVisits','Store Visits')}</p><p className="text-xl font-black">{(s.storeVisits||0).toLocaleString()}</p></div>
      <div className="glass-card-solid p-4 text-center"><p className="text-xs text-gray-400">{t('storePage.conversionRate','Conversion Rate')}</p><p className="text-xl font-black">{convRate}%</p></div>
      <div className="glass-card-solid p-4 text-center"><p className="text-xs text-gray-400">{t('storePage.products','Products')}</p><p className="text-xl font-black">{s.totalProducts||0}</p></div>
    </div>

    {/* Revenue + Orders chart */}
    <div className="glass-card-solid p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{t('storePage.revenueOrdersChart','Revenue & Orders')}</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-emerald-500"/>{t('storePage.revenue','Revenue')}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-violet-500"/>{t('storePage.orders','Orders')}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={filteredSales}>
          <defs>
            <linearGradient id="aRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="aOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
          <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false}/>
          {/* Revenue (thousands of DZD) and order counts on separate axes — on one
              shared axis the orders line was pinned flat at zero. */}
          <YAxis yAxisId="rev" stroke="#10B981" fontSize={11} tickLine={false} axisLine={false} width={56} tickFormatter={v=>v>=1000?`${Math.round(v/1000)}k`:v}/>
          <YAxis yAxisId="ord" orientation="right" stroke="#8B5CF6" fontSize={11} tickLine={false} axisLine={false} width={32} allowDecimals={false}/>
          <Tooltip labelFormatter={fmtDate} contentStyle={{borderRadius:12,border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)',fontSize:12}} formatter={(v,name)=>[`${parseFloat(v).toLocaleString()}${name==='revenue'?` ${currency}`:''}`,name==='revenue'?t('storePage.revenue','Revenue'):t('storePage.orders','Orders')]}/>
          <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fill="url(#aRevenue)"/>
          <Area yAxisId="ord" type="monotone" dataKey="orders" stroke="#8B5CF6" strokeWidth={2} fill="url(#aOrders)"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>

    {/* Order status + Top products */}
    <div className="grid lg:grid-cols-2 gap-6 mb-6">
      <div className="glass-card-solid p-6">
        <h3 className="font-bold text-gray-900 mb-4">{t('storePage.orderStatusBreakdown','Order Status Breakdown')}</h3>
        {statusBreakdown.length>0?(
          <div className="flex items-center gap-6">
            <div className="w-44 h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={68} innerRadius={42} paddingAngle={2} strokeWidth={0}>
                  {statusBreakdown.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie><Tooltip contentStyle={{borderRadius:8,border:'none',fontSize:12}}/></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {statusBreakdown.map(s=>(
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor:s.fill}}/><span className="text-sm capitalize text-gray-700">{s.name}</span></div>
                  <span className="text-sm font-bold text-gray-900 shrink-0 ml-3 whitespace-nowrap tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ):<p className="text-center py-12 text-gray-400 text-sm">{t('storePage.noOrderData','No order data yet')}</p>}
      </div>

      <div className="glass-card-solid p-6">
        <h3 className="font-bold text-gray-900 mb-4">{t('storePage.topProducts','Top Products')}</h3>
        {topProducts.length>0?(
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} layout="vertical" margin={{left:0,right:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
              <XAxis type="number" fontSize={11} stroke="#9ca3af" tickLine={false} axisLine={false}/>
              <YAxis type="category" dataKey="name" fontSize={11} stroke="#9ca3af" width={110} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{borderRadius:8,border:'none',fontSize:12}}/>
              <Bar dataKey="qty" fill="#7C3AED" radius={[0,6,6,0]} barSize={20} name={t('storePage.quantitySold','Quantity sold')}/>
            </BarChart>
          </ResponsiveContainer>
        ):<p className="text-center py-12 text-gray-400 text-sm">{t('storePage.noProductData','No product data yet')}</p>}
      </div>
    </div>

    {/* Recent orders */}
    <div className="glass-card-solid p-6">
      <h3 className="font-bold text-gray-900 mb-4">{t('storePage.recentOrders','Recent Orders')}</h3>
      {filteredOrders.length>0?(
        <div className="space-y-2">
          {filteredOrders.slice(0,10).map(o=>(
            <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:STATUS_COLORS[(o.status||'').toLowerCase()]||'#9ca3af'}}/>
                <div><p className="text-xs font-mono font-bold text-brand-600">{o.order_number}</p><p className="text-xs text-gray-400">{o.customer_name}</p></div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{parseFloat(o.total).toLocaleString()} {currency}</p>
                <span className="text-[10px] font-bold capitalize" style={{color:STATUS_COLORS[(o.status||'').toLowerCase()]||'#9ca3af'}}>{String(o.status||'').replace(/_/g,' ')}</span>
              </div>
            </div>
          ))}
        </div>
      ):<p className="text-center py-12 text-gray-400 text-sm">{t('storePage.noOrdersYet','No orders yet')}</p>}
    </div>
    </>}
  </DashboardLayout>);
}
