import { Command } from '@oclif/core';
import { execSync } from 'child_process';

export default class PlatformDoctor extends Command {
  static description = '開発環境の前提確認（Node/Docker/devcontainer 等）';
  async run() {
    const checks = [
      { name: 'node -v', cmd: 'node -v' },
      { name: 'pnpm -v', cmd: 'pnpm -v' },
      { name: 'docker -v', cmd: 'docker -v' },
    ];
    for (const c of checks) {
      try {
        const out = execSync(c.cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        this.log(`[ok] ${c.name}: ${out}`);
      } catch {
        this.log(`[ng] ${c.name}: not found`);
      }
    }
  }
}
