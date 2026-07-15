import React, { useState, useEffect } from 'react';
import { Download, Filter, ArrowUpRight, ArrowDownRight, FileText, BarChart2, CheckCircle, Users, Play, Loader2, AlertCircle } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api/axiosConfig';

const AdminReportsTab = () => {
  const [reportType, setReportType] = useState('overall');
  const [dateRange, setDateRange] = useState('current_month');
  const [comparisonMode, setComparisonMode] = useState(true);
  
  const [p1Start, setP1Start] = useState('');
  const [p1End, setP1End] = useState('');
  const [p2Start, setP2Start] = useState('');
  const [p2End, setP2End] = useState('');

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build Query Parameters
      const params = new URLSearchParams({
        type: reportType,
        range: dateRange,
        compare: comparisonMode,
        p1Start, p1End, p2Start, p2End
      });

      const response = await api.get(`/dashboard/stats?${params.toString()}`);
      setReportData(response.data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError("Failed to fetch live report data. Check backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchReportData();
  }, []);

  const handleApplyFilters = () => {
    if (dateRange === 'custom') {
      if (!p1Start || !p1End) return alert("Please select a Start and End date for the Primary Period.");
      if (comparisonMode && (!p2Start || !p2End)) return alert("Please select a Start and End date for the Comparison Period.");
    }
    fetchReportData();
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-gray-800">
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-printable-area, #report-printable-area * { visibility: visible; }
          #report-printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .recharts-tooltip-wrapper { display: none !important; }
        }
      `}</style>

      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate, compare, and export academic analytics.</p>
        </div>
        <button onClick={handleExportPDF} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 shadow-sm">
          <Download className="w-5 h-5" /> Export Report PDF
        </button>
      </div>

      {/* --- FILTER CONTROLS --- */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="border border-gray-300 rounded-md text-sm p-1.5 outline-none bg-white">
              <option value="overall">Overall Performance</option>
              <option value="academic">Academic Grades</option>
              <option value="attendance">Attendance Trends</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="border border-gray-300 rounded-md text-sm p-1.5 outline-none bg-white">
              <option value="current_month">Current Month</option>
              <option value="current_semester">Current Semester</option>
              <option value="current_year">Current Year</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
              <input type="checkbox" checked={comparisonMode} onChange={(e) => setComparisonMode(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" /> Compare Previous
            </label>
            <button onClick={handleApplyFilters} className="ml-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm shadow-sm hover:bg-blue-700">
              <Play className="w-4 h-4 fill-current" /> Generate Report
            </button>
          </div>
        </div>

        {/* Custom Dates */}
        {dateRange === 'custom' && (
          <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Period</span>
              <div className="flex items-center gap-2">
                <input type="date" value={p1Start} onChange={(e) => setP1Start(e.target.value)} className="border border-gray-300 rounded-md text-sm p-1.5" />
                <span className="text-gray-400 text-sm">to</span>
                <input type="date" min={p1Start} value={p1End} onChange={(e) => setP1End(e.target.value)} className="border border-gray-300 rounded-md text-sm p-1.5" />
              </div>
            </div>

            {comparisonMode && (
              <div className="flex flex-col gap-2 pl-8 border-l border-gray-100">
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Comparison Period</span>
                <div className="flex items-center gap-2">
                  <input type="date" value={p2Start} onChange={(e) => setP2Start(e.target.value)} className="border border-blue-200 rounded-md text-sm p-1.5 bg-blue-50 text-blue-800" />
                  <span className="text-gray-400 text-sm">to</span>
                  <input type="date" min={p2Start} value={p2End} onChange={(e) => setP2End(e.target.value)} className="border border-blue-200 rounded-md text-sm p-1.5 bg-blue-50 text-blue-800" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
          <p>Processing report data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl flex flex-col items-center justify-center min-h-[200px] border border-red-200">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="font-medium text-center">{error}</p>
        </div>
      ) : reportData ? (
        <div id="report-printable-area" className="space-y-6 print:space-y-8 bg-gray-50 print:bg-white rounded-xl">
          {/* Header */}
          <div className="hidden print:block text-center border-b-2 border-gray-800 pb-6 mb-8 mt-4">
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-widest">Institution LMS</h1>
            <h2 className="text-xl font-semibold text-gray-700 mt-2 capitalize">{reportType.replace('_', ' ')} Report</h2>
            <div className="flex justify-between text-sm text-gray-600 mt-6 px-8">
              <span className="font-medium">Generated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:grid-cols-4">
            {reportData.summaryStats?.map((stat, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3 print:break-inside-avoid">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Activity Trends</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" name="Current" dataKey="current" stroke="#3b82f6" strokeWidth={3} />
                    {comparisonMode && <Line type="monotone" name="Previous" dataKey="previous" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Status Overview</h3>
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reportData.distributionData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {reportData.distributionData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminReportsTab;