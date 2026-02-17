const fs = require('fs');

function diffVersions(file1, file2) {
  const lines1 = fs.readFileSync(file1, 'utf8').split('\n');
  const lines2 = fs.readFileSync(file2, 'utf8').split('\n');

  const lcs = computeLCS(lines1, lines2);
  return buildDiff(lines1, lines2, lcs);
}

// LCS table for line-by-line diff
function computeLCS(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1).fill(0);
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

function buildDiff(a, b, dp) {
  const result = [];
  let i = a.length;
  let j = b.length;

  // Backtrack through the LCS table
  const ops = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push({ type: 'context', line: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'add', line: b[j - 1] });
      j--;
    } else {
      ops.push({ type: 'remove', line: a[i - 1] });
      i--;
    }
  }

  ops.reverse();

  for (const op of ops) {
    if (op.type === 'add') {
      result.push(`+${op.line}`);
    } else if (op.type === 'remove') {
      result.push(`-${op.line}`);
    } else {
      result.push(op.line);
    }
  }

  return result;
}

module.exports = { diffVersions };
