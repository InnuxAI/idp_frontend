"use client";

import { motion } from "framer-motion";
import { IconBook, IconAddressBook, IconShoppingCart } from "@tabler/icons-react";

export type DocumentTypeFilter = 'VisitingCard' | 'Brochure' | 'ProductCatalogue';

interface DocumentTypeFilterProps {
    selectedTypes: DocumentTypeFilter[];
    onTypesChange: (types: DocumentTypeFilter[]) => void;
    disabled?: boolean;
}

const filterOptions: { type: DocumentTypeFilter; label: string; icon: typeof IconBook }[] = [
    { type: 'ProductCatalogue', label: 'Product Catalogue', icon: IconShoppingCart },
    { type: 'Brochure', label: 'Brochure', icon: IconBook },
    { type: 'VisitingCard', label: 'Visiting Card', icon: IconAddressBook },
];

export function DocumentTypeFilter({ selectedTypes, onTypesChange, disabled }: DocumentTypeFilterProps) {
    const toggleType = (type: DocumentTypeFilter) => {
        if (selectedTypes.includes(type)) {
            onTypesChange(selectedTypes.filter(t => t !== type));
        } else {
            onTypesChange([...selectedTypes, type]);
        }
    };

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-semibold mr-1">
                Filter:
            </span>
            {filterOptions.map((option) => {
                const isSelected = selectedTypes.includes(option.type);
                const Icon = option.icon;

                return (
                    <motion.button
                        key={option.type}
                        type="button"
                        onClick={() => toggleType(option.type)}
                        disabled={disabled}
                        whileHover={{ scale: disabled ? 1 : 1.02 }}
                        whileTap={{ scale: disabled ? 1 : 0.98 }}
                        className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                            transition-all duration-200 border
                            ${isSelected
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-700 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        <Icon size={14} stroke={isSelected ? 2 : 1.5} />
                        <span className="hidden sm:inline">{option.label}</span>
                        <span className="sm:hidden">{option.label.split(' ')[0]}</span>
                    </motion.button>
                );
            })}
            {selectedTypes.length > 0 && (
                <motion.button
                    type="button"
                    onClick={() => onTypesChange([])}
                    disabled={disabled}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-2 py-1.5 text-[10px] font-medium text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                >
                    Clear
                </motion.button>
            )}
        </div>
    );
}
