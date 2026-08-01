export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode = 500, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem('civitas_auth_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem('civitas_auth_token', token);
    } else {
      localStorage.removeItem('civitas_auth_token');
    }
  } catch {
    // Ignore storage write errors
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: ApiErrorResponse = { message: `Erreur HTTP ${response.status}: ${response.statusText}` };
      try {
        const parsed = await response.json();
        if (parsed) {
          errorData = {
            message: parsed.message || errorData.message,
            statusCode: response.status,
            errors: parsed.errors,
          };
        }
      } catch {
        // Fallback to text error if JSON parsing fails
      }
      throw new ApiError(errorData.message, response.status, errorData.errors);
    }

    if (response.status === 24) {
      return {} as T;
    }

    const json = await response.json();
    return json as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error?.message || 'Erreur de connexion réseau au serveur backend', 0);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => fetchApi<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestInit) => fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};
