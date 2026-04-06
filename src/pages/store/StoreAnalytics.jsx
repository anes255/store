import React,{useState,useEffect,useMemo} from'react';import{useStoreManagement}from'../../hooks/useStore';import DashboardLayout from'../../components/shared/DashboardLayout';import api from'../../utils/api';import{BarChart3,TrendingUp,ShoppingCart,DollarSign,Users,RefreshCw,ArrowUpRight,ArrowDownRight}from'lucide-react';
import{AreaChart,Area,BarChart,Bar,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend}from'recharts';

const STATUS_COLORS={pending:'#f59e0b',confirmed:'#3b82f6',preparing:'#8b5cf6',shipped:'#06b6d4',delivered:'#10b981',cancelled:'#ef4444',refunded:'#6b7280'};

export default function StoreAnalytics(){
  const{currentStore}=useStoreManagement();
  const[data,setData]=useState(null);
  const[loading,setLoading]=useState(true);

  const load=()=>{if(!currentStore?.id)return;setLoading(true);api.get(`/owner/stores/${currentStore.id}/dashboard`).then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[currentStore?.id]);

  const s=data?.stats||{};
  const rawSales=data?.salesData||[];
  const salesData=useMemo(()=>{
    if(rawSales.length>=2)return rawSales.map(d=>({...d,revenue:parseFloat(d.revenue||d.total||0),orders:parseInt(d.orders||d.count||0)}));
    return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return{date:d.toISOString().split('T')[0],revenue:0,orders:0};});
  },[rawSales]);

  const avgOV=s.totalOrders>0?Math.round(s.totalRevenue/s.totalOrders):0;
  const convRate=s.storeVisits>0?((s.totalOrders/s.storeVisits)*100).toFixed(1):0;

  // Order status breakdown for pie/bar
  const statusBreakdown=useMemo(()=>{
    const counts={};
    (data?.recentOrders||[]).forEach(o=>{const st=(o.status||'pending').toLowerCase();counts[st]=(counts[st]||0)+1;});
    return Object.entries(counts).map(([name,value])=>({name,value,fill:STATUS_COLORS[name]||'#9ca3af'}));
  },[data?.recentOrders]);

  // Top products by frequency in orders
  const topProducts=useMemo(()=>{
    const freq={};
    (data?.recentOrders||[]).forEach(o=>{
      (o.items||[]).forEach(it=>{const n=it.name||it.product_name||'Unknown';freq[n]=(freq[n]||0)+(parseInt(it.quantity)||1);});
    });
    return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,qty])=>({name:name.length>18?name.slice(0,18)+'…':name,qty}));
  },[data?.recentOrders]);

  const fmtDate=(v)=>{try{const p=(v||'').split('-');return p.length>=3?`${p[1]}/${p[2]}`:v;}catch{return v;}};
  const currency=currentStore?.currency||'DZD';

  return(<DashboardLayout>
    <div className="flex items-center justify-between mb-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 size={22} className="text-brand-500"/>Analytics</h1><p className="text-sm text-gray-400 mt-1">{currentStore?.name||'Store'} performance</p></div>
      <button onClick={load} className="btn-ghost text-xs flex items-center gap-1"><RefreshCw size={14}/>Refresh</button>
    </div>

    {loading?<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin"/></div>:<>

    {/* Stat cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[
        {label:'Total Revenue',value:`${parseFloat(s.totalRevenue||0).toLocaleString()} ${currency}`,icon:DollarSign,gradient:'from-emerald-500 to-teal-500'},
        {label:'Total Orders',value:s.totalOrders||0,icon:ShoppingCart,gradient:'from-purple-500 to-pink-500'},
        {label:'Customers',value:s.totalCustomers||0,icon:Users,gradient:'from-blue-500 to-cyan-500'},
        {label:'Avg Order',value:`${avgOV.toLocaleString()} ${currency}`,icon:TrendingUp,gradient:'from-amber-500 to-orange-500'},
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
      <div className="glass-card-solid p-4 text-center"><p className="text-xs text-gray-400">Store Visits</p><p className="text-xl font-black">{(s.storeVisits||0).toLocaleString()}</p></div>
      <div className="glass-card-solid p-4 text-center"><p className="text-xs text-gray-400">Conversion Rate</p><p className="text-xl font-black">{convRate}%</p></div>
      <div className="glass-card-solid p-4 text-center"><p className="text-xs text-gray-400">Products</p><p className="text-xl font-black">{s.totalProducts||0}</p></div>
    </div>

    {/* Revenue + Orders chart */}
    <div className="glass-card-solid p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Revenue & Orders (Last 30 Days)</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-emerald-500"/>Revenue</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-violet-500"/>Orders</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={salesData}>
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
          <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false}/>
          <Tooltip contentStyle={{borderRadius:12,border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)',fontSize:12}} formatter={(v,name)=>[`${parseFloat(v).toLocaleString()}${name==='revenue'?` ${currency}`:''}`,name==='revenue'?'Revenue':'Orders']}/>
          <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fill="url(#aRevenue)"/>
          <Area type="monotone" dataKey="orders" stroke="#8B5CF6" strokeWidth={2} fill="url(#aOrders)"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>

    {/* Order status + Top products */}
    <div className="grid lg:grid-cols-2 gap-6 mb-6">
      <div className="glass-card-solid p-6">
        <h3 className="font-bold text-gray-900 mb-4">Order Status Breakdown</h3>
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
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor:s.fill}}/><span className="text-sm capitalize text-gray-700">{s.name}</span></div>
                  <span className="text-sm font-bold text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ):<p className="text-center py-12 text-gray-400 text-sm">No order data yet</p>}
      </div>

      <div className="glass-card-solid p-6">
        <h3 className="font-bold text-gray-900 mb-4">Top Products</h3>
        {topProducts.length>0?(
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} layout="vertical" margin={{left:0,right:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
              <XAxis type="number" fontSize={11} stroke="#9ca3af" tickLine={false} axisLine={false}/>
              <YAxis type="category" dataKey="name" fontSize={11} stroke="#9ca3af" width={110} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{borderRadius:8,border:'none',fontSize:12}}/>
              <Bar dataKey="qty" fill="#7C3AED" radius={[0,6,6,0]} barSize={20} name="Quantity sold"/>
            </BarChart>
          </ResponsiveContainer>
        ):<p className="text-center py-12 text-gray-400 text-sm">No product data yet</p>}
      </div>
    </div>

    {/* Recent orders */}
    <div className="glass-card-solid p-6">
      <h3 className="font-bold text-gray-900 mb-4">Recent Orders</h3>
      {data?.recentOrders?.length>0?(
        <div className="space-y-2">
          {data.recentOrders.slice(0,10).map(o=>(
            <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:STATUS_COLORS[(o.status||'').toLowerCase()]||'#9ca3af'}}/>
                <div><p className="text-xs font-mono font-bold text-brand-600">{o.order_number}</p><p className="text-xs text-gray-400">{o.customer_name}</p></div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{parseFloat(o.total).toLocaleString()} {currency}</p>
                <span className="text-[10px] font-bold capitalize" style={{color:STATUS_COLORS[(o.status||'').toLowerCase()]||'#9ca3af'}}>{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      ):<p className="text-center py-12 text-gray-400 text-sm">No orders yet</p>}
    </div>
    </>}
  </DashboardLayout>);
}
