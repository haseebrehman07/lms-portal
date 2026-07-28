import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, Loader2, BarChart2 } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axiosConfig';

const AdminReportsTab = () => {
  const [trendData, setTrendData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [summaryStats, setSummaryStats] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Wire to actual backend endpoints
      const [completionsRes, performanceRes] = await Promise.all([
        api.get('/reports/completions'),
        api.get('/reports/course-performance')
      ]);

      // 1. Process Activity Trends (Completions)
      const trendRaw = completionsRes.data;
      let mappedTrend = [];
      if (Array.isArray(trendRaw)) {
        mappedTrend = trendRaw.map(item => ({ 
          name: item.month || item.date || item.name || 'Unknown', 
          current: item.count || item.completions || item.value || 0 
        }));
      } else if (typeof trendRaw === 'object') {
        mappedTrend = Object.entries(trendRaw).map(([key, val]) => ({ name: key, current: val }));
      }
      setTrendData(mappedTrend);

      // 2. Process Status Overview (Course Performance)
      const perfRaw = performanceRes.data;
      let mappedPerf = [];
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      
      if (Array.isArray(perfRaw)) {
        mappedPerf = perfRaw.map((item, i) => ({ 
          name: (item.status || item.name || 'Unknown').replace('_', ' ').toUpperCase(), 
          value: item.count || item.value || 0, 
          color: colors[i % colors.length] 
        }));
      } else if (typeof perfRaw === 'object') {
        mappedPerf = Object.entries(perfRaw).map(([key, val], i) => ({ 
          name: key.replace('_', ' ').toUpperCase(), 
          value: val, 
          color: colors[i % colors.length] 
        }));
      }
      setDistributionData(mappedPerf);

      // 3. Generate Basic Summary Stats from the pulled data
      const totalCompletions = mappedTrend.reduce((sum, item) => sum + item.current, 0);
      const totalEnrollments = mappedPerf.reduce((sum, item) => sum + item.value, 0);
      
      setSummaryStats([
        { title: 'Total Enrollments', value: totalEnrollments },
        { title: 'Total Completions', value: totalCompletions }
      ]);

    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError("Failed to fetch live report data. Check backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Hit the actual backend route that generates the PDF
      const response = await api.get('/reports/export-pdf', { 
        responseType: 'blob' // Essential for handling binary files
      });
      
      // Create a temporary link to force the browser to download the blob
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to generate PDF report.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
        <p className="font-medium">Compiling analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 text-red-600 p-8 rounded-xl flex flex-col items-center justify-center border border-red-200">
          <AlertCircle className="w-10 h-10 mb-3" />
          <p className="font-bold text-lg text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-gray-800">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Review activity trends and course statuses.</p>
        </div>
        <button 
          onClick={handleExportPDF} 
          disabled={isExporting}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-emerald-700 shadow-sm transition-colors disabled:bg-emerald-400 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generating PDF...</>
          ) : (
            <><Download className="w-5 h-5" /> Export Report PDF</>
          )}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {summaryStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.title}</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Trends Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Completions</h3>
          <div className="h-[300px] w-full">
            {trendData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">No completion data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" name="Completions" dataKey="current" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Overview Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Status Overview</h3>
          <div className="h-[250px] w-full relative">
            {distributionData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">No status data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={distributionData} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value" 
                    stroke="none"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminReportsTab;