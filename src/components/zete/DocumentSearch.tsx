'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, File, Building2, Calendar, X, Loader2, FileText, ChevronRight } from 'lucide-react';
import { zeteApi } from '@/lib/zete-api';
import { SearchHit, SearchResponse } from '@/types/zete-types';

interface DocumentSearchProps {
    onSelectDocument?: (docId: string) => void;
    className?: string;
}

/**
 * Document search component with filename/metadata search.
 * Uses Strategy pattern backend - currently filesystem-based, upgradable to Meilisearch.
 */
export function DocumentSearch({ onSelectDocument, className = '' }: DocumentSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchHit[]>([]);
    const [facets, setFacets] = useState<Record<string, Record<string, number>>>({});
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [total, setTotal] = useState(0);
    const [processingTime, setProcessingTime] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search
    const search = useCallback(async (searchQuery: string, docTypes: string[]) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setFacets({});
            setTotal(0);
            return;
        }

        setLoading(true);
        try {
            const response: SearchResponse = await zeteApi.search(searchQuery, {
                docTypes: docTypes.length > 0 ? docTypes : undefined,
                limit: 20,
            });

            setResults(response.hits);
            setFacets(response.facets);
            setTotal(response.total);
            setProcessingTime(response.processing_time_ms);
            setIsOpen(true);
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle input change with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            search(value, selectedTypes);
        }, 200);
    };

    // Toggle document type filter
    const toggleTypeFilter = (type: string) => {
        const newTypes = selectedTypes.includes(type)
            ? selectedTypes.filter(t => t !== type)
            : [...selectedTypes, type];
        setSelectedTypes(newTypes);

        if (query.trim()) {
            search(query, newTypes);
        }
    };

    // Handle document selection
    const handleSelect = (docId: string) => {
        onSelectDocument?.(docId);
        setIsOpen(false);
        setQuery('');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Clear search
    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setFacets({});
        setIsOpen(false);
        inputRef.current?.focus();
    };

    // Get icon for document type
    const getDocTypeIcon = (docType: string) => {
        switch (docType) {
            case 'VisitingCard':
                return '👤';
            case 'Brochure':
                return '📘';
            case 'Invoice':
                return '💰';
            case 'MSA':
                return '📄';
            case 'SOW':
                return '📋';
            case 'Organization':
                return '🏢';
            default:
                return '📁';
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query && setIsOpen(true)}
                    placeholder="Search documents..."
                    className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                )}
                {!loading && query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && (query || results.length > 0) && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 
                              dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-hidden">

                    {/* Facet Filters */}
                    {Object.keys(facets.doc_type || {}).length > 0 && (
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(facets.doc_type || {}).map(([type, count]) => (
                                    <button
                                        key={type}
                                        onClick={() => toggleTypeFilter(type)}
                                        className={`px-2 py-1 text-xs rounded-full transition-colors ${selectedTypes.includes(type)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                            }`}
                                    >
                                        {getDocTypeIcon(type)} {type} ({count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results List */}
                    <div className="overflow-y-auto max-h-72">
                        {results.length > 0 ? (
                            results.map((hit) => (
                                <button
                                    key={hit.doc_id}
                                    onClick={() => handleSelect(hit.doc_id)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 
                                             flex items-start gap-3 border-b border-gray-50 dark:border-gray-700 last:border-0"
                                >
                                    <span className="text-lg flex-shrink-0">
                                        {getDocTypeIcon(hit.doc_type || '')}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="font-medium text-sm text-gray-900 dark:text-white truncate"
                                                dangerouslySetInnerHTML={{
                                                    __html: hit.highlights.filename || hit.filename
                                                }}
                                            />
                                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 
                                                           text-gray-600 dark:text-gray-300 rounded">
                                                {hit.doc_type}
                                            </span>
                                        </div>
                                        {hit.title && hit.title !== hit.filename && (
                                            <p
                                                className="text-xs text-gray-500 dark:text-gray-400 truncate"
                                                dangerouslySetInnerHTML={{
                                                    __html: hit.highlights.title || hit.title
                                                }}
                                            />
                                        )}
                                        {hit.organization_name && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Building2 className="h-3 w-3 text-gray-400" />
                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {hit.organization_name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                                </button>
                            ))
                        ) : query && !loading ? (
                            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No documents found for "{query}"</p>
                            </div>
                        ) : null}
                    </div>

                    {/* Footer with result count */}
                    {results.length > 0 && (
                        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 
                                      text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                            <span>{total} result{total !== 1 ? 's' : ''}</span>
                            <span>{processingTime.toFixed(1)}ms</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DocumentSearch;
