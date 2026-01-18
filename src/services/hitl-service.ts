/**
 * HITL API Service
 * 
 * API client for Human-in-the-Loop invoice approval endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface ExtractedInvoiceData {
    vendor_name?: string | null;
    vendor_address?: string | null;
    invoice_number?: string | null;
    invoice_date?: string | null;
    due_date?: string | null;
    po_number?: string | null;
    part_id?: string | null;
    item_description?: string | null;
    quantity?: number | null;
    unit_price?: number | null;
    subtotal?: number | null;
    tax?: number | null;
    total_amount?: number | null;
    currency?: string;
    line_items?: Array<{
        description?: string;
        quantity?: number;
        unit_price?: number;
        amount?: number;
    }>;
    raw_text?: string | null;
}

interface ProcessPayload {
    vendor: string;
    part_id: string;
    invoice_total: number;
    po_total: number;
    invoice_line_items?: Array<Record<string, unknown>>;
    po_line_items?: Array<Record<string, unknown>>;
}

interface ProcessResponse {
    decision: string;
    variance: number;
    comment?: string | null;
    action_required: boolean;
    line_item_mismatch: boolean;
    mismatches?: Array<{
        invoice_item: string;
        po_item: string;
        issue: string;
    }>;
    state?: Record<string, unknown>;
    vendor?: string | null;
    part_id?: string | null;
    invoice_total?: number | null;
    po_total?: number | null;
}

interface ResumePayload {
    approved: boolean;
    comment: string;
    state: Record<string, unknown>;
}

interface HealthResponse {
    status: string;
    memory_count: number | string;
    variance_threshold: number;
    memory_approval_threshold: number;
    chroma_tenant: string;
    llm_model: string;
    embedding_model: string;
}

interface MemoryResponse {
    total_memories: number;
    recent_memories: Array<Record<string, unknown>>;
    limit: number;
}

interface SearchMemoriesResponse {
    query: string;
    results: Array<Record<string, unknown>>;
    count: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        const message =
            typeof detail === "object" && detail !== null && "detail" in detail
                ? (detail as { detail: string }).detail
                : response.statusText;
        throw new Error(message || "Request failed");
    }
    return response.json() as Promise<T>;
}

function getAuthHeaders(): HeadersInit {
    if (typeof window === "undefined") return {};

    // First check session storage
    let token = sessionStorage.getItem("auth_token");

    // Then check localStorage if remember me was used
    if (!token) {
        const rememberMe = localStorage.getItem("auth_remember");
        if (rememberMe === "true") {
            token = localStorage.getItem("auth_token");
        }
    }

    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
}

export const hitlService = {
    /**
     * Check HITL service health
     */
    async healthCheck(): Promise<HealthResponse> {
        const response = await fetch(`${API_BASE}/api/hitl/health`, {
            headers: getAuthHeaders(),
        });
        return handleResponse<HealthResponse>(response);
    },

    /**
     * Extract invoice data from file
     */
    async extractInvoice(formData: FormData): Promise<ExtractedInvoiceData> {
        const response = await fetch(`${API_BASE}/api/hitl/extract`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: formData,
        });
        return handleResponse<ExtractedInvoiceData>(response);
    },

    /**
     * Process invoice through approval workflow
     */
    async processInvoice(payload: ProcessPayload): Promise<ProcessResponse> {
        const response = await fetch(`${API_BASE}/api/hitl/process`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify(payload),
        });
        return handleResponse<ProcessResponse>(response);
    },

    /**
     * Resume processing after human decision
     */
    async resumeProcess(payload: ResumePayload): Promise<ProcessResponse> {
        const response = await fetch(`${API_BASE}/api/hitl/resume`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify(payload),
        });
        return handleResponse<ProcessResponse>(response);
    },

    /**
     * Get recent memories
     */
    async getMemories(limit = 10): Promise<MemoryResponse> {
        const response = await fetch(`${API_BASE}/api/hitl/memories?limit=${limit}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse<MemoryResponse>(response);
    },

    /**
     * Search memories semantically
     */
    async searchMemories(query: string, topK = 5): Promise<SearchMemoriesResponse> {
        const response = await fetch(`${API_BASE}/api/hitl/search-memories`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ query, top_k: topK }),
        });
        return handleResponse<SearchMemoriesResponse>(response);
    },
};

export type {
    ExtractedInvoiceData,
    ProcessPayload,
    ProcessResponse,
    ResumePayload,
    HealthResponse,
    MemoryResponse,
    SearchMemoriesResponse,
};
