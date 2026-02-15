import { Plan } from '../types';


export type Example = { before: string; after: string; nodeName: string };


export function buildReport(plans: Plan[], nodesById: Map<string, TextNode>) {
    const totalRepl = plans.reduce((n,p)=> n + p.replacements.length, 0);
    const examples: Example[] = [];
    for (const p of plans) {
        if (!p.replacements.length) continue;
        const node = nodesById.get(p.nodeId);
        if (!node) continue;
        const before = p.before.slice(0, 64).replace(/\n/g,'⏎');
        const after = p.after.slice(0, 64).replace(/\n/g,'⏎');
        examples.push({ before, after, nodeName: node.name });
        if (examples.length >= 20) break;
    }
    return { totalRepl, examples };
}