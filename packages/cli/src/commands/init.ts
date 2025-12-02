import { Command, Flags } from '@oclif/core';
import { resolveTemplate } from '../core/template.js';

export default class Init extends Command {
  static description = 'mirelplatform ベースプロジェクトの初期化';

  static examples = [
    '<%= config.bin %> <%= command.id %> --name my-workspace',
    '<%= config.bin %> <%= command.id %> --template github:vemikrs/mirelplatform-base --name my-project',
  ];

  static flags = {
    template: Flags.string({ 
      char: 't', 
      description: 'テンプレートソース（GitHub リポジトリ等）',
      default: 'github:vemikrs/mirelplatform-base',
    }),
    name: Flags.string({ 
      char: 'n', 
      description: '生成先ディレクトリ名',
      required: true,
    }),
    yes: Flags.boolean({ 
      char: 'y',
      description: '対話プロンプトをスキップ',
      default: false,
    }),
  };
  async run() {
    const { flags } = await this.parse(Init);
    const name = flags.name;
    const template = flags.template;

    this.log(`Creating project: ${name}`);
    this.log(`Using template: ${template}`);

    await resolveTemplate(template, { targetDir: name, nonInteractive: flags.yes });
    
    this.log(`✅ Successfully created ${name}`);
    this.log(`\nNext steps:`);
    this.log(`  cd ${name}`);
    this.log(`  pnpm install`);
  }
}
