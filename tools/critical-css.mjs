import postcss from 'postcss';
import { gzipSync } from 'node:zlib';

// Preserve rule order and enclosing responsive rules. Never cut CSS by line number.
function select(css, accepts) {
  const tree = postcss.parse(css);
  tree.walkRules(rule => { if (!accepts(rule.selector)) rule.remove(); });
  tree.walkAtRules(rule => { if (rule.nodes && !rule.nodes.length) rule.remove(); });
  tree.walkComments(comment => comment.remove());
  return tree.toString();
}

export function splitStyles({ studio, tokens, game, engine, page, shell, feedback = '' }) {
  const base = select(studio, selector => selector === ':root');
  const title = selector => /(?:^|[\s,])\.cb(?:[\s,:.{]|$)|\.cb-(?:hero|btn|row|ico|face|bar|brand|chip|foot|vh|live|loading|continue|engine-title)/.test(selector);
  const critical = [base, tokens, select(game, title), select(engine, title), page, shell, feedback].join('\n');
  const bytes = gzipSync(critical).length;
  if (bytes > 15000) throw new Error(`Critical CSS exceeds 15 KB gzip: ${bytes}`);
  return { critical, full: [game, engine].join('\n'), criticalGzipBytes: bytes };
}
