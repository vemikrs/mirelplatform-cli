import { Command, Flags } from '@oclif/core';
import prompts from 'prompts';
import { resolveTemplate } from '../core/template.js';

export default class Init extends Command {
  static description = '新規プロジェクトの初期化（テンプレから生成）';
  static flags = {
    template: Flags.string({ char: 't', description: 'テンプレソース e.g. github:vemi-templates/mirelplatform-base' }),
    name: Flags.string({ char: 'n', description: '生成先ディレクトリ名' }),
    yes: Flags.boolean({ default: false }),
  };
  async run() {
    const { flags } = await this.parse(Init);
    let name = flags.name;
    let template = flags.template;
    if (!flags.yes) {
      const ans = await prompts([
        { type: name ? null : 'text', name: 'name', message: 'プロジェクト名' },
        { type: template ? null : 'text', name: 'template', message: 'テンプレ (github:owner/repo or dir)' },
      ]);
      name ??= ans.name;
      template ??= ans.template;
    }
    if (!name || !template) {
      this.error('name と template は必須です（--name, --template または対話で指定）');
      return;
    }
    await resolveTemplate(template, { targetDir: name, nonInteractive: flags.yes });
    this.log(`Created ${name} from ${template}`);
  }
}
