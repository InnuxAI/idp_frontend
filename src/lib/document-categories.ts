import {
  IconFileInvoice,
  IconInvoice,
  IconContract,
  IconReceiptRupeeFilled,
} from '@tabler/icons-react';


export const documentCategories = [
  {
    id: 'purchase-order',
    name: 'Purchase Order',
    icon: IconFileInvoice,
    description: 'Purchase orders documents',
    color: '#ADF81D' // Bright lime green
  },
  {
    id: 'invoice',
    name: 'Invoice',
    icon: IconInvoice,
    description: 'Invoices and Bills',
    color: '#1de9f8' // Bright cyan
  },
  {
    id: 'contract',
    name: 'Contract',
    icon: IconContract,
    description: 'Contracts and agreements',
    color: '#921df8' // Purple
  },
  {
    id: 'financial',
    name: 'Financial',
    icon: IconReceiptRupeeFilled,
    description: 'Financials and Reports',
    color: '#f8e21d' // Golden yellow
  },
  {
    id: 'other',
    name: 'Others',
    icon: IconReceiptRupeeFilled,
    description: 'Other documents',
    color: '#6d6d6dff' // Golden yellow
  }
];

// Categorize documents based on filename (you can enhance this logic)
export const categorizeDocument = (filename: string): string => {
  const name = filename.toLowerCase();
  if (name.includes('purchase') || name.includes('po') || name.includes('order')) return 'purchase-order';
  if (name.includes('invoice') || name.includes('bill')) return 'invoice';
  if (name.includes('contract') || name.includes('agreement')) return 'contract';
  if (name.includes('financial') || name.includes('statement') || name.includes('report')) return 'financial';
  return 'other';
};

// Get category color by category ID
export const getCategoryColor = (categoryId: string): string => {
  const category = documentCategories.find(cat => cat.id === categoryId);
  return category?.color || '#98b0d0ff'; // Default gray color for 'other'
};

// Get category by ID
export const getCategoryById = (categoryId: string) => {
  return documentCategories.find(cat => cat.id === categoryId);
};

// Get category by document filename
export const getDocumentCategory = (filename: string) => {
  const categoryId = categorizeDocument(filename);
  return getCategoryById(categoryId);
};
