import { Command } from 'commander';
import { initStore } from '../store.js';

export function initCmd(program: Command): void {
  program.command('init').description('Initialize .leadpipe/ directory').action(() => {
    initStore();
  });
}
