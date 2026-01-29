const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined'
    ? (sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token'))
    : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface RefusalReason {
  reason: string;
  count: number;
}

export interface ChatStats {
  total_queries: number;
  success_rate: number;
  refusal_reasons: RefusalReason[];
  raw_stats: Record<string, number>;
}

export interface GraphStats {
  total_documents: number;
  doc_type_counts: Record<string, number>;
  today_processed: number;
}

export interface DashboardMetrics {
  graph_stats: GraphStats;
  chat_stats: ChatStats;
}

export interface TimeSeriesDataPoint {
  date: string;
  successful: number;
  failed: number;
  in_review: number;
}

export interface ProcessingAnalytics {
  time_series: TimeSeriesDataPoint[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    in_review: number;
  };
  days: number;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zete/dashboard/metrics`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
    return {
      graph_stats: {
        total_documents: 0,
        doc_type_counts: {},
        today_processed: 0
      },
      chat_stats: {
        total_queries: 0,
        success_rate: 0,
        refusal_reasons: [],
        raw_stats: {}
      }
    };
  }
}

export async function fetchProcessingAnalytics(days: number = 30): Promise<ProcessingAnalytics> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zete/dashboard/analytics?days=${days}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Failed to fetch processing analytics:', error);
    return {
      time_series: [],
      summary: { total: 0, successful: 0, failed: 0, in_review: 0 },
      days
    };
  }
}

export interface BusinessInsights {
  top_organizations: Array<{
    name: string;
    doc_count: number;
    doc_types: string[];
  }>;
  recent_documents: Array<{
    doc_id: string;
    title: string;
    doc_type: string;
    time_ago: string;
  }>;
  pending_approvals: {
    count: number;
    samples: Array<{
      vendor: string;
      invoice: string;
      amount: number;
    }>;
  };
  relationship_summary: {
    total: number;
    top_types: Array<{
      type: string;
      count: number;
    }>;
  };
}

export async function fetchBusinessInsights(): Promise<BusinessInsights> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zete/dashboard/insights`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Failed to fetch business insights:', error);
    return {
      top_organizations: [],
      recent_documents: [],
      pending_approvals: { count: 0, samples: [] },
      relationship_summary: { total: 0, top_types: [] }
    };
  }
}
