
import axios from 'axios';
import { GraphData, DocumentDetails, DocumentMetadata, SummaryResponse, ReconciliationResult, QueryResponse } from '@/types/zete-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const zeteApi = {
    getGraphData: async (): Promise<GraphData> => {
        const response = await axios.get(`${API_BASE_URL}/api/zete/graph`);
        return response.data;
    },

    getDocuments: async (): Promise<DocumentMetadata[]> => {
        const response = await axios.get(`${API_BASE_URL}/api/zete/documents`);
        return response.data;
    },

    getDocument: async (docId: string): Promise<DocumentDetails> => {
        const response = await axios.get(`${API_BASE_URL}/api/zete/documents/${docId}`);
        return response.data;
    },

    summarizeDocument: async (docId: string): Promise<SummaryResponse> => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/summarize/${docId}`);
        return response.data;
    },

    reconcileDocument: async (docId: string): Promise<ReconciliationResult> => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/reconcile/${docId}`);
        return response.data;
    },

    query: async (question: string): Promise<QueryResponse> => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/query`, { question });
        return response.data;
    },

    ingestDocument: async (fileDetails: { file_path: string }) => {
        const response = await axios.post(`${API_BASE_URL}/api/zete/documents/ingest`, fileDetails);
        return response.data;
    }
};
