export interface ScoringCategory {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage as decimal (0.15 for 15%)
  maxScore: number;
}

export const SCORING_CATEGORIES: ScoringCategory[] = [
  {
    id: 'structure',
    name: 'Structure',
    description: 'SKILL.md exists, clear name/description, follows conventions, clean file organization',
    weight: 0.15,
    maxScore: 10
  },
  {
    id: 'clarity',
    name: 'Clarity',
    description: 'Specific actionable instructions, no ambiguity, logical order, agent knows what to do',
    weight: 0.20,
    maxScore: 10
  },
  {
    id: 'safety',
    name: 'Safety',
    description: 'No destructive commands without confirmation, no secret exfiltration, no unbounded loops, respects permissions',
    weight: 0.20,
    maxScore: 10
  },
  {
    id: 'dependencies',
    name: 'Dependencies',
    description: 'Lists required tools/APIs, checks before running, install instructions, states env vars',
    weight: 0.10,
    maxScore: 10
  },
  {
    id: 'errorHandling',
    name: 'Error Handling',
    description: 'Failure instructions, fallbacks, no silent failures, edge cases',
    weight: 0.10,
    maxScore: 10
  },
  {
    id: 'scope',
    name: 'Scope',
    description: 'Single responsibility, accurate description, specific triggers, no conflicts',
    weight: 0.10,
    maxScore: 10
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Usage examples, expected I/O, edge cases, troubleshooting',
    weight: 0.10,
    maxScore: 10
  },
  {
    id: 'portability',
    name: 'Portability',
    description: 'Cross-platform, no hardcoded paths, notes limitations, relative paths',
    weight: 0.05,
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