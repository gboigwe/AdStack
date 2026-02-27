'use client';

import { useState } from 'react';
import { Ban, Plus, Trash2, Upload, Search, AlertTriangle } from 'lucide-react';

interface ExclusionEntry {
  id: number;
  identifier: string;
  reason: string;
  addedAt: string;
  expiresAt: string | null;
}

export function ExclusionListManager() {
  const [entries, setEntries] = useState<ExclusionEntry[]>([
    { id: 1, identifier: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', reason: 'Requested opt-out', addedAt: '2026-02-20', expiresAt: null },
    { id: 2, identifier: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', reason: 'Fraud detection', addedAt: '2026-02-22', expiresAt: '2026-03-22' },
    { id: 3, identifier: 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0', reason: 'Duplicate account', addedAt: '2026-02-24', expiresAt: null },
  ]);

  const [newIdentifier, setNewIdentifier] = useState('');
  const [newReason, setNewReason] = useState('');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const addEntry = () => {
    if (!newIdentifier.trim()) return;
    const entry: ExclusionEntry = {
      id: Date.now(),
      identifier: newIdentifier.trim(),
      reason: newReason.trim() || 'Manual exclusion',
      addedAt: new Date().toISOString().split('T')[0],
      expiresAt: null,
    };
    setEntries([entry, ...entries]);
    setNewIdentifier('');
    setNewReason('');
    setShowAddForm(false);
  };

  const removeEntry = (id: number) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const filtered = entries.filter(
    (e) =>
      e.identifier.toLowerCase().includes(search.toLowerCase()) ||
      e.reason.toLowerCase().includes(search.toLowerCase())
  );

  const permanentCount = entries.filter((e) => !e.expiresAt).length;
  const temporaryCount = entries.filter((e) => e.expiresAt).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <Ban className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Exclusion List</h2>
            <p className="text-sm text-gray-500">Manage addresses excluded from targeting</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Exclusion
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">{entries.length}</div>
          <div className="text-[10px] text-gray-500">Total Excluded</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">{permanentCount}</div>
          <div className="text-[10px] text-gray-500">Permanent</div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-orange-600">{temporaryCount}</div>
          <div className="text-[10px] text-gray-500">Temporary</div>
        </div>
      </div>

      {showAddForm && (
        <div className="border border-red-100 rounded-lg p-4 mb-4 bg-red-50/30">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Address to Exclude
              </label>
              <input
                type="text"
                value={newIdentifier}
                onChange={(e) => setNewIdentifier(e.target.value)}
                placeholder="ST..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reason
              </label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Reason for exclusion"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addEntry}
                className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Add to List
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exclusions..."
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-6 text-sm text-gray-400">No exclusions found</div>
        )}
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <code className="text-xs text-gray-700 truncate block max-w-[240px]">
                  {entry.identifier}
                </code>
                {entry.expiresAt && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 rounded text-[10px] text-orange-600">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Expires {entry.expiresAt}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span>{entry.reason}</span>
                <span>Added {entry.addedAt}</span>
              </div>
            </div>
            <button
              onClick={() => removeEntry(entry.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
