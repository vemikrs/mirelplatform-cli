import { Command, Flags } from '@oclif/core';
import { resolveTemplate } from '@vemijp/mirelplatform-cli/api';

export default class PromarkerNew extends Command {
  static description = 'ProMarker アプリの新規作成';

  static examples = [
    '<%= config.bin %> <%= command.id %> --name my-promarker-app',
    '<%= config.bin %> <%= command.id %> --name my-app --template github:vemikrs/promarker-minimal',
  ];

  static flags = {
    name: Flags.string({ 
      char: 'n', 
      description: 'プロジェクト名',
      required: true,
    }),
    template: Flags.string({ 
      char: 't', 
      description: 'テンプレートソース',
      default: 'github:vemikrs/promarker-app',
    }),
  };
  async run() {
    const { flags } = await this.parse(PromarkerNew);
    
    this.log(`Creating ProMarker app: ${flags.name}`);
    this.log(`Using template: ${flags.template}`);

    await resolveTemplate(flags.template, { targetDir: flags.name, nonInteractive: true });
    
    this.log(`✅ Successfully created ProMarker app: ${flags.name}`);
    this.log(`\nNext steps:`);
    this.log(`  cd ${flags.name}`);
    this.log(`  pnpm install`);
    this.log(`  pnpm dev`);
  }
}
