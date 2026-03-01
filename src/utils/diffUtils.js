export const computeWordDiff = (oldStr, newStr) => {
  const oldWords = String(oldStr ?? "").split(/(\s+)/);
  const newWords = String(newStr ?? "").split(/(\s+)/);
  const m = oldWords.length, n = newWords.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldWords[i - 1] === newWords[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const result = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.push({ type: "same", text: oldWords[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "add", text: newWords[j - 1] });
      j--;
    } else {
      result.push({ type: "del", text: oldWords[i - 1] });
      i--;
    }
  }
  return result.reverse();
};
