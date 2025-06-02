
// API Client utility untuk dashboard monitoring
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface CronjobData {
  Id: string;
  feature: string;
  endpoint: string;
  method: string;
  desc_transaction: string;
  status: string;
  ip: string;
  user_agent: string;
  duration_time: string;
  created_at: string;
}

class ApiClient {
  private baseUrl: string = '';

  setBaseUrl(url: string) {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  async fetchTransactionHistory(params?: {
    limit?: number;
    page?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    feature?: string;
    method?: string;
  }): Promise<CronjobData[]> {
    if (!this.baseUrl) {
      throw new Error('API base URL not set');
    }

    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.startDate) queryParams.append('start_date', params.startDate);
    if (params?.endDate) queryParams.append('end_date', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.feature) queryParams.append('feature', params.feature);
    if (params?.method) queryParams.append('method', params.method);

    const url = `${this.baseUrl}/api/transaction-history?${queryParams.toString()}`;
    
    console.log('Fetching from API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle direct array response
    if (Array.isArray(result)) {
      return result;
    }
    
    // Handle wrapped response
    if (result.data && Array.isArray(result.data)) {
      return result.data;
    }
    
    if (result.success && result.data) {
      return Array.isArray(result.data) ? result.data : [result.data];
    }
    
    throw new Error('Invalid API response format');
  }

  async fetchTransactionById(id: string): Promise<CronjobData> {
    if (!this.baseUrl) {
      throw new Error('API base URL not set');
    }

    const url = `${this.baseUrl}/api/transaction/${id}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export type { CronjobData, ApiResponse };
