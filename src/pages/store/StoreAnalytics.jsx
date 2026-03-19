import React,{useState,useEffect} from'react';import{useStoreManagement}from'../../hooks/useStore';import DashboardLayout from'../../components/shared/DashboardLayout';import api from'../../utils/api';import{BarChart3,TrendingUp,Eye,ShoppingCart,DollarSign}from'lucide-react';
import{AreaChart,Area,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer}from'recharts';
export default function StoreAnalytics(){const{currentStore}=useStoreManagement();const[data,setData]=useState(null);
useEffect(()=>{if(!currentStore?.id)return;api.get(`/owner/stores/${currentStore.id}/dashboard`).then(r=>setData(r.data)).catch(()=>{});},[currentStore?.id]);
const stats=data?.stats||{};const salesData=data?.salesData||[];
// Generate sample data if no real data
const chartData=salesData.length>0?salesData:Array.from({length:7},(_,i)=>({date:`Day ${i+1}`,revenue:0,orders:0}));
return(<DashboardLayout>
<div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">Analytics</h1><div className="flex gap-2"><select className="input-field !w-40 !py-2 text-sm"><option>Last 30 days</option><option>Last 7 days</option><option>This month</option></select><button className="btn-ghost text-xs">Auto-refresh</button></div></div>
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
<div className="glass-card-solid p-5"><p className="text-xs text-gray-400 mb-1">Total Sales</p><p className="text-2xl font-bold">{parseFloat(stats.totalRevenue||0).toLocaleString()}DZD</p><span className="text-xs text-emerald-500">↑ 12%</span></div>
<div className="glass-card-solid p-5"><p className="text-xs text-gray-400 mb-1">Store Sessions</p><p className="text-2xl font-bold">{stats.storeVisits||0}</p><span className="text-xs text-red-500">↓ 5%</span></div>
<div className="glass-card-solid p-5"><p className="text-xs text-gray-400 mb-1">Returning Customer Rate</p><p className="text-2xl font-bold">{stats.totalCustomers>0?'15.4%':'0%'}</p></div>
<div className="glass-card-solid p-5"><p className="text-xs text-gray-400 mb-1">Average Order Value</p><p className="text-2xl font-bold">{parseFloat(stats.avgOrderValue||0).toLocaleString()}DZD</p></div>
</div>
<div className="grid lg:grid-cols-2 gap-6">
<div className="glass-card-solid p-6"><div className="flex items-center justify-between mb-4"><h3 className="font-bold">Sales over time</h3><button className="text-xs text-brand-500">View report</button></div><div style={{height:250}}><ResponsiveContainer><AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="date" tick={{fontSize:11}} tickFormatter={v=>typeof v==='string'&&v.length>5?v.slice(5):v}/><YAxis tick={{fontSize:11}}/><Tooltip/><Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B98120" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></div>
<div className="glass-card-solid p-6"><div className="flex items-center justify-between mb-4"><h3 className="font-bold">Top Products by Units Sold</h3><button className="text-xs text-brand-500">View report</button></div>{data?.recentOrders?.length>0?<p className="text-gray-400 text-sm">Product data will appear after orders.</p>:<div className="flex items-center justify-center h-48 text-gray-300"><BarChart3 size={48}/></div>}</div>
</div></DashboardLayout>);}
