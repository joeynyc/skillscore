export interface ScoringCategory {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage as decimal (0.15 for 15%)
  maxScore: number;
}

export interface ScoringCriteria {
  [key: string]: {
    description: string;
    points: number;
    checks: string[];
  };
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

export const STRUCTURE_CRITERIA: ScoringCriteria = {
  skillMdExists: {
    description: 'SKILL.md file exists',
    points: 3,
    checks: ['File exists: SKILL.md']
  },
  hasName: {
    description: 'Clear skill name defined',
    points: 2,
    checks: ['Contains # heading or name field', 'Name is descriptive']
  },
  hasDescription: {
    description: 'Clear description provided',
    points: 2,
    checks: ['Contains description section', 'Description is informative']
  },
  fileOrganization: {
    description: 'Clean file organization',
    points: 1,
    checks: ['Reasonable folder structure', 'No unnecessary files', 'Logical naming']
  },
  artifactOutputSpec: {
    description: 'Defines where outputs/artifacts go',
    points: 1,
    checks: ['Output location defined', 'Artifact destinations specified']
  },
  followsConventions: {
    description: 'Follows OpenClaw skill conventions',
    points: 1,
    checks: ['Standard SKILL.md format', 'Proper metadata']
  }
};

export const CLARITY_CRITERIA: ScoringCriteria = {
  specificInstructions: {
    description: 'Instructions are specific and actionable',
    points: 3,
    checks: ['Clear step-by-step instructions', 'No vague language', 'Specific commands/actions']
  },
  noAmbiguity: {
    description: 'No ambiguous language or unclear requirements',
    points: 3,
    checks: ['Unambiguous language', 'Clear conditions', 'Definite outcomes']
  },
  logicalOrder: {
    description: 'Instructions follow logical order',
    points: 2,
    checks: ['Sequential flow', 'Dependencies handled properly']
  },
  agentUnderstanding: {
    description: 'Agent can understand what to do',
    points: 2,
    checks: ['Clear triggers', 'Obvious next steps', 'Well-defined success criteria']
  }
};

export const SAFETY_CRITERIA: ScoringCriteria = {
  destructiveCommands: {
    description: 'No destructive commands without confirmation',
    points: 3,
    checks: ['rm/delete commands have confirmations', 'No force flags without warnings']
  },
  secretExfiltration: {
    description: 'No secret exfiltration risks',
    points: 3,
    checks: ['No unauthorized data access', 'No secret transmission', 'Respects privacy']
  },
  unboundedLoops: {
    description: 'No unbounded loops or infinite processes',
    points: 1,
    checks: ['Loops have exit conditions', 'No infinite recursion', 'Bounded operations']
  },
  networkContainment: {
    description: 'Network usage has containment measures',
    points: 1,
    checks: ['Network calls scoped to allowed domains', 'Response validation']
  },
  permissions: {
    description: 'Respects system and user permissions',
    points: 2,
    checks: ['No privilege escalation', 'Stays in allowed directories', 'Respects file permissions']
  }
};

export const DEPENDENCIES_CRITERIA: ScoringCriteria = {
  listsTools: {
    description: 'Lists required tools and APIs',
    points: 3,
    checks: ['Clear tool requirements', 'API dependencies listed', 'Version requirements']
  },
  checksBeforeRunning: {
    description: 'Checks dependencies before running',
    points: 2,
    checks: ['Validates tool availability', 'Checks API access', 'Graceful fallbacks']
  },
  installInstructions: {
    description: 'Provides installation instructions',
    points: 3,
    checks: ['Installation steps provided', 'Multiple platforms covered', 'Clear setup process']
  },
  environmentVars: {
    description: 'States required environment variables',
    points: 2,
    checks: ['Environment variables documented', 'Configuration requirements clear']
  }
};

export const ERROR_HANDLING_CRITERIA: ScoringCriteria = {
  failureInstructions: {
    description: 'Provides failure handling instructions',
    points: 3,
    checks: ['Error scenarios covered', 'Recovery procedures', 'Failure modes documented']
  },
  fallbacks: {
    description: 'Defines fallback strategies',
    points: 3,
    checks: ['Alternative approaches', 'Graceful degradation', 'Backup plans']
  },
  noSilentFailures: {
    description: 'Avoids silent failures',
    points: 2,
    checks: ['Errors are reported', 'Status checking', 'Validation steps']
  },
  edgeCases: {
    description: 'Handles edge cases',
    points: 2,
    checks: ['Boundary conditions', 'Unusual inputs', 'Resource limitations']
  }
};

export const SCOPE_CRITERIA: ScoringCriteria = {
  singleResponsibility: {
    description: 'Follows single responsibility principle',
    points: 2,
    checks: ['Does one thing well', 'No feature creep', 'Clear boundaries']
  },
  accurateDescription: {
    description: 'Description accurately reflects functionality',
    points: 2,
    checks: ['Title matches content', 'No overselling', 'Honest limitations']
  },
  specificTriggers: {
    description: 'Has specific, clear trigger conditions',
    points: 2,
    checks: ['Clear activation conditions', 'Specific use cases', 'Unambiguous triggers']
  },
  negativeExamples: {
    description: 'Includes negative routing examples (what NOT to use this for)',
    points: 2,
    checks: ['Negative examples defined', 'Clear routing boundaries']
  },
  routingQuality: {
    description: 'Description has concrete routing signals',
    points: 1,
    checks: ['Tool names mentioned', 'Input/output specified', 'Use-when patterns']
  },
  noConflicts: {
    description: 'No conflicts with other skills or systems',
    points: 2,
    checks: ['Namespace isolation', 'No resource conflicts', 'Compatible operations']
  }
};

export const DOCUMENTATION_CRITERIA: ScoringCriteria = {
  usageExamples: {
    description: 'Provides clear usage examples',
    points: 3,
    checks: ['Working examples', 'Multiple use cases', 'Expected outputs shown']
  },
  inputOutput: {
    description: 'Documents expected inputs and outputs',
    points: 2,
    checks: ['Input format documented', 'Output format clear', 'Data types specified']
  },
  edgeCaseDocumentation: {
    description: 'Documents edge cases and limitations',
    points: 2,
    checks: ['Known limitations', 'Edge case behavior', 'Boundary conditions']
  },
  troubleshooting: {
    description: 'Includes troubleshooting guidance',
    points: 1,
    checks: ['Common issues', 'Debug steps', 'FAQ or troubleshooting section']
  },
  embeddedTemplates: {
    description: 'Has embedded templates or worked examples with expected output',
    points: 2,
    checks: ['Code block templates', 'Expected output examples', 'Structured output formats']
  }
};

export const PORTABILITY_CRITERIA: ScoringCriteria = {
  crossPlatform: {
    description: 'Works across different platforms',
    points: 3,
    checks: ['Platform-agnostic commands', 'No OS-specific assumptions', 'Cross-platform tools']
  },
  noHardcodedPaths: {
    description: 'Avoids hardcoded paths',
    points: 2,
    checks: ['Relative paths used', 'Environment-based paths', 'No absolute paths']
  },
  notesLimitations: {
    description: 'Notes platform limitations',
    points: 3,
    checks: ['Platform requirements stated', 'Known incompatibilities', 'OS-specific notes']
  },
  relativePaths: {
    description: 'Uses relative paths appropriately',
    points: 2,
    checks: ['Relative to skill directory', 'No home directory assumptions', 'Portable references']
  }
};

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