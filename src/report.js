export function toJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function toMarkdown(report) {
  const rows = report.results.map(result => `| ${result.status} | ${result.id} | ${result.label} | ${result.weight} |`).join('\n');
  return `# skillfit report\n\nSkill: ${report.skillDir}\nScore: ${report.score}/100\nGrade: ${report.grade}\n\n| Status | Check | Detail | Weight |\n|---|---|---|---:|\n${rows}\n`;
}
