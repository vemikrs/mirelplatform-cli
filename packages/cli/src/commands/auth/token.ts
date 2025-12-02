import { Command, Args } from '@oclif/core';
import { saveToken } from '../../core/auth.js';

export default class AuthToken extends Command {
  static description = 'APIトークンを手動設定';

  static examples = [
    '<%= config.bin %> <%= command.id %> mpl_abc123xyz...',
  ];

  static args = {
    token: Args.string({
      description: 'mirelplatform APIトークン',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(AuthToken);

    // トークンの形式検証（簡易）
    if (!args.token || args.token.length < 10) {
      this.error('Invalid token format. Token should be a long string (e.g., mpl_abc123...)');
    }

    // トークン保存
    try {
      await saveToken(args.token);
      this.log('✅ Token saved successfully');
      this.log('\nYou can now use mirel commands that require authentication.');
    } catch (error) {
      if (error instanceof Error) {
        this.error(`Failed to save token: ${error.message}`);
      } else {
        this.error('Failed to save token');
      }
    }
  }
}
