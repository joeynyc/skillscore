export interface ScoringCategory {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage as decimal (0.15 for 15%)
  maxScore: number;
}

export const SCORING_CATEGORIES: ScoringCategory[] = [
  {
    id: 'identity',
    name: 'Identity & Metadata',
    description: 'YAML frontmatter with valid name/description, proper format, not vague',
    weight: 0.20,
    maxScore: 10
  },
  {
    id: 'conciseness',
    name: 'Conciseness',
    description: 'Body under 500 lines, progressive disclosure, no over-explaining basics',
    weight: 0.15,
    maxScore: 10
  },
  {
    id: 'clarity',
    name: 'Clarity & Instructions',
    description: 'Workflow steps, consistent terminology, templates/examples, degrees of freedom',
    weight: 0.15,
    maxScore: 10
  },
  {
    id: 'routing',
    name: 'Routing & Scope',
    description: 'Description has WHAT+WHEN, negative routing, domain vocabulary, third-person voice',
    weight: 0.15,
    maxScore: 10
  },
  {
    id: 'robustness',
    name: 'Robustness',
    description: 'Error handling in code, validation steps, no magic constants, dependency verification',
    weight: 0.10,
    maxScore: 10
  },
  {
    id: 'safety',
    name: 'Safety & Security',
    description: 'No destructive commands without confirmation, no secret exfil, no privilege escalation',
    weight: 0.15,
    maxScore: 10
  },
  {
    id: 'portability',
    name: 'Portability & Standards',
    description: 'No platform-specific paths, MCP tool format, no time-sensitive info, relative paths',
    weight: 0.10,
    maxScore: 10
  }
];

// Validate weights sum to 1.0 at module load to catch drift when adding/changing categories
const totalWeight = SCORING_CATEGORIES.reduce((sum, cat) => sum + cat.weight, 0);
if (Math.abs(totalWeight - 1.0) > 0.001) {
  throw new Error(`SCORING_CATEGORIES weights must sum to 1.0, got ${totalWeight}`);
}

export function getLetterGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 65) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}
