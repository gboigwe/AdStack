'use client';

import { useState } from 'react';
import { Tags, ChevronRight, ChevronDown, Search, Check } from 'lucide-react';

interface TaxonomyNode {
  id: string;
  label: string;
  children?: TaxonomyNode[];
}

const INTEREST_TAXONOMY: TaxonomyNode[] = [
  {
    id: 'technology',
    label: 'Technology',
    children: [
      { id: 'blockchain', label: 'Blockchain & Crypto' },
      { id: 'defi', label: 'DeFi Protocols' },
      { id: 'nfts', label: 'NFTs & Digital Art' },
      { id: 'web3', label: 'Web3 Development' },
      { id: 'ai_ml', label: 'AI & Machine Learning' },
      { id: 'cybersecurity', label: 'Cybersecurity' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    children: [
      { id: 'investing', label: 'Investing' },
      { id: 'trading', label: 'Trading' },
      { id: 'personal_finance', label: 'Personal Finance' },
      { id: 'real_estate', label: 'Real Estate' },
    ],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    children: [
      { id: 'gamefi', label: 'GameFi & P2E' },
      { id: 'esports', label: 'Esports' },
      { id: 'metaverse', label: 'Metaverse' },
      { id: 'mobile_gaming', label: 'Mobile Gaming' },
    ],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    children: [
      { id: 'travel', label: 'Travel' },
      { id: 'health_wellness', label: 'Health & Wellness' },
      { id: 'fashion', label: 'Fashion' },
      { id: 'food', label: 'Food & Dining' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    children: [
      { id: 'startups', label: 'Startups' },
      { id: 'marketing', label: 'Marketing' },
      { id: 'saas', label: 'SaaS' },
      { id: 'ecommerce', label: 'E-Commerce' },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    children: [
      { id: 'online_courses', label: 'Online Courses' },
      { id: 'certifications', label: 'Certifications' },
      { id: 'research', label: 'Research & Academia' },
    ],
  },
];

interface InterestTaxonomyProps {
  onSelectionChange?: (selected: string[]) => void;
}

export function InterestTaxonomy({ onSelectionChange }: InterestTaxonomyProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['technology']));
  const [selected, setSelected] = useState<Set<string>>(new Set(['blockchain', 'defi', 'nfts']));
  const [search, setSearch] = useState('');

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpanded(next);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const selectCategory = (node: TaxonomyNode) => {
    const next = new Set(selected);
    const childIds = node.children?.map((c) => c.id) || [];
    const allSelected = childIds.every((id) => next.has(id));
    childIds.forEach((id) => {
      if (allSelected) {
        next.delete(id);
      } else {
        next.add(id);
      }
    });
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const filteredTaxonomy = search
    ? INTEREST_TAXONOMY.map((cat) => ({
        ...cat,
        children: cat.children?.filter((c) =>
          c.label.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((cat) => (cat.children?.length ?? 0) > 0 || cat.label.toLowerCase().includes(search.toLowerCase()))
    : INTEREST_TAXONOMY;

  const totalInterests = INTEREST_TAXONOMY.reduce((s, c) => s + (c.children?.length || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-lg">
            <Tags className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Interest Taxonomy</h2>
            <p className="text-sm text-gray-500">Browse and select interest categories</p>
          </div>
        </div>
        <span className="text-xs text-gray-400">{selected.size}/{totalInterests} selected</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search interests..."
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {Array.from(selected).map((id) => {
            const node = INTEREST_TAXONOMY.flatMap((c) => c.children || []).find((c) => c.id === id);
            if (!node) return null;
            return (
              <button
                key={id}
                onClick={() => toggleSelect(id)}
                className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 hover:bg-rose-100"
              >
                {node.label}
                <span className="text-rose-400 ml-0.5">&times;</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {filteredTaxonomy.map((category) => {
          const childIds = category.children?.map((c) => c.id) || [];
          const selectedChildCount = childIds.filter((id) => selected.has(id)).length;
          const isExpanded = expanded.has(category.id) || search.length > 0;

          return (
            <div key={category.id}>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  {category.label}
                  {selectedChildCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-100 rounded text-[10px] text-rose-600">
                      {selectedChildCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => selectCategory(category)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 px-2"
                >
                  {selectedChildCount === childIds.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              {isExpanded && category.children && (
                <div className="ml-6 space-y-0.5 mb-2">
                  {category.children.map((child) => {
                    const isSelected = selected.has(child.id);
                    return (
                      <button
                        key={child.id}
                        onClick={() => toggleSelect(child.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left transition-colors ${
                          isSelected
                            ? 'bg-rose-50 text-rose-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-rose-500 border-rose-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
