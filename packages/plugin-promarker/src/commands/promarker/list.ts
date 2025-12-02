import { Command } from '@oclif/core';

export default class PromarkerList extends Command {
  static description = 'ProMarker 利用可能なテンプレート一覧';

  async run() {
    this.log('Available ProMarker templates:\n');
    
    const templates = [
      { name: 'promarker-app', source: 'github:vemikrs/promarker-app', description: 'Standard ProMarker app' },
      { name: 'promarker-minimal', source: 'github:vemikrs/promarker-minimal', description: 'Minimal ProMarker setup' },
    ];

    templates.forEach(t => {
      this.log(`  ${t.name.padEnd(20)} ${t.description}`);
      this.log(`  ${' '.repeat(20)} ${t.source}\n`);
    });

    this.log('Usage: mirel promarker:new --name <project-name> --template <source>');
  }
}
