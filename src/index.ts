#!/usr/bin/env node

import { SkillScoreCli } from './cli';

// Export main classes for programmatic use
export { SkillParser } from './parsers/skillParser';
export { SkillScorer } from './scorer';
export { SkillScoreCli, CliError } from './cli';
export { TerminalReporter } from './reporters/terminalReporter';
export { JsonReporter } from './reporters/jsonReporter';
export { MarkdownReporter } from './reporters/markdownReporter';
export { 
  SCORING_CATEGORIES,
  getLetterGrade,
  type ScoringCategory,
  type ScoringCriteria
} from './rubric';
export {
  type Reporter,
  type SkillScore,
  type CategoryScore,
  type Finding
} from './scorer';
export {
  type ParsedSkill,
  type FileStructure
} from './parsers/skillParser';

// CLI entry point
async function main(): Promise<void> {
  const cli = new SkillScoreCli();
  await cli.run();
}

// Execute CLI if this file is run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}