import { loadToken } from './auth.js';
import { loadApiUrl } from './config-manager.js';

export interface ApiClientOptions {
  baseUrl?: string;
  token?: string;
}

export class MirelApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || loadApiUrl();
  }

  /**
   * 汎用HTTPリクエスト
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // トークンを読み込み
    if (!this.token) {
      this.token = await loadToken();
    }

    if (!this.token) {
      throw new Error('Not authenticated. Please run: mirel login');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers,
    };

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      throw new Error('Authentication expired. Please run: mirel login');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
    }

    // レスポンスがJSON形式の場合のみパース
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response as any;
  }

  /**
   * GET リクエスト
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST リクエスト
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT リクエスト
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE リクエスト
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * ファイルダウンロード
   */
  async downloadFile(fileId: string, outputPath: string): Promise<void> {
    if (!this.token) {
      this.token = await loadToken();
    }

    if (!this.token) {
      throw new Error('Not authenticated. Please run: mirel login');
    }

    const url = `${this.baseUrl}/commons/download/${fileId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Node.js環境でのファイル書き込み
    const fs = await import('fs');
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
  }
}

/**
 * デフォルトAPIクライアントインスタンス
 */
export function createApiClient(options?: ApiClientOptions): MirelApiClient {
  return new MirelApiClient(options);
}
