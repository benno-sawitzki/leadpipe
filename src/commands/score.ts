import { Command } from 'commander';
import { loadLeads, saveLeads, findLead, loadConfig } from '../store.js';
import { Lead } from '../types.js';
import { shortId } from '../format.js';

function recalcScore(leads: Lead[], config: ReturnType<typeof loadConfig>): void {
  const ruleMap = new Map(config.scoring.rules.map(r => [r.type, r.points]));
  for (const lead of leads) {
    lead.score = lead.touches.reduce((sum: number, t) => sum + (ruleMap.get(t.type) || 0), 0);
  }
}

export function scoreCmd(program: Command): void {
  program
    .command('score [id]')
    .description('Show or adjust lead score')
    .option('--add <points>', 'add points')
    .option('--reason <reason>', 'reason for adjustment')
    .option('--recalc', 'recalculate all scores')
    .action((id: string | undefined, opts: any) => {
      const leads = loadLeads();
      const config = loadConfig();

      if (opts.recalc) {
        recalcScore(leads, config);
        saveLeads(leads);
        if (program.opts().json) { console.log(JSON.stringify(leads.map(l => ({ id: l.id, name: l.name, score: l.score })), null, 2)); return; }
        console.log('Recalculated scores for all leads.');
        return;
      }

      if (!id) { console.error('Provide a lead ID or --recalc'); process.exit(1); }
      const lead = findLead(leads, id);
      if (!lead) { console.error('Lead not found.'); process.exit(1); }

      if (opts.add) {
        lead.score += Number(opts.add);
        lead.updatedAt = new Date().toISOString();
        if (opts.reason) {
          lead.touches.push({ date: lead.updatedAt, note: `Score +${opts.add}: ${opts.reason}`, type: 'note' });
        }
        saveLeads(leads);
      }

      if (program.opts().json) {
        console.log(JSON.stringify({ id: lead.id, name: lead.name, score: lead.score }, null, 2));
      } else {
        console.log(`${lead.name}: score ${lead.score}`);
      }
    });
}
