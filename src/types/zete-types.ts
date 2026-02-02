
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
    node_type?: 'document' | 'entity';
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


export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface SourceDocument {
    doc_id: string;
    title?: string;
    doc_type?: string;
}

export interface QueryResponse {
    success: boolean;
    question: string;
    answer?: string;
    sources?: SourceDocument[];
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

// Document type filter options for chat queries
export type DocumentTypeFilterOption = 'VisitingCard' | 'Brochure' | 'ProductCatalogue';

// Async task status types
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type ProcessingStep =
    | 'queued'
    | 'reading'
    | 'classifying'
    | 'extracting'
    | 'resolving_entity'
    | 'embedding'
    | 'creating_node'
    | 'creating_relationships'
    | 'completed'
    | 'failed';

export interface TaskCreateResponse {
    task_id: string;
    status: TaskStatus;
    message: string;
    file_name: string;
}

export interface TaskStatusResponse {
    task_id: string;
    status: TaskStatus;
    progress: number;
    current_step?: ProcessingStep;
    step_message?: string;
    doc_id?: string;
    document_type?: string;
    metadata?: Record<string, any>;
    error?: string;
    errors?: string[];
    warnings?: string[];
    created_at?: string;
    updated_at?: string;
    completed_at?: string;
}

// Step progress mapping for UI
export const STEP_PROGRESS: Record<ProcessingStep, number> = {
    queued: 0,
    reading: 10,
    classifying: 25,
    extracting: 45,
    resolving_entity: 60,
    embedding: 75,
    creating_node: 85,
    creating_relationships: 95,
    completed: 100,
    failed: -1,
};

export const STEP_LABELS: Record<ProcessingStep, string> = {
    queued: 'Queued',
    reading: 'Reading document...',
    classifying: 'Classifying document type...',
    extracting: 'Extracting metadata...',
    resolving_entity: 'Resolving organization...',
    embedding: 'Creating embeddings...',
    creating_node: 'Creating graph node...',
    creating_relationships: 'Creating relationships...',
    completed: 'Complete!',
    failed: 'Failed',
};

// Search types
export interface SearchHit {
    doc_id: string;
    filename: string;
    title?: string;
    doc_type?: string;
    file_path?: string;
    organization_name?: string;
    summary?: string;
    score: number;
    highlights: Record<string, string>;
}

export interface SearchResponse {
    query: string;
    hits: SearchHit[];
    total: number;
    processing_time_ms: number;
    facets: Record<string, Record<string, number>>;
}
