'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CompanyResult {
  id: number;
  firm_name: string;
  owner_name: string;
}

interface ProductRow {
  name: string;
  quantity: string;
  unit: string;
  price_per_unit: string;
}

export default function AddTransactionPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>}>
      <AddTransactionPage />
    </Suspense>
  );
}

function AddTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Company selection
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CompanyResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Transaction fields
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('debit');
  const [amount, setAmount] = useState('');
  const [transactionNotes, setTransactionNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Auto-load company from URL
  useEffect(() => {
    const companyId = searchParams.get('company_id');
    if (companyId) {
      const fetchCompany = async () => {
        try {
          const res = await api.get(`/company/${companyId}`);
          setSelectedCompanyId(res.data.id);
          setCompanyName(res.data.firm_name);
          setSearchQuery(res.data.firm_name);
        } catch { }
        setInitialLoading(false);
      };
      fetchCompany();
    } else {
      setInitialLoading(false);
    }
  }, [searchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2 || selectedCompanyId) { setSearchResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/company/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
        setShowDropdown(res.data.length > 0);
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCompanyId]);

  const selectCompany = (company: CompanyResult) => {
    setSelectedCompanyId(company.id);
    setCompanyName(company.firm_name);
    setSearchQuery(company.firm_name);
    setShowDropdown(false);
  };

  const submitTransaction = async () => {
    if (!selectedCompanyId) return alert('Please select a company');
    if (!amount || parseFloat(amount) <= 0) return alert('Please enter a valid amount');

    setLoading(true);
    try {
      await api.post('/transaction/add', {
        company_id: selectedCompanyId,
        transaction_type: transactionType,
        amount: parseFloat(amount),
        transaction_notes: transactionNotes || null,
        transaction_done: paymentMethod ? { payment_method: paymentMethod, amount_paid: parseFloat(amount) } : null,
      });
      alert('Transaction added successfully!');
      router.push('/');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 hover:bg-white rounded-lg transition-all hover:shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Add Transaction</h1>
            <p className="text-xs text-gray-500">{companyName ? `${companyName} (ID: ${selectedCompanyId})` : 'Select a company'}</p>
          </div>
        </div>

        {/* Company Selection */}
        {!selectedCompanyId && (
          <div className="bg-white rounded-xl border shadow-sm p-6 mb-6 max-w-md mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Select Company</h2>
            </div>
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search company..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedCompanyId(null); }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {searchResults.map((c) => (
                    <button key={c.id} onClick={() => selectCompany(c)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0">
                      <p className="font-medium text-gray-900">{c.firm_name}</p>
                      <p className="text-xs text-gray-500">ID: {c.id} • {c.owner_name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction Form */}
        {selectedCompanyId && (
          <div className="space-y-4">
            {/* Transaction Type */}
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Transaction Type
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTransactionType('debit')}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    transactionType === 'debit'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ArrowUpRight className={`w-5 h-5 ${transactionType === 'debit' ? 'text-red-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className={`font-semibold ${transactionType === 'debit' ? 'text-red-700' : 'text-gray-700'}`}>You Gave ₹ (Debit)</p>
                    <p className="text-xs text-gray-500">Paid firm / Firm owes us</p>
                  </div>
                </button>
                <button
                  onClick={() => setTransactionType('credit')}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    transactionType === 'credit'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ArrowDownRight className={`w-5 h-5 ${transactionType === 'credit' ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className={`font-semibold ${transactionType === 'credit' ? 'text-green-700' : 'text-gray-700'}`}>You Got ₹ (Credit)</p>
                    <p className="text-xs text-gray-500">Got from firm / We owe firm</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount & Notes */}
            <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-xl font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction Notes</label>
                <textarea
                  placeholder="e.g. Partial payment received..."
                  value={transactionNotes}
                  onChange={(e) => setTransactionNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { value: 'cash', label: '💵 Cash' },
                    { value: 'upi', label: '📱 UPI' },
                    { value: 'card', label: '💳 Card' },
                    { value: 'bank', label: '🏦 Bank' },
                    { value: 'cheque', label: '📝 Cheque' },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(paymentMethod === m.value ? '' : m.value)}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                        paymentMethod === m.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push('/')} className="flex-1">Cancel</Button>
              <Button onClick={submitTransaction} isLoading={loading} disabled={!amount || parseFloat(amount) <= 0} className="flex-[2]">
                Save Transaction
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </main>
  );
}
