'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Truck, FileText, Package, PlusCircle, Trash2 } from 'lucide-react';

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

export default function AddPurchasePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>}>
      <AddPurchasePage />
    </Suspense>
  );
}

function AddPurchasePage() {
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

  // Products (dynamic rows)
  const [products, setProducts] = useState<ProductRow[]>([
    { name: '', quantity: '', unit: 'bags', price_per_unit: '' }
  ]);

  // Transaction details
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  const getSubtotal = (p: ProductRow) => {
    return (parseFloat(p.quantity) || 0) * (parseFloat(p.price_per_unit) || 0);
  };
  const grandTotal = products.reduce((sum, p) => sum + getSubtotal(p), 0);
  const remainingBalance = grandTotal - (parseFloat(amountPaid) || 0);

  // Add/remove product rows
  const addProduct = () => {
    setProducts([...products, { name: '', quantity: '', unit: 'bags', price_per_unit: '' }]);
  };
  const removeProduct = (index: number) => {
    if (products.length === 1) return;
    setProducts(products.filter((_, i) => i !== index));
  };
  const updateProduct = (index: number, field: keyof ProductRow, value: string) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  // Auto-load company from URL param
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
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2 || selectedCompanyId) {
      setSearchResults([]); setShowDropdown(false); return;
    }
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

  const clearCompany = () => {
    setSelectedCompanyId(null);
    setCompanyName('');
    setSearchQuery('');
  };

  const submitPurchase = async () => {
    if (!selectedCompanyId) return alert('Please select a company');
    if (grandTotal <= 0) return alert('Please add at least one product with quantity and price');

    const validProducts = products
      .filter(p => p.name.trim() && (parseFloat(p.quantity) || 0) > 0 && (parseFloat(p.price_per_unit) || 0) > 0)
      .map(p => ({
        name: p.name,
        quantity: parseFloat(p.quantity) || 0,
        unit: p.unit,
        price_per_unit: parseFloat(p.price_per_unit) || 0,
        subtotal: getSubtotal(p),
      }));

    if (validProducts.length === 0) return alert('Please add at least one valid product');

    setLoading(true);
    try {
      await api.post('/purchase/add', {
        company_id: selectedCompanyId,
        products: validProducts,
        vehicle_number: vehicleNumber || null,
        notes: notes || null,
        total_amount: grandTotal,
        amount_paid: parseFloat(amountPaid) || 0,
      });
      alert('Purchase added successfully!');
      router.push('/');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to add purchase');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 hover:bg-white rounded-lg transition-all hover:shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Add Purchase</h1>
            <p className="text-xs text-gray-500">{companyName ? `${companyName} (ID: ${selectedCompanyId})` : 'Select a company first'}</p>
          </div>
        </div>

        {/* Company Selection */}
        {!selectedCompanyId && (
          <div className="bg-white rounded-xl border shadow-sm p-6 mb-6 max-w-md mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Select Company</h2>
              <p className="text-sm text-gray-500">Search by firm name</p>
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
            <Link href="/register-company" className="block text-center text-sm text-blue-600 hover:underline mt-4">
              Register New Company →
            </Link>
          </div>
        )}

        {/* Purchase form (shown after company selection) */}
        {selectedCompanyId && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 lg:gap-6">
            {/* LEFT: Products */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-4 lg:px-6 py-3 lg:py-4 border-b bg-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Products
                </h2>
                <button onClick={addProduct} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                  <PlusCircle className="w-3.5 h-3.5" /> Add Product
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {products.map((p, index) => (
                  <div key={index} className="p-4 flex gap-3 items-start">
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Product Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Cement"
                          value={p.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Qty</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            placeholder="0"
                            value={p.quantity}
                            onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-center"
                          />
                          <select
                            value={p.unit}
                            onChange={(e) => updateProduct(index, 'unit', e.target.value)}
                            className="px-2 py-2 border border-gray-200 rounded-lg text-xs bg-white"
                          >
                            <option value="bags">bags</option>
                            <option value="MT">MT</option>
                            <option value="kg">kg</option>
                            <option value="nos">nos</option>
                            <option value="pieces">pcs</option>
                            <option value="liters">ltrs</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Rate (₹)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={p.price_per_unit}
                          onChange={(e) => updateProduct(index, 'price_per_unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-right"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Subtotal</label>
                        <p className={`py-2 px-3 text-sm font-semibold text-right ${getSubtotal(p) > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                          ₹{getSubtotal(p).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {products.length > 1 && (
                      <button onClick={() => removeProduct(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="px-4 lg:px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-t border-blue-200 flex items-center justify-between">
                <span className="font-bold text-blue-900 text-base lg:text-lg">Grand Total</span>
                <span className="font-bold text-blue-900 text-xl lg:text-2xl tabular-nums">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* RIGHT: Details & Payment */}
            <div className="space-y-4 lg:space-y-6">
              {/* Vehicle & Notes */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 lg:px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-500" />
                  <h2 className="font-semibold text-gray-900">Details</h2>
                </div>
                <div className="p-4 lg:p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Number</label>
                    <input
                      type="text"
                      placeholder="MH12AB1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Notes <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      placeholder="Additional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 lg:px-5 py-3 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-900">Payment</h2>
                </div>
                <div className="p-4 lg:p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Paid (₹)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-lg font-medium"
                    />
                  </div>
                  <div className={`p-4 rounded-lg transition-colors ${remainingBalance > 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${remainingBalance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        Remaining Balance
                      </span>
                      <span className={`text-xl lg:text-2xl font-bold tabular-nums ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{remainingBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push('/')} className="flex-1">Cancel</Button>
                <Button onClick={submitPurchase} isLoading={loading} disabled={grandTotal <= 0} className="flex-[2]">
                  Save Purchase
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </main>
  );
}
