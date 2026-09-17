export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  timestamp: string;
}
