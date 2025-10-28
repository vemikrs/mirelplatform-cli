import { Command, Flags } from '@oclif/core';
import { resolveTemplate } from '@vemi/mirelplatform-cli/dist/core/template';

export default class PromarkerNew extends Command {
  static description = 'ProMarker アプリをテンプレから生成（デモ実装）';
  static flags = {
    name: Flags.string({ char: 'n', required: true }),
    template: Flags.string({ char: 't', default: 'github:vemi-templates/promarker-app' }),
    yes: Flags.boolean({ default: true }),
  };
  async run() {
    const { flags } = await this.parse(PromarkerNew);
    await resolveTemplate(flags.template, { targetDir: flags.name, nonInteractive: flags.yes });
    this.log(`Created ${flags.name}`);
  }
}
