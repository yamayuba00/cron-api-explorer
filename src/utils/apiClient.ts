
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

interface ApiConfig {
  baseUrl: string;
  endpoints: {
    transactionHistory: string;
    transactionDetail: string;
  };
  defaultParams: {
    limit: number;
    page: number;
  };
  headers: Record<string, string>;
}

class ApiClient {
  private config: ApiConfig = {
    baseUrl: '',
    endpoints: {
      transactionHistory: '/api/transaction-history',
      transactionDetail: '/api/transaction'
    },
    defaultParams: {
      limit: 20,
      page: 1
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  setConfig(config: ApiConfig) {
    this.config = config;
  }

  setBaseUrl(url: string) {
    this.config.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  getConfig(): ApiConfig {
    return this.config;
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
    if (!this.config.baseUrl) {
      throw new Error('API base URL not set');
    }

    const queryParams = new URLSearchParams();
    
    // Use default params merged with provided params
    const finalParams = {
      ...this.config.defaultParams,
      ...params
    };
    
    if (finalParams.limit) queryParams.append('limit', finalParams.limit.toString());
    if (finalParams.page) queryParams.append('page', finalParams.page.toString());
    if (finalParams.startDate) queryParams.append('start_date', finalParams.startDate);
    if (finalParams.endDate) queryParams.append('end_date', finalParams.endDate);
    if (finalParams.status) queryParams.append('status', finalParams.status);
    if (finalParams.feature) queryParams.append('feature', finalParams.feature);
    if (finalParams.method) queryParams.append('method', finalParams.method);

    const url = `${this.config.baseUrl}${this.config.endpoints.transactionHistory}?${queryParams.toString()}`;
    
    console.log('Fetching from API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.config.headers,
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
    if (!this.config.baseUrl) {
      throw new Error('API base URL not set');
    }

    const url = `${this.config.baseUrl}${this.config.endpoints.transactionDetail}/${id}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.config.headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  // Get paginated data from API
  async fetchPaginatedData(page: number = 1, limit: number = 20, filters?: {
    status?: string;
    feature?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: CronjobData[], total: number, currentPage: number, totalPages: number }> {
    const params = {
      page,
      limit,
      ...filters
    };

    try {
      const data = await this.fetchTransactionHistory(params);
      
      // Since most APIs don't return pagination metadata, we simulate it
      // In a real scenario, the API should return this information
      return {
        data,
        total: data.length,
        currentPage: page,
        totalPages: Math.ceil(data.length / limit)
      };
    } catch (error) {
      console.error('Failed to fetch paginated data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export type { CronjobData, ApiResponse, ApiConfig };
