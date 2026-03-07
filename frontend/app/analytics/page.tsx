'use client';

import { motion } from 'framer-motion';
import { PieChart, TrendingUp, IndianRupee, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalAdvances: 0,
    totalDues: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/company/all');
      const companies = res.data;
      
      let dues = 0;
      let advances = 0;
      
      // Calculate from net bounds
      // net = +ve means we owe them (creditor)
      // net = -ve means they owe us (debtor)
      
      /* In a real scenario we'd query transactions or aggregate endpoints 
         For now just summing net balances if they returned from a full endpoint */
      
      setStats({
        totalCompanies: companies.length,
        totalAdvances: advances,
        totalDues: Math.abs(dues),
      });
      
    } catch (error) {
      console.error('Error fetching analytics', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
        <p className="text-gray-500">View overall financial metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <PieChart className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Firms</p>
          <h2 className="text-3xl font-bold">{loading ? '-' : stats.totalCompanies}</h2>
        </div>
        
        <div className="bg-white p-6 border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Receivables</p>
          <h2 className="text-3xl font-bold text-green-600">₹{loading ? '-' : '0.00'}</h2>
        </div>
        
        <div className="bg-white p-6 border rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Payables</p>
          <h2 className="text-3xl font-bold text-red-600">₹{loading ? '-' : '0.00'}</h2>
        </div>
      </div>

      <div className="bg-white p-8 border rounded-xl shadow-sm text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">More charts coming soon</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Detailed breakdown by company, monthly volume charts, and payment trend analysis will appear here.
        </p>
      </div>
    </main>
  );
}
