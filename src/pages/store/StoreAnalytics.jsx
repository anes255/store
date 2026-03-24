import React,{useState,useEffect} from'react';import{useStoreManagement}from'../../hooks/useStore';import DashboardLayout from'../../components/shared/DashboardLayout';import api from'../../utils/api';import{BarChart3,TrendingUp,ShoppingCart,DollarSign,Users,RefreshCw}from'lucide-react';
import{AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer}from'recharts';
export default function StoreAnalytics(){const{currentStore}=useStoreManagement();const[data,setData]=useState(null);const[loading,setLoading]=useState(true);
const load=()=>{if(!currentStore?.id)return;setLoading(true);api.get(`/owner/stores/${currentStore.id}/dashboard`).then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));};
useEffect(()=>{load();},[currentStore?.id]);
const s=data?.stats||{};const salesData=data?.salesData||[];
const avgOV=s.totalOrders>0?Math.round(s.totalRevenue/s.totalOrders):0;
const convRate=s.storeVisits>0?((s.totalOrders/s.storeVisits)*100).toFixed(1):0;
return(<DashboardLayout>
<div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold">Analytics</h1><p className="text-sm text-gray-400 mt-1">{currentStore?.name||'Store'} performance</p></div><button onClick={load} className="btn-ghost text-xs flex items-center gap-1"><RefreshCw size={14}/>Refresh</button></div>
{loading?<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin"/></div>:<>
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
<div className="glass-card-solid p-5"><p className="text-xs text-gray-400 mb-1">Total Revenue</p><p className="text-2xl font-black">{parseFloat(s.totalRevenue||0).toLocaleString()} <span className="text-xs font-normal text-gray-400">DZD</span></p></div>
<div className="glass-card-solid p-5"><p className="text-xs text-gray-400 mb-1">Total Orders</p><p className="text-2xl font-black">{s.totalOrders||0}</p></div>
<div className="glass-card-solid p-5"><p className="text-xs text-gray-400 mb-1">Customers</p><p className="text-2xl font-black">{s.totalCustomers||0}</p></div>
<div className="glass-card-solid p-5"><p className="text-xs text-gray-400 mb-1">Avg Order</p><p className="text-2xl font-black">{avgOV.toLocaleString()} <span className="text-xs font-normal text-gray-400">DZD</span></p></div>
</div>
<div className="grid grid-cols-3 gap-4 mb-6">
<div className="glass-card-solid p-4 text-center"><p className="text-xs text-gray-400">Visits</p><p className="text-xl font-black">{s.storeVisits||0}</p></div>
<div className="glass-card-solid p-4 text-center"><p className="text-xs text-gray-400">Conversion</p><p className="text-xl font-black">{convRate}%</p></div>
<div className="glass-card-solid p-4 text-center"><p className="text-xs text-gray-400">Products</p><p className="text-xl font-black">{s.totalProducts||0}</p></div>
</div>
<div className="grid lg:grid-cols-2 gap-6">
<div className="glass-card-solid p-6"><h3 className="font-bold mb-4">Revenue (30 Days)</h3>{salesData.length>0?<div style={{height:250}}><ResponsiveContainer><AreaChart data={salesData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={v=>typeof v==='string'&&v.length>5?v.slice(5):v}/><YAxis tick={{fontSize:10}}/><Tooltip/><Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B98120" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>:<p className="text-center py-16 text-gray-400 text-sm">No sales data yet</p>}</div>
<div className="glass-card-solid p-6"><h3 className="font-bold mb-4">Recent Orders</h3>{data?.recentOrders?.length>0?<div className="space-y-2">{data.recentOrders.slice(0,8).map(o=><div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><p className="text-xs font-mono font-bold text-brand-600">{o.order_number}</p><p className="text-xs text-gray-400">{o.customer_name}</p></div><div className="text-right"><p className="text-sm font-bold">{parseFloat(o.total).toLocaleString()} DZD</p><span className={`text-[10px] font-bold ${o.status==='delivered'?'text-emerald-600':o.status==='pending'?'text-amber-600':'text-blue-600'}`}>{o.status}</span></div></div>)}</div>:<p className="text-center py-16 text-gray-400 text-sm">No orders yet</p>}</div>
</div></>}
</DashboardLayout>);}
