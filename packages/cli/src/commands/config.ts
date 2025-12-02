import { Command, Args } from '@oclif/core';
import {
  loadGlobalConfig,
  saveGlobalConfig,
  loadApiUrl,
  getConfig,
  setConfig,
  unsetConfig,
} from '../core/config-manager.js';

export default class Config extends Command {
  static description = 'CLI設定の管理';

  static examples = [
    '<%= config.bin %> <%= command.id %> show',
    '<%= config.bin %> <%= command.id %> get apiUrl',
    '<%= config.bin %> <%= command.id %> set apiUrl https://mirel.mycompany.com',
    '<%= config.bin %> <%= command.id %> unset apiUrl',
    '<%= config.bin %> <%= command.id %> reset',
  ];

  static args = {
    action: Args.string({
      description: 'show | get | set | unset | reset',
      required: true,
      options: ['show', 'get', 'set', 'unset', 'reset'],
    }),
    key: Args.string({
      description: '設定キー (例: apiUrl, preferences.colorOutput)',
    }),
    value: Args.string({
      description: '設定値',
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(Config);

    switch (args.action) {
      case 'show':
        await this.showConfig();
        break;
      case 'get':
        if (!args.key) this.error('Key is required for get action');
        await this.getConfigValue(args.key);
        break;
      case 'set':
        if (!args.key || !args.value) {
          this.error('Key and value are required for set action');
        }
        await this.setConfigValue(args.key, args.value);
        break;
      case 'unset':
        if (!args.key) this.error('Key is required for unset action');
        await this.unsetConfigValue(args.key);
        break;
      case 'reset':
        await this.resetConfig();
        break;
    }
  }

  private async showConfig(): Promise<void> {
    const config = loadGlobalConfig();
    const apiUrl = loadApiUrl();

    this.log('Current Configuration:\n');
    this.log(`API URL:  ${apiUrl}`);

    if (config.user) {
      this.log(`User:     ${config.user.name} <${config.user.email}>`);
    }

    if (config.currentProfile) {
      this.log(`Profile:  ${config.currentProfile}`);
    }

    if (config.preferences) {
      this.log('\nPreferences:');
      Object.entries(config.preferences).forEach(([key, value]) => {
        this.log(`  ${key}: ${value}`);
      });
    }

    this.log(`\nConfig file: ~/.mirel/config.json`);
  }

  private async getConfigValue(key: string): Promise<void> {
    if (key === 'apiUrl') {
      this.log(loadApiUrl());
      return;
    }

    const value = getConfig(key);

    if (value === undefined) {
      this.error(`Key '${key}' not found`);
    }

    this.log(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
  }

  private async setConfigValue(key: string, value: string): Promise<void> {
    setConfig(key, value);
    this.log(`✅ Set ${key} = ${value}`);
  }

  private async unsetConfigValue(key: string): Promise<void> {
    unsetConfig(key);
    this.log(`✅ Unset ${key}`);
  }

  private async resetConfig(): Promise<void> {
    // 簡易実装 - 本番では prompts などで確認
    saveGlobalConfig({});
    this.log('✅ Configuration reset');
  }
}
