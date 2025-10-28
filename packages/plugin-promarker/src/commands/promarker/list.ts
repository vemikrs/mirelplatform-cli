import { Command } from '@oclif/core';

export default class PromarkerList extends Command {
  static description = 'ProMarker テンプレ一覧（デモ実装）';
  async run() {
    const items = [
      'github:vemi-templates/promarker-app',
      'github:vemi-templates/promarker-app-minimal'
    ];
    items.forEach(i => this.log(`- ${i}`));
  }
}
