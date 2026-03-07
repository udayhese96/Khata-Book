'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, UserPlus, Trash2 } from 'lucide-react';

interface ContactPerson {
  name: string;
  phone: string;
  post: string;
}

export default function RegisterCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Company fields
  const [firmName, setFirmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [address, setAddress] = useState('');

  // Multiple contact persons
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
    { name: '', phone: '', post: '' }
  ]);

  const addContactPerson = () => {
    setContactPersons([...contactPersons, { name: '', phone: '', post: '' }]);
  };

  const removeContactPerson = (index: number) => {
    if (contactPersons.length === 1) return;
    setContactPersons(contactPersons.filter((_, i) => i !== index));
  };

  const updateContactPerson = (index: number, field: keyof ContactPerson, value: string) => {
    const updated = [...contactPersons];
    updated[index] = { ...updated[index], [field]: value };
    setContactPersons(updated);
  };

  const handleRegister = async () => {
    if (!firmName || !ownerName || !ownerPhone || !address) {
      return alert('Please fill all required fields');
    }
    if (ownerPhone.length !== 10) {
      return alert('Owner phone must be 10 digits');
    }

    // Filter out empty contact persons
    const validContacts = contactPersons.filter(cp => cp.name.trim() !== '');

    setLoading(true);
    try {
      await api.post('/company/register', {
        firm_name: firmName,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        address: address,
        contact_persons: validContacts,
      });
      alert('Company registered successfully!');
      router.push('/');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail;
      alert(typeof errorMsg === 'string' ? errorMsg : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center p-6"
      >
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Register New Company</h2>
                  <p className="text-sm text-gray-500">Fill in company & contact details</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="space-y-4">
            <div className="px-3 py-1.5 bg-blue-50 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Company Details</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name *</label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                placeholder="Enter firm/company name"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone *</label>
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Contact Persons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="px-3 py-1.5 bg-green-50 rounded-lg">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Contact Persons</p>
              </div>
              <button
                onClick={addContactPerson}
                className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Contact
              </button>
            </div>

            {contactPersons.map((cp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="relative border border-gray-100 rounded-xl p-4 bg-gray-50/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400">
                    Contact #{index + 1}
                  </span>
                  {contactPersons.length > 1 && (
                    <button
                      onClick={() => removeContactPerson(index)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={cp.name}
                      onChange={(e) => updateContactPerson(index, 'name', e.target.value)}
                      placeholder="Contact name"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={cp.phone}
                      onChange={(e) => updateContactPerson(index, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Post / Position</label>
                    <input
                      type="text"
                      value={cp.post}
                      onChange={(e) => updateContactPerson(index, 'post', e.target.value)}
                      placeholder="e.g. Manager"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleRegister} isLoading={loading} className="flex-[2]">
              Register Company
            </Button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
