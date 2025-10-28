import { Command } from '@oclif/core';
import pkg from '../../package.json' assert { type: 'json' };

export default class Version extends Command {
  static description = 'バージョン表示';
  async run() {
    this.log(pkg.version);
  }
}
