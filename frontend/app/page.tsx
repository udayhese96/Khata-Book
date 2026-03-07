'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import Link from 'next/link';
import { Building2, IndianRupee, TrendingUp, Search, X, PlusCircle, Package, ChevronDown, ChevronRight, Wallet, Clock, Truck, List, LayoutGrid, CreditCard, ArrowUpRight, ArrowDownRight, Users, Table2 } from 'lucide-react';

interface Company {
  id: number;
  firm_name: string;
  owner_name: string;
  owner_phone: string;
  address: string;
  contact_persons: { name: string; phone: string; post?: string }[];
  created_at: string;
  updated_at: string | null;
}

interface Purchase {
  id: number;
  company_id: number;
  products: any[];
  vehicle_number: string | null;
  notes: string | null;
  bill: { total_amount: number; amount_paid: number; remaining: number };
  purchase_date: string;
  created_at: string;
}

interface Transaction {
  id: number;
  company_id: number;
  transaction_type: 'credit' | 'debit';
  amount: number;
  net_amount: number;
  transaction_notes: string | null;
  product_details: any;
  vehicle_number: string | null;
  notes: string | null;
  amount_paid: number | null;
  transaction_done: any;
  timestamp_ist: string;
  created_at: string;
}

const formatDate = (timestamp: string) => {
  try {
    const date = new Date(timestamp.replace(' ', 'T') + '+05:30');
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'Asia/Kolkata'
    }) + ' IST';
  } catch { return timestamp; }
};

const formatShortDate = (timestamp: string) => {
  try {
    const date = new Date(timestamp.replace(' ', 'T') + '+05:30');
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  } catch { return timestamp; }
};

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Company detail data
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [netBalance, setNetBalance] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Tab state in the modal
  const [activeTab, setActiveTab] = useState<'purchases' | 'transactions'>('purchases');
  const [txnViewMode, setTxnViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/company/all');
      setCompanies(res.data);
    } catch (error) {
      console.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = async (company: Company) => {
    setSelectedCompany(company);
    setActiveTab('purchases');
    setLoadingDetails(true);
    try {
      const res = await api.get(`/company/${company.id}/full`);
      setPurchases(res.data.purchases || []);
      setTransactions(res.data.transactions || []);
      setNetBalance(res.data.net_balance || 0);
    } catch (error) {
      console.error('Failed to fetch company details');
      setPurchases([]); setTransactions([]); setNetBalance(0);
    } finally {
      setLoadingDetails(false);
    }
  };

  // KPI Calculations
  const totalCompanies = companies.length;

  const filteredCompanies = companies.filter(c =>
    c.firm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">B2B Expense Tracker</h1>
          <p className="text-gray-500 text-sm">Manage companies, purchases & transactions</p>
        </div>
        <div className="flex gap-3">
          <Link href="/add-purchase">
            <Button className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Add Purchase
            </Button>
          </Link>
          <Link href="/add-transaction">
            <Button variant="outline" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <GlassCard className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Companies</p>
            <p className="text-2xl font-bold">{totalCompanies}</p>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <PlusCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Quick Actions</p>
            <Link href="/register-company" className="text-sm text-blue-600 hover:underline font-medium">Register New Company →</Link>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Manage</p>
            <div className="flex gap-3 text-sm">
              <Link href="/add-purchase" className="text-blue-600 hover:underline">Purchase</Link>
              <Link href="/add-transaction" className="text-blue-600 hover:underline">Transaction</Link>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by firm name or owner name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12"
        />
      </div>

      {/* Company Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-black/5">
              <tr>
                <th className="text-left p-4 font-semibold w-[5%]">#</th>
                <th className="text-left p-4 font-semibold w-[25%]">Firm Name</th>
                <th className="text-left p-4 font-semibold hidden lg:table-cell w-[20%]">Owner</th>
                <th className="text-left p-4 font-semibold hidden sm:table-cell w-[15%]">Phone</th>
                <th className="text-left p-4 font-semibold hidden xl:table-cell w-[15%]">Contacts</th>
                <th className="text-center p-4 font-semibold w-[20%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center p-8 text-gray-500">Loading...</td></tr>
              ) : filteredCompanies.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-8 text-gray-500">No companies found</td></tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="border-t border-black/5 hover:bg-black/5 transition-colors">
                    <td className="p-4 text-gray-400 text-sm">{company.id}</td>
                    <td className="p-4 font-medium truncate">{company.firm_name}</td>
                    <td className="p-4 text-gray-600 hidden lg:table-cell truncate">{company.owner_name}</td>
                    <td className="p-4 text-gray-600 hidden sm:table-cell">{company.owner_phone}</td>
                    <td className="p-4 hidden xl:table-cell">
                      {company.contact_persons && company.contact_persons.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">{company.contact_persons.length} contact(s)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/add-purchase?company_id=${company.id}`}
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                          title="Add Purchase"
                        >
                          <Package className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/add-transaction?company_id=${company.id}`}
                          className="p-1.5 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                          title="Add Transaction"
                        >
                          <CreditCard className="w-4 h-4" />
                        </Link>
                        <Button
                          variant="outline"
                          className="text-xs py-1 px-3 h-auto whitespace-nowrap"
                          onClick={() => handleSelectCompany(company)}
                        >
                          View Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Company Detail Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedCompany(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold truncate">{selectedCompany.firm_name}</h2>
                    <p className="text-xs text-gray-500">Company ID: {selectedCompany.id}</p>
                  </div>
                  <button onClick={() => setSelectedCompany(null)} className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Owner & Contact Persons */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-blue-600 text-[10px] font-bold">O</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{selectedCompany.owner_name}</p>
                      <p className="text-gray-500 text-xs">{selectedCompany.owner_phone} • {selectedCompany.address}</p>
                    </div>
                  </div>

                  {selectedCompany.contact_persons && selectedCompany.contact_persons.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedCompany.contact_persons.map((cp: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-green-600 text-[10px] font-bold">C{idx + 1}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 text-xs truncate">
                              {cp.name}
                              {cp.post && <span className="text-gray-400 font-normal"> ({cp.post})</span>}
                            </p>
                            <p className="text-gray-500 text-xs">{cp.phone || 'No phone'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Net Balance Card */}
              <div className="px-4 sm:px-5 pt-4">
                <div className={`p-3 sm:p-4 rounded-xl border flex items-center justify-between ${
                  netBalance < 0
                    ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200'
                    : netBalance > 0
                      ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-gray-500">Net Balance</span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {netBalance < 0 ? 'Firm owes us' : netBalance > 0 ? 'We owe firm' : 'Settled'}
                    </p>
                  </div>
                  <span className={`text-2xl sm:text-3xl font-bold ${
                    netBalance < 0 ? 'text-red-700' : netBalance > 0 ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    ₹{Math.abs(netBalance).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 sm:px-5 pt-3">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('purchases')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'purchases' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Package className="w-4 h-4 inline mr-1.5" />
                    Purchases ({purchases.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'transactions' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <CreditCard className="w-4 h-4 inline mr-1.5" />
                    Transactions ({transactions.length})
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {loadingDetails ? (
                  <p className="text-center text-gray-500 py-6">Loading...</p>
                ) : activeTab === 'purchases' ? (
                  /* PURCHASES TAB */
                  purchases.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No purchases yet</p>
                  ) : (
                    <div className="space-y-3">
                      {purchases.map((p) => (
                        <div key={p.id} className="border rounded-xl overflow-hidden">
                          <div className="p-3 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700">PURCHASE #{p.id}</span>
                              <span className="text-xs text-gray-500">{formatShortDate(p.purchase_date)}</span>
                              {p.vehicle_number && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 flex items-center gap-1">
                                  <Truck className="w-3 h-3" /> {p.vehicle_number}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-800">₹{p.bill?.total_amount?.toFixed(2) || '0.00'}</p>
                              <div className="flex gap-2 text-[10px]">
                                <span className="text-green-600">Paid: ₹{p.bill?.amount_paid?.toFixed(2) || '0.00'}</span>
                                {(p.bill?.remaining || 0) > 0 && <span className="text-red-600">Due: ₹{p.bill?.remaining?.toFixed(2)}</span>}
                              </div>
                            </div>
                          </div>
                          {/* Product details */}
                          {p.products && p.products.length > 0 && (
                            <div className="p-3 space-y-1">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase">Products</p>
                              {p.products.map((prod: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-700 flex justify-between">
                                  <span>{prod.name} × {prod.quantity} {prod.unit}</span>
                                  <span className="font-medium">₹{prod.subtotal?.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {p.notes && (
                            <div className="px-3 pb-3">
                              <p className="text-xs text-gray-400 bg-gray-50 rounded p-2">{p.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  /* TRANSACTIONS TAB */
                  transactions.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No transactions yet</p>
                  ) : (
                    <div>
                      {/* View Mode Toggle */}
                      <div className="flex items-center justify-end gap-1 mb-3">
                        <button
                          onClick={() => setTxnViewMode('card')}
                          className={`p-1.5 rounded-md transition-colors ${txnViewMode === 'card' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title="Card View"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTxnViewMode('table')}
                          className={`p-1.5 rounded-md transition-colors ${txnViewMode === 'table' ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title="Table View"
                        >
                          <Table2 className="w-4 h-4" />
                        </button>
                      </div>

                      {txnViewMode === 'card' ? (
                        /* CARD VIEW */
                        <div className="space-y-3">
                          {transactions.map((txn) => (
                            <div key={txn.id} className="border rounded-xl overflow-hidden">
                              <div className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                    txn.transaction_type === 'credit'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {txn.transaction_type === 'credit'
                                      ? <><ArrowDownRight className="w-3 h-3" /> CREDIT</>
                                      : <><ArrowUpRight className="w-3 h-3" /> DEBIT</>
                                    }
                                  </span>
                                  <span className="text-xs text-gray-500">{formatShortDate(txn.timestamp_ist)}</span>
                                  {txn.vehicle_number && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                                      <Truck className="w-3 h-3 inline" /> {txn.vehicle_number}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold ${txn.transaction_type === 'credit' ? 'text-green-700' : 'text-red-700'}`}>
                                    {txn.transaction_type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                                  </p>
                                  <p className="text-[10px] text-gray-400">Net: ₹{txn.net_amount.toFixed(2)}</p>
                                </div>
                              </div>

                              {txn.transaction_notes && (
                                <div className="px-3 pb-2">
                                  <p className="text-xs text-gray-600">{txn.transaction_notes}</p>
                                </div>
                              )}

                              {txn.product_details && txn.product_details.products && (
                                <div className="px-3 pb-2">
                                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Product Details</p>
                                  {txn.product_details.products.map((prod: any, idx: number) => (
                                    <div key={idx} className="text-xs text-gray-700 flex justify-between">
                                      <span>{prod.name} × {prod.quantity} {prod.unit}</span>
                                      <span className="font-medium">₹{prod.subtotal?.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {txn.transaction_done && (
                                <div className="px-3 pb-3">
                                  <div className="bg-green-50 rounded-lg p-2 text-xs">
                                    <p className="text-[10px] font-semibold text-green-700 uppercase mb-1">Payment Details</p>
                                    <div className="flex justify-between text-green-700">
                                      <span>Amount: ₹{txn.transaction_done.amount_paid}</span>
                                      {txn.transaction_done.payment_method && <span>via {txn.transaction_done.payment_method}</span>}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {txn.notes && (
                                <div className="px-3 pb-3">
                                  <p className="text-xs text-gray-400 bg-gray-50 rounded p-2">{txn.notes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* TABLE VIEW */
                        <div className="border rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Type</th>
                                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Date</th>
                                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Amount</th>
                                  <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Net</th>
                                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Vehicle</th>
                                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Paid</th>
                                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {transactions.map((txn) => (
                                  <tr key={txn.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-3 py-2.5">
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        txn.transaction_type === 'credit'
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {txn.transaction_type === 'credit'
                                          ? <><ArrowDownRight className="w-3 h-3" />CR</>
                                          : <><ArrowUpRight className="w-3 h-3" />DR</>
                                        }
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{formatShortDate(txn.timestamp_ist)}</td>
                                    <td className={`px-3 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap ${
                                      txn.transaction_type === 'credit' ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                      {txn.transaction_type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-medium tabular-nums text-gray-600 whitespace-nowrap">
                                      ₹{txn.net_amount.toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-500">
                                      {txn.vehicle_number || <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                                      {txn.transaction_done
                                        ? <span className="text-green-600">₹{txn.transaction_done.amount_paid}{txn.transaction_done.payment_method ? ` (${txn.transaction_done.payment_method})` : ''}</span>
                                        : <span className="text-gray-300">—</span>
                                      }
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-500 max-w-[120px] truncate" title={txn.transaction_notes || txn.notes || ''}>
                                      {txn.transaction_notes || txn.notes || <span className="text-gray-300">—</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
