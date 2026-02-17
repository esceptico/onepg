const fs = require('fs');

const WEAK_VERBS = [
  'helped',
  'worked on',
  'responsible for',
  'assisted',
  'participated in',
  'was involved in',
  'contributed to',
];

const AI_BUZZWORDS = [
  'leverage', 'leveraged', 'leveraging',
  'spearheaded',
  'synergy',
  'utilize', 'utilized', 'utilizing',
  'orchestrated',
  'facilitated',
  'streamlined',
  'pioneered',
  'holistic',
  'ecosystem',
  'paradigm',
  'cutting-edge',
  'best-in-class',
  'world-class',
  'robust',
];

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
  'must', 'it', 'its', 'you', 'your', 'we', 'our', 'they', 'their',
  'this', 'that', 'these', 'those', 'i', 'me', 'my', 'he', 'she', 'him',
  'her', 'his', 'who', 'whom', 'which', 'what', 'where', 'when', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'not', 'only', 'same', 'so', 'than', 'too', 'very',
  'just', 'about', 'above', 'after', 'again', 'also', 'any', 'because',
  'before', 'between', 'down', 'during', 'if', 'into', 'out', 'over',
  'then', 'there', 'through', 'under', 'up', 'while', 'able', 'across',
  'along', 'around', 'etc', 'using', 'used', 'well', 'within', 'without',
  'work', 'working', 'experience', 'role', 'team', 'including', 'strong',
  'new', 'ensure', 'based', 'use', 'looking', 'someone', 'know', 'like',
  'get', 'got', 'make', 'made', 'take', 'come', 'want', 'give', 'say',
  'said', 'ideal', 'candidate', 'prefer', 'preferred', 'required',
  'requirements', 'qualifications', 'responsibilities', 'years', 'year',
  'minimum', 'plus', 'highly', 'least', 'join', 'apply', 'position',
  'opportunity', 'company', 'ability', 'proven', 'track', 'record',
  'seeking', 'self', 'driven', 'fast', 'paced', 'environment',
]);

function lintResume(data, { jdFile } = {}) {
  const issues = [];

  if (data.experience) {
    for (const exp of data.experience) {
      for (const role of exp.roles) {
        const loc = `${exp.company} > ${role.title}`;

        // Per-role metrics tracking for quantified-ratio
        let bulletsWithNumbers = 0;

        for (let k = 0; k < role.bullets.length; k++) {
          const bullet = role.bullets[k];
          const bulletLoc = `${loc} > bullet ${k + 1}`;

          // Rule: bullet-length
          if (bullet.length < 40) {
            issues.push({
              level: 'warning',
              rule: 'bullet-length',
              message: `Too short (${bullet.length} chars)`,
              location: bulletLoc,
            });
          } else if (bullet.length > 200) {
            issues.push({
              level: 'warning',
              rule: 'bullet-length',
              message: `Too long (${bullet.length} chars)`,
              location: bulletLoc,
            });
          }

          // Rule: weak-verbs
          const bulletLower = bullet.toLowerCase();
          for (const verb of WEAK_VERBS) {
            if (bulletLower.startsWith(verb)) {
              issues.push({
                level: 'warning',
                rule: 'weak-verbs',
                message: `Starts with "${verb}"`,
                location: bulletLoc,
              });
              break;
            }
          }

          // Rule: ai-language
          for (const word of AI_BUZZWORDS) {
            const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
            if (regex.test(bullet)) {
              issues.push({
                level: 'warning',
                rule: 'ai-language',
                message: `Contains "${word}"`,
                location: bulletLoc,
              });
              break;
            }
          }

          // Rule: ai-punctuation
          const aiChars = bullet.match(/[—→⟶•""''…]/g);
          if (aiChars) {
            issues.push({
              level: 'warning',
              rule: 'ai-punctuation',
              message: `Contains unicode punctuation: ${[...new Set(aiChars)].join(' ')}`,
              location: bulletLoc,
            });
          }

          // Track numbers for quantified-ratio
          if (/\d/.test(bullet)) {
            bulletsWithNumbers++;
          }
        }

        // Rule: quantified-ratio
        if (role.bullets.length > 0) {
          const ratio = bulletsWithNumbers / role.bullets.length;
          if (ratio < 0.3) {
            const pct = Math.round(ratio * 100);
            issues.push({
              level: 'warning',
              rule: 'quantified-ratio',
              message: `Only ${pct}% of bullets contain metrics/numbers (aim for 30%+)`,
              location: loc,
            });
          }
        }
      }
    }
  }

  // Rule: skills-gap (only when jdFile is provided)
  if (jdFile) {
    const jdText = fs.readFileSync(jdFile, 'utf8');
    const jdTokens = extractTokens(jdText);

    const skillWords = new Set();
    if (data.skills) {
      for (const cat of data.skills) {
        for (const item of cat.items) {
          skillWords.add(item.toLowerCase());
          for (const w of extractWords(item)) {
            skillWords.add(w);
          }
        }
      }
    }

    const missing = [];
    const seen = new Set();
    for (const { word, original } of jdTokens) {
      if (!seen.has(word) && !STOP_WORDS.has(word) && !skillWords.has(word) && word.length > 2) {
        missing.push(original);
        seen.add(word);
      }
    }

    if (missing.length > 0) {
      issues.push({
        level: 'info',
        rule: 'skills-gap',
        message: `JD keywords not in skills: ${missing.join(', ')}`,
        location: 'skills',
      });
    }
  }

  return issues;
}

function extractWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#\-/\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[\-/]+|[\-/]+$/g, ''))
    .filter((w) => w.length > 0);
}

function extractTokens(text) {
  // Like extractWords but preserves original casing for display
  return text
    .replace(/[^a-zA-Z0-9+#\-/\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[\-/]+|[\-/]+$/g, ''))
    .filter((w) => w.length > 0)
    .map((original) => ({ word: original.toLowerCase(), original }));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatLintResults(issues) {
  if (issues.length === 0) return 'No issues found.';

  const lines = issues.map((issue) => {
    const level = issue.level.toUpperCase().padEnd(8);
    const rule = issue.rule.padEnd(20);
    return `${level} ${rule} ${issue.location}: ${issue.message}`;
  });

  return lines.join('\n');
}

module.exports = { lintResume, formatLintResults };
