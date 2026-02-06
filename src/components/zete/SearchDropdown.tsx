'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSearch, IconX, IconLoader2, IconFile, IconBuilding, IconChevronRight, IconUser, IconBook, IconReceipt, IconFileText, IconClipboardList, IconPackage, IconFolder } from '@tabler/icons-react';
import { zeteApi } from '@/lib/zete-api';
import { SearchHit, SearchResponse } from '@/types/zete-types';

interface SearchDropdownProps {
    onSelectDocument?: (docId: string) => void;
}

/**
 * Animated search dropdown that appears from a button.
 * Uses Framer Motion spring animations for smooth open/close.
 */
export function SearchDropdown({ onSelectDocument }: SearchDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchHit[]>([]);
    const [facets, setFacets] = useState<Record<string, Record<string, number>>>({});
    const [loading, setLoading] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [total, setTotal] = useState(0);
    const [processingTime, setProcessingTime] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setQuery('');
                setResults([]);
                setFacets({});
                setSelectedTypes([]);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setQuery('');
                setResults([]);
                setFacets({});
                setSelectedTypes([]);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

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
                limit: 15,
            });

            setResults(response.hits);
            setFacets(response.facets);
            setTotal(response.total);
            setProcessingTime(response.processing_time_ms);
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
        setResults([]);
        setFacets({});
        setSelectedTypes([]);
    };

    // Clear search
    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setFacets({});
        inputRef.current?.focus();
    };

    // Get icon for document type
    const getDocTypeIcon = (docType: string) => {
        const iconClass = "h-4 w-4";
        switch (docType) {
            case 'VisitingCard': return <IconUser className={iconClass} />;
            case 'Brochure': return <IconBook className={iconClass} />;
            case 'Invoice': return <IconReceipt className={iconClass} />;
            case 'MSA': return <IconFileText className={iconClass} />;
            case 'SOW': return <IconClipboardList className={iconClass} />;
            case 'Organization': return <IconBuilding className={iconClass} />;
            case 'ProductCatalogue': return <IconPackage className={iconClass} />;
            default: return <IconFolder className={iconClass} />;
        }
    };

    // Spring animation variants for the dropdown - SPRINGY with bounce!
    const dropdownVariants = {
        hidden: {
            opacity: 0,
            scale: 0.85,
            y: -20,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: 'spring' as const,
                stiffness: 350,
                damping: 18,  // Lower damping = more bounce
                mass: 0.8,
            }
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            y: -15,
            transition: {
                type: 'spring' as const,
                stiffness: 400,
                damping: 25,
            }
        }
    };

    // Stagger children animation
    const listVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.04,
                delayChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20, scale: 0.95 },
        visible: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 350,
                damping: 20,
            }
        }
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Search Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-md ${isOpen
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20'
                    }`}
            >
                <IconSearch size={14} />
                <span className="hidden sm:inline">Search</span>
            </motion.button>

            {/* Dropdown Container */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 top-full mt-2 w-[400px] bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden z-50"
                        style={{ transformOrigin: 'top right' }}
                    >
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
                            <div className="relative">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={handleInputChange}
                                    placeholder="Search files by name, organization..."
                                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg 
                                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                             bg-gray-50 dark:bg-zinc-800 dark:text-white placeholder-gray-400"
                                />
                                {loading && (
                                    <IconLoader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 animate-spin" />
                                )}
                                {!loading && query && (
                                    <motion.button
                                        onClick={clearSearch}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-zinc-600"
                                    >
                                        <IconX className="h-3 w-3" />
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        {/* Facet Filters */}
                        <AnimatePresence>
                            {Object.keys(facets.doc_type || {}).length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800 overflow-hidden"
                                >
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(facets.doc_type || {}).map(([type, count]) => (
                                            <motion.button
                                                key={type}
                                                onClick={() => toggleTypeFilter(type)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`px-2.5 py-1 text-xs rounded-full transition-all flex items-center gap-1.5 ${selectedTypes.includes(type)
                                                    ? 'bg-indigo-500 text-white shadow-sm'
                                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                                    }`}
                                            >
                                                {getDocTypeIcon(type)} {type} <span className="opacity-60">({count})</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Results List */}
                        <div className="overflow-y-auto max-h-[320px]">
                            {results.length > 0 ? (
                                <motion.div
                                    variants={listVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {results.map((hit) => (
                                        <motion.button
                                            key={hit.doc_id}
                                            variants={itemVariants}
                                            onClick={() => handleSelect(hit.doc_id)}
                                            whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.08)' }}
                                            className="w-full px-3 py-2.5 text-left flex items-start gap-3 border-b border-gray-50 dark:border-zinc-800/50 last:border-0 transition-colors"
                                        >
                                            <motion.div
                                                className="flex-shrink-0 mt-0.5 text-gray-500 dark:text-gray-400"
                                                whileHover={{ scale: 1.2, rotate: 5 }}
                                                transition={{ type: 'spring', stiffness: 400 }}
                                            >
                                                {getDocTypeIcon(hit.doc_type || '')}
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="font-medium text-sm text-gray-900 dark:text-white truncate"
                                                        dangerouslySetInnerHTML={{
                                                            __html: hit.highlights.filename || hit.filename
                                                        }}
                                                    />
                                                </div>
                                                {hit.title && hit.title !== hit.filename && (
                                                    <p
                                                        className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5"
                                                        dangerouslySetInnerHTML={{
                                                            __html: hit.highlights.title || hit.title
                                                        }}
                                                    />
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 rounded">
                                                        {hit.doc_type}
                                                    </span>
                                                    {hit.organization_name && (
                                                        <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                                                            <IconBuilding className="h-2.5 w-2.5" />
                                                            {hit.organization_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <IconChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-1" />
                                        </motion.button>
                                    ))}
                                </motion.div>
                            ) : query && !loading ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                                >
                                    <motion.div
                                        initial={{ y: 10 }}
                                        animate={{ y: 0 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <IconFile className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm font-medium">No documents found</p>
                                        <p className="text-xs mt-1 opacity-70">Try a different search term</p>
                                    </motion.div>
                                </motion.div>
                            ) : !query ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="px-4 py-8 text-center text-gray-400 dark:text-gray-500"
                                >
                                    <IconSearch className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Start typing to search</p>
                                </motion.div>
                            ) : null}
                        </div>

                        {/* Footer with result count */}
                        <AnimatePresence>
                            {results.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-3 py-2 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 text-xs text-gray-500 dark:text-gray-400 flex justify-between"
                                >
                                    <span>{total} result{total !== 1 ? 's' : ''}</span>
                                    <span className="opacity-70">{processingTime.toFixed(1)}ms</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )
                }
            </AnimatePresence >
        </div >
    );
}

export default SearchDropdown;