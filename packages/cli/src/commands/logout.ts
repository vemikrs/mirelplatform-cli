import { Command } from '@oclif/core';
import { deleteToken, hasToken } from '../core/auth.js';

export default class Logout extends Command {
  static description = 'mirelplatform からログアウト';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    // トークンの存在確認
    if (!(await hasToken())) {
      this.log('Already logged out');
      return;
    }

    // トークン削除
    await deleteToken();

    this.log('✅ Logged out successfully');
  }
}
