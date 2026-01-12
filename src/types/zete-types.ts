
export interface DocumentMetadata {
    id: string;
    parent?: string;
    type: 'MSA' | 'SOW' | 'Invoice' | 'Addendum' | 'Unknown';
    file_path?: string;
    title?: string;
}

export interface DocumentContent {
    id: string;
    content: string;
    metadata: DocumentMetadata;
}

export interface GraphNode {
    id: string;
    group: number;
    label: string;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    neighbors?: GraphNode[];
    links?: GraphLink[];
}

export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    type: 'parent' | 'semantic';
    label?: string;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export interface DocumentDetails {
    id: string;
    content: string;
    metadata: DocumentMetadata;
}

export interface ChainSummary {
    doc_id: string;
    title: string | null;
    type: string;
    summary: string;
}

export interface SummaryResponse {
    success: boolean;
    chain: ChainSummary[];
    aggregated_summary?: string;
    errors: string[];
    warnings: string[];
}

export interface ReconciliationResult {
    result: string;
    invoice_amount: number | null;
    sow_amount: number | null;
}

export interface QueryResponse {
    success: boolean;
    question: string;
    answer?: string;
    cypher_query?: string;
    raw_results?: any[];
    errors: string[];
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    sources?: any[];
}

export type PanelType = 'graph' | 'document' | 'chat';
