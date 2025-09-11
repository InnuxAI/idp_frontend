const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DashboardMetrics {
  doc_type_counts: Record<string, number>;
  today_stats: {
    total: number;
    successful: number;
    failed: number;
  };
  overview_stats: {
    total_documents: number;
    total_schemas: number;
    total_extractions: number;
    success_rate: number;
  };
  chart_data: {
    date: string;
    processed: number;
    successful: number;
    failed: number;
  }[];
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/metrics`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
    // Return fallback data
    return {
      doc_type_counts: {},
      today_stats: { total: 0, successful: 0, failed: 0 },
      overview_stats: { total_documents: 0, total_schemas: 0, total_extractions: 0, success_rate: 0 },
      chart_data: []
    };
  }
}
