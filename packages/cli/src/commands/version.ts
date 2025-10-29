import { Command } from '@oclif/core';

export default class Version extends Command {
  static description = 'バージョン表示';
  async run() {
    this.log(this.config.version);
  }
}
