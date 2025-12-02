import { Command, Flags } from '@oclif/core';
import open from 'open';
import { saveToken } from '../core/auth.js';
import { loadApiUrl, saveGlobalConfig, loadGlobalConfig } from '../core/config-manager.js';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  status: 'pending' | 'authorized' | 'denied' | 'expired';
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: {
    email: string;
    name: string;
  };
}

export default class Login extends Command {
  static description = 'mirelplatform にログイン';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --web-only',
  ];

  static flags = {
    'web-only': Flags.boolean({
      description: 'ブラウザを自動で開かない',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Login);
    const apiUrl = loadApiUrl();

    this.log('Logging in to mirelplatform...\n');

    try {
      // 1. デバイスコード取得
      const deviceCode = await this.requestDeviceCode(apiUrl);

      // 2. ユーザーに指示を表示
      this.log('Please visit the following URL to authorize this device:');
      this.log(`  ${deviceCode.verification_uri}?code=${deviceCode.user_code}\n`);
      this.log(`Or enter the code manually: ${deviceCode.user_code}\n`);

      // 3. ブラウザを開く
      if (!flags['web-only']) {
        this.log('Opening browser...');
        try {
          await open(`${deviceCode.verification_uri}?code=${deviceCode.user_code}`);
        } catch (error) {
          this.warn('Failed to open browser automatically. Please visit the URL above manually.');
        }
      }

      // 4. ポーリング
      this.log('\nWaiting for authorization...');
      const token = await this.pollForToken(apiUrl, deviceCode);

      // 5. トークン保存
      await saveToken(token.access_token!);

      // 6. ユーザー情報を設定に保存
      if (token.user) {
        const config = loadGlobalConfig();
        config.user = token.user;
        saveGlobalConfig(config);
      }

      // 7. 完了
      this.log(`\n✅ Logged in as ${token.user?.email || 'user'}`);
    } catch (error) {
      if (error instanceof Error) {
        this.error(error.message);
      } else {
        this.error('Login failed');
      }
    }
  }

  private async requestDeviceCode(apiUrl: string): Promise<DeviceCodeResponse> {
    const response = await fetch(`${apiUrl}/api/auth/device/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: 'mirel-cli',
        scope: 'promarker:read promarker:write',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to request device code: ${response.statusText}`);
    }

    return response.json();
  }

  private async pollForToken(
    apiUrl: string,
    deviceCode: DeviceCodeResponse,
    maxAttempts = 180 // 15分 (180 * 5秒)
  ): Promise<TokenResponse> {
    const interval = deviceCode.interval * 1000; // 秒 → ミリ秒

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // interval秒待機
      await new Promise(resolve => setTimeout(resolve, interval));

      const response = await fetch(`${apiUrl}/api/auth/device/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: 'mirel-cli',
          device_code: deviceCode.device_code,
        }),
      });

      const data: TokenResponse = await response.json();

      if (data.status === 'authorized') {
        return data;
      }

      if (data.status === 'denied') {
        throw new Error('Authorization was denied');
      }

      if (data.status === 'expired') {
        throw new Error('Device code expired. Please try again.');
      }

      // status === 'pending' の場合は継続
      process.stdout.write('.');
    }

    throw new Error('Authentication timeout. Please try again.');
  }
}
