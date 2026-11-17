export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  error?: {
    message: string;
    statusCode?: number;
    details?: any;
  };
}

export interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
  services: {
    database: string;
    llm: string;
  };
  version: string;
}
