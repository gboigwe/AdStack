'use client';

import { useState } from 'react';
import { Shield, Ban, Plus, Search, Check, X } from 'lucide-react';

interface ListEntry {
  id: number;
  address: string;
  listType: 'whitelist' | 'blacklist';
  reason: string;
  addedBy: string;
  addedAt: string;
}

export function WhitelistBlacklistManager() {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'blacklist'>('blacklist');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ address: '', reason: '' });

  const [entries, setEntries] = useState<ListEntry[]>([
    {
      id: 1,
      address: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
      listType: 'blacklist',
      reason: 'Multiple confirmed fraud incidents',
      addedBy: 'Admin',
      addedAt: new Date().toISOString(),
    },
    {
      id: 2,
      address: 'SP3X6QWWETNBZWGBK6DRGTR1KX50S74D3433WDGJY',
      listType: 'blacklist',
      reason: 'Click fraud detection',
      addedBy: 'AI Oracle',
      addedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      address: 'SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
      listType: 'whitelist',
      reason: 'Verified premium publisher',
      addedBy: 'Admin',
      addedAt: new Date(Date.now() - 259200000).toISOString(),
    },
  ]);

  const filteredEntries = entries.filter(
    (entry) =>
      entry.listType === activeTab &&
      entry.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    if (!newEntry.address || !newEntry.reason) return;

    const entry: ListEntry = {
      id: Date.now(),
      address: newEntry.address,
      listType: activeTab,
      reason: newEntry.reason,
      addedBy: 'Current User',
      addedAt: new Date().toISOString(),
    };

    setEntries([...entries, entry]);
    setNewEntry({ address: '', reason: '' });
    setShowAddForm(false);
  };

  const handleRemove = (id: number) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Whitelist & Blacklist Manager</h2>
        <p className="text-gray-600 mt-1">Manage trusted and blocked publishers</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('blacklist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'blacklist'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Ban className="w-4 h-4" />
            Blacklist ({entries.filter((e) => e.listType === 'blacklist').length})
          </button>

          <button
            onClick={() => setActiveTab('whitelist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'whitelist'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Whitelist ({entries.filter((e) => e.listType === 'whitelist').length})
          </button>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Publisher
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              Add to {activeTab === 'whitelist' ? 'Whitelist' : 'Blacklist'}
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publisher Address
              </label>
              <input
                type="text"
                value={newEntry.address}
                onChange={(e) => setNewEntry({ ...newEntry, address: e.target.value })}
                placeholder="SP..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <textarea
                value={newEntry.reason}
                onChange={(e) => setNewEntry({ ...newEntry, reason: e.target.value })}
                placeholder={
                  activeTab === 'whitelist'
                    ? 'Why is this publisher trusted?'
                    : 'Why is this publisher being blocked?'
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newEntry.address || !newEntry.reason}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Add Publisher
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by address..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No entries found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Publisher Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Added By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {entry.listType === 'whitelist' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Ban className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-xs font-mono">{entry.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.reason}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.addedBy}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(entry.addedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
