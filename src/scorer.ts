import { ParsedSkill } from './parsers/skillParser';
import {
  SCORING_CATEGORIES,
  ScoringCategory,
  getLetterGrade
} from './rubric';

export interface CategoryScore {
  category: ScoringCategory;
  score: number;
  maxScore: number;
  percentage: number;
  findings: Finding[];
  weightedScore: number;
}

export interface Finding {
  type: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  points: number;
}

export interface Reporter {
  generateReport(score: SkillScore): string;
}

export interface SkillScore {
  skill: ParsedSkill;
  categoryScores: CategoryScore[];
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  letterGrade: string;
  timestamp: Date;
}

export class SkillScorer {
  async scoreSkill(skill: ParsedSkill): Promise<SkillScore> {
    const categoryScores = SCORING_CATEGORIES.map(
      category => this.scoreCategory(skill, category)
    );

    const totalWeightedScore = categoryScores.reduce(
      (sum, cat) => sum + cat.weightedScore, 0
    );
    const percentage = (totalWeightedScore / 10) * 100;
    
    return {
      skill,
      categoryScores,
      totalScore: totalWeightedScore,
      maxTotalScore: 10,
      percentage,
      letterGrade: getLetterGrade(percentage),
      timestamp: new Date()
    };
  }

  private scoreCategory(skill: ParsedSkill, category: ScoringCategory): CategoryScore {
    let score = 0;
    let findings: Finding[] = [];

    switch (category.id) {
      case 'structure':
        ({ score, findings } = this.scoreStructure(skill));
        break;
      case 'clarity':
        ({ score, findings } = this.scoreClarity(skill));
        break;
      case 'safety':
        ({ score, findings } = this.scoreSafety(skill));
        break;
      case 'dependencies':
        ({ score, findings } = this.scoreDependencies(skill));
        break;
      case 'errorHandling':
        ({ score, findings } = this.scoreErrorHandling(skill));
        break;
      case 'scope':
        ({ score, findings } = this.scoreScope(skill));
        break;
      case 'documentation':
        ({ score, findings } = this.scoreDocumentation(skill));
        break;
      case 'portability':
        ({ score, findings } = this.scorePortability(skill));
        break;
    }

    const percentage = (score / category.maxScore) * 100;
    const weightedScore = score * category.weight;

    return {
      category,
      score,
      maxScore: category.maxScore,
      percentage,
      findings,
      weightedScore
    };
  }

  private scoreStructure(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];

    // SKILL.md exists (3 points)
    if (skill.skillMdExists) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'SKILL.md file exists',
        points: 3
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'SKILL.md file is missing',
        points: 0
      });
    }

    // Has name (2 points)
    if (skill.name && skill.name.length > 0) {
      score += 2;
      findings.push({
        type: 'pass',
        message: `Clear skill name: "${skill.name}"`,
        points: 2
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'No clear skill name found',
        points: 0
      });
    }

    // Has description (2 points)
    if (skill.description && skill.description.length > 20) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Clear description provided',
        points: 2
      });
    } else if (skill.description && skill.description.length > 0) {
      score += 1;
      findings.push({
        type: 'warning',
        message: 'Description is very brief',
        points: 1
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'No description found',
        points: 0
      });
    }

    // File organization (1 point)
    let orgScore = 0;
    if (skill.structure.totalFiles <= 20) orgScore += 0.25;
    if (skill.structure.directories.length <= 5) orgScore += 0.25;
    if (!skill.files.some(f => f.includes('tmp') || f.includes('temp') || f.includes('.log'))) {
      orgScore += 0.5;
    }
    
    const orgPoints = Math.min(Math.round(orgScore * 2) / 2, 1);
    score += orgPoints;
    findings.push({
      type: orgScore >= 0.75 ? 'pass' : orgScore >= 0.5 ? 'warning' : 'fail',
      message: `File organization: ${skill.structure.totalFiles} files, ${skill.structure.directories.length} directories`,
      points: orgPoints
    });

    // Artifact output spec (1 point)
    const outputPatterns = ['output', 'artifact', 'write to', 'save to', 'generates', 'produces', '/output', 'result file', 'deliverable'];
    const hasOutputSpec = outputPatterns.some(p => skill.skillMdContent.toLowerCase().includes(p));
    if (hasOutputSpec) {
      score += 1;
      findings.push({
        type: 'pass',
        message: 'Defines output location or artifacts',
        points: 1
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'No output/artifact specification found',
        points: 0
      });
    }

    // Follows conventions (1 point)
    let conventionScore = 0;
    if (skill.skillMdExists) conventionScore += 0.5;
    if (skill.skillMdContent.includes('# ') || skill.skillMdContent.includes('## ')) {
      conventionScore += 0.5;
    }
    
    score += conventionScore;
    findings.push({
      type: conventionScore >= 0.5 ? 'pass' : 'warning',
      message: `Convention compliance: ${conventionScore >= 0.5 ? 'follows' : 'partially follows'} standard format`,
      points: conventionScore
    });

    return { score: Math.min(score, 10), findings };
  }

  private scoreClarity(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const content = skill.skillMdContent.toLowerCase();

    // Specific instructions (3 points)
    const hasSteps = content.includes('step') || content.includes('1.') || content.includes('-');
    const hasCommands = content.includes('`') || content.includes('exec') || content.includes('run');
    if (hasSteps && hasCommands) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'Contains specific step-by-step instructions with commands',
        points: 3
      });
    } else if (hasSteps || hasCommands) {
      score += 2;
      findings.push({
        type: 'warning',
        message: 'Has some specific instructions but could be clearer',
        points: 2
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'Instructions lack specificity and clear steps',
        points: 0
      });
    }

    // No ambiguity (3 points)
    const ambiguousWords = ['maybe', 'might', 'could', 'perhaps', 'possibly', 'sometimes'];
    const ambiguityCount = ambiguousWords.filter(word => content.includes(word)).length;
    
    if (ambiguityCount === 0) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'No ambiguous language detected',
        points: 3
      });
    } else if (ambiguityCount <= 2) {
      score += 2;
      findings.push({
        type: 'warning',
        message: `Some ambiguous language detected (${ambiguityCount} instances)`,
        points: 2
      });
    } else {
      score += 1;
      findings.push({
        type: 'fail',
        message: `Multiple ambiguous words found (${ambiguityCount} instances)`,
        points: 1
      });
    }

    // Logical order (2 points)
    const hasNumberedSteps = /\d+\./.test(skill.skillMdContent);
    const hasOrderWords = content.includes('first') || content.includes('then') || content.includes('next');
    
    if (hasNumberedSteps || hasOrderWords) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Instructions follow logical order',
        points: 2
      });
    } else {
      score += 1;
      findings.push({
        type: 'warning',
        message: 'Could benefit from clearer ordering of steps',
        points: 1
      });
    }

    // Agent understanding (2 points)
    const hasTriggers = content.includes('when') || content.includes('if') || content.includes('trigger');
    const hasSuccessCriteria = content.includes('success') || content.includes('complete') || content.includes('done');
    
    if (hasTriggers && hasSuccessCriteria) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Clear triggers and success criteria defined',
        points: 2
      });
    } else if (hasTriggers || hasSuccessCriteria) {
      score += 1;
      findings.push({
        type: 'warning',
        message: 'Has some clarity for agents but could be improved',
        points: 1
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'Lacks clear triggers or success criteria for agents',
        points: 0
      });
    }

    return { score: Math.min(score, 10), findings };
  }

  private scoreSafety(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const content = skill.skillMdContent.toLowerCase();

    // Destructive commands (3 points)
    const destructiveCommands = ['rm -rf', 'rm -f', 'del /f', 'format', 'fdisk', 'dd if='];
    const destructiveFound = destructiveCommands.filter(cmd => content.includes(cmd.toLowerCase()));
    
    if (destructiveFound.length === 0) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'No dangerous destructive commands found',
        points: 3
      });
    } else {
      const hasConfirmation = content.includes('confirm') || content.includes('ask') || content.includes('prompt');
      if (hasConfirmation) {
        score += 2;
        findings.push({
          type: 'warning',
          message: `Destructive commands found but with confirmation: ${destructiveFound.join(', ')}`,
          points: 2
        });
      } else {
        findings.push({
          type: 'fail',
          message: `Dangerous commands without confirmation: ${destructiveFound.join(', ')}`,
          points: 0
        });
      }
    }

    // Secret exfiltration (3 points)
    const secretPatterns = [
      'password', 'secret', 'token', 'api_key', 'private_key', 
      'ssh_key', 'credential', 'auth', '.env'
    ];
    const exfilPatterns = ['curl', 'wget', 'http', 'upload', 'send', 'post'];
    
    const hasSecrets = secretPatterns.some(pattern => content.includes(pattern));
    const hasExfil = exfilPatterns.some(pattern => content.includes(pattern));
    
    if (!hasSecrets || !hasExfil) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'No obvious secret exfiltration risks',
        points: 3
      });
    } else {
      const hasProtection = content.includes('sanitize') || content.includes('redact') || content.includes('mask');
      if (hasProtection) {
        score += 2;
        findings.push({
          type: 'warning',
          message: 'Potential secret handling with protection measures',
          points: 2
        });
      } else {
        score += 1;
        findings.push({
          type: 'warning',
          message: 'Potential secret exfiltration risk detected',
          points: 1
        });
      }
    }

    // Unbounded loops (1 point)
    const loopPatterns = ['while true', 'for (;;)', 'infinite', 'forever'];
    const unboundedLoops = loopPatterns.filter(pattern => content.includes(pattern));
    
    if (unboundedLoops.length === 0) {
      score += 1;
      findings.push({
        type: 'pass',
        message: 'No unbounded loops detected',
        points: 1
      });
    } else {
      const hasBreakCondition = content.includes('break') || content.includes('exit') || content.includes('timeout');
      if (hasBreakCondition) {
        score += 1;
        findings.push({
          type: 'warning',
          message: 'Potential unbounded loops with break conditions',
          points: 1
        });
      } else {
        findings.push({
          type: 'fail',
          message: `Unbounded loops without exit conditions: ${unboundedLoops.join(', ')}`,
          points: 0
        });
      }
    }

    // Network containment (1 point)
    const networkTerms = ['curl', 'wget', 'fetch', 'http', 'https', 'api', 'endpoint', 'request'];
    const hasNetwork = networkTerms.some(term => content.includes(term));
    if (hasNetwork) {
      const containmentTerms = ['allowlist', 'whitelist', 'restrict', 'domain', 'scope', 'trusted', 'untrusted', 'sanitize', 'validate response'];
      const hasContainment = containmentTerms.some(term => content.includes(term));
      if (hasContainment) {
        score += 1;
        findings.push({
          type: 'pass',
          message: 'Network usage with containment measures',
          points: 1
        });
      } else {
        findings.push({
          type: 'fail',
          message: 'Network usage without containment measures',
          points: 0
        });
      }
    } else {
      score += 1;
      findings.push({
        type: 'pass',
        message: 'No network usage detected (containment N/A)',
        points: 1
      });
    }

    // Permissions (2 points)
    const privEscalation = ['sudo', 'su -', 'chmod 777', 'chown root'];
    const privFound = privEscalation.filter(cmd => content.includes(cmd));
    
    if (privFound.length === 0) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'No privilege escalation commands found',
        points: 2
      });
    } else {
      const hasJustification = content.includes('require') || content.includes('need') || content.includes('admin');
      if (hasJustification) {
        score += 1;
        findings.push({
          type: 'warning',
          message: `Privilege escalation with justification: ${privFound.join(', ')}`,
          points: 1
        });
      } else {
        findings.push({
          type: 'fail',
          message: `Privilege escalation without justification: ${privFound.join(', ')}`,
          points: 0
        });
      }
    }

    return { score: Math.min(score, 10), findings };
  }

  private scoreDependencies(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const content = skill.skillMdContent.toLowerCase();

    // Lists tools (3 points)
    const toolKeywords = ['require', 'depend', 'need', 'install', 'tool', 'api', 'library'];
    const hasToolSection = toolKeywords.some(keyword => content.includes(keyword));
    
    if (hasToolSection) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'Tools and dependencies are documented',
        points: 3
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'No clear documentation of required tools or dependencies',
        points: 0
      });
    }

    // Checks before running (2 points)
    const checkPatterns = ['check', 'verify', 'validate', 'test', 'ensure', 'command -v'];
    const hasChecks = checkPatterns.some(pattern => content.includes(pattern));
    
    if (hasChecks) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Includes validation or checking of dependencies',
        points: 2
      });
    } else {
      findings.push({
        type: 'warning',
        message: 'Could benefit from dependency checking before execution',
        points: 0
      });
    }

    // Install instructions (3 points)
    const installPatterns = ['install', 'setup', 'brew', 'apt', 'npm install', 'pip install'];
    const hasInstallInstructions = installPatterns.some(pattern => content.includes(pattern));
    
    if (hasInstallInstructions) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'Installation instructions provided',
        points: 3
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'Missing installation instructions for dependencies',
        points: 0
      });
    }

    // Environment variables (2 points)
    const envPatterns = ['env', 'environment', 'variable', '$', 'export', 'set'];
    const hasEnvDocs = envPatterns.some(pattern => content.includes(pattern));
    
    if (hasEnvDocs) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Environment variables documented',
        points: 2
      });
    } else {
      findings.push({
        type: 'info',
        message: 'No environment variables documented (may not be needed)',
        points: 0
      });
    }

    return { score: Math.min(score, 10), findings };
  }

  private scoreErrorHandling(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const content = skill.skillMdContent.toLowerCase();

    // Failure instructions (3 points)
    const errorKeywords = ['error', 'fail', 'exception', 'problem', 'issue', 'troubleshoot'];
    const hasErrorHandling = errorKeywords.some(keyword => content.includes(keyword));
    
    if (hasErrorHandling) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'Error handling and failure scenarios documented',
        points: 3
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'No error handling or failure scenarios documented',
        points: 0
      });
    }

    // Fallbacks (3 points)
    const fallbackKeywords = ['fallback', 'alternative', 'backup', 'retry', 'recover', 'plan b'];
    const hasFallbacks = fallbackKeywords.some(keyword => content.includes(keyword));
    
    if (hasFallbacks) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'Fallback strategies documented',
        points: 3
      });
    } else {
      findings.push({
        type: 'warning',
        message: 'No fallback strategies documented',
        points: 0
      });
    }

    // No silent failures (2 points)
    const validationKeywords = ['validate', 'check', 'verify', 'status', 'confirm'];
    const hasValidation = validationKeywords.some(keyword => content.includes(keyword));
    
    if (hasValidation) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Validation and status checking included',
        points: 2
      });
    } else {
      findings.push({
        type: 'warning',
        message: 'Could benefit from validation to prevent silent failures',
        points: 0
      });
    }

    // Edge cases (2 points)
    const edgeKeywords = ['edge', 'boundary', 'limit', 'special case', 'exception', 'corner case'];
    const hasEdgeCases = edgeKeywords.some(keyword => content.includes(keyword));
    
    if (hasEdgeCases) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Edge cases and boundary conditions documented',
        points: 2
      });
    } else {
      findings.push({
        type: 'info',
        message: 'Edge cases not specifically documented',
        points: 0
      });
    }

    return { score: Math.min(score, 10), findings };
  }

  private scoreScope(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const content = skill.skillMdContent.toLowerCase();

    // Single responsibility (2 points)
    const wordCount = skill.description.split(' ').length;
    const hasMultipleVerbs = skill.description.match(/\b(and|or|also|plus|additionally)\b/gi);
    
    if (wordCount <= 50 && !hasMultipleVerbs) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Clear single responsibility focus',
        points: 2
      });
    } else if (wordCount <= 100) {
      score += 1;
      findings.push({
        type: 'warning',
        message: 'Mostly focused but could be more specific',
        points: 1
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'Scope appears too broad or unfocused',
        points: 0
      });
    }

    // Accurate description (2 points)
    const nameWords = skill.name.toLowerCase().split(/\s+/);
    const descWords = skill.description.toLowerCase().split(/\s+/);
    const overlap = nameWords.filter(word => descWords.includes(word)).length;
    
    if (overlap >= 1 || skill.description.length > 0) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Description aligns with skill name',
        points: 2
      });
    } else {
      findings.push({
        type: 'warning',
        message: 'Description may not accurately reflect functionality',
        points: 0
      });
    }

    // Specific triggers (2 points)
    const triggerWords = ['when', 'if', 'trigger', 'activate', 'invoke', 'call', 'execute'];
    const hasTriggers = triggerWords.some(word => content.includes(word));
    
    if (hasTriggers) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Clear trigger conditions specified',
        points: 2
      });
    } else {
      score += 1;
      findings.push({
        type: 'warning',
        message: 'Trigger conditions could be more specific',
        points: 1
      });
    }

    // Negative examples / routing boundaries (2 points)
    const negativePatterns = ["don't use", "do not use", "not for", "don't call", "instead use", "not when", "don't use when", "avoid using this"];
    const hasNegativeExamples = negativePatterns.some(p => content.includes(p));
    if (hasNegativeExamples) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Has negative routing examples (what NOT to use this for)',
        points: 2
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'No negative routing examples found',
        points: 0
      });
    }

    // Routing-quality description (1 point)
    const hasUseWhen = content.includes('use when') || content.includes('use this when');
    const hasToolNames = content.includes('curl') || content.includes('npm') || content.includes('pip') || content.includes('brew') || content.match(/`[a-z_-]+`/);
    const hasIOSignals = content.includes('input') || content.includes('output') || content.includes('returns') || content.includes('produces');
    if (hasUseWhen || (hasToolNames && hasIOSignals)) {
      score += 1;
      findings.push({
        type: 'pass',
        message: 'Description has concrete routing signals',
        points: 1
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'Description lacks concrete routing signals',
        points: 0
      });
    }

    // No conflicts (2 points)
    const conflictIndicators = ['override', 'replace', 'conflict', 'interfere'];
    const hasConflictWarnings = conflictIndicators.some(word => content.includes(word));
    
    if (!hasConflictWarnings) {
      score += 1;
      findings.push({
        type: 'pass',
        message: 'No obvious conflict indicators',
        points: 1
      });
    } else {
      findings.push({
        type: 'warning',
        message: 'Potential conflicts mentioned',
        points: 0
      });
    }

    return { score: Math.min(score, 10), findings };
  }

  private scoreDocumentation(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const content = skill.skillMdContent.toLowerCase();

    // Usage examples (3 points)
    const exampleKeywords = ['example', 'usage', '```', 'sample', 'demo'];
    const hasExamples = exampleKeywords.some(keyword => content.includes(keyword));
    
    if (hasExamples) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'Usage examples provided',
        points: 3
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'No usage examples found',
        points: 0
      });
    }

    // Input/Output (2 points)
    const ioKeywords = ['input', 'output', 'parameter', 'return', 'result'];
    const hasIODocs = ioKeywords.some(keyword => content.includes(keyword));
    
    if (hasIODocs) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Input/output documented',
        points: 2
      });
    } else {
      findings.push({
        type: 'warning',
        message: 'Input/output not clearly documented',
        points: 0
      });
    }

    // Edge case documentation (2 points)
    const limitationKeywords = ['limitation', 'constraint', 'caveat', 'note', 'warning', 'caution'];
    const hasLimitations = limitationKeywords.some(keyword => content.includes(keyword));
    
    if (hasLimitations) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Limitations and caveats documented',
        points: 2
      });
    } else {
      findings.push({
        type: 'warning',
        message: 'Limitations not documented',
        points: 0
      });
    }

    // Troubleshooting (1 point)
    const troubleshootKeywords = ['troubleshoot', 'debug', 'faq', 'common issue', 'problem'];
    const hasTroubleshooting = troubleshootKeywords.some(keyword => content.includes(keyword));
    
    if (hasTroubleshooting) {
      score += 1;
      findings.push({
        type: 'pass',
        message: 'Troubleshooting guidance provided',
        points: 1
      });
    } else {
      findings.push({
        type: 'info',
        message: 'No troubleshooting section found',
        points: 0
      });
    }

    // Embedded templates / worked examples (2 points)
    const codeBlockCount = (skill.skillMdContent.match(/```/g) || []).length / 2;
    const templateKeywords = ['template', 'format', 'example output', 'sample output', 'expected output'];
    const hasTemplateKeywords = templateKeywords.some(k => content.includes(k));
    const hasStructuredOutput = /```[\s\S]*?(json|yaml|xml|{[\s\S]*?}|\[[\s\S]*?\])[\s\S]*?```/.test(skill.skillMdContent);
    
    if (codeBlockCount >= 2 && (hasTemplateKeywords || hasStructuredOutput)) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Has embedded templates or worked examples with expected output',
        points: 2
      });
    } else if (codeBlockCount >= 1) {
      score += 1;
      findings.push({
        type: 'warning',
        message: 'Has code blocks but no clear template/output examples',
        points: 1
      });
    } else {
      findings.push({
        type: 'fail',
        message: 'No embedded templates or worked examples',
        points: 0
      });
    }

    return { score: Math.min(score, 10), findings };
  }

  private scorePortability(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const content = skill.skillMdContent;

    // Cross-platform (3 points)
    const osSpecific = ['/home/', '/Users/', 'C:\\', 'cmd.exe', '.exe', '/usr/local'];
    const hasOSSpecific = osSpecific.some(pattern => content.includes(pattern));
    
    if (!hasOSSpecific) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'No OS-specific paths or commands detected',
        points: 3
      });
    } else {
      score += 1;
      findings.push({
        type: 'warning',
        message: 'Contains OS-specific elements',
        points: 1
      });
    }

    // No hardcoded paths (2 points) - Fixed to exclude URL fragments
    const hardcodedPaths = this.findHardcodedPaths(content);
    
    if (hardcodedPaths.length === 0) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'No hardcoded absolute paths found',
        points: 2
      });
    } else {
      findings.push({
        type: 'fail',
        message: `Hardcoded paths found: ${hardcodedPaths.slice(0, 3).join(', ')}`,
        points: 0
      });
    }

    // Notes limitations (3 points)
    const platformKeywords = ['platform', 'system', 'os', 'linux', 'mac', 'windows', 'require'];
    const hasPlatformNotes = platformKeywords.some(keyword => content.toLowerCase().includes(keyword));
    
    if (hasPlatformNotes) {
      score += 3;
      findings.push({
        type: 'pass',
        message: 'Platform requirements or limitations noted',
        points: 3
      });
    } else {
      findings.push({
        type: 'warning',
        message: 'Platform compatibility not discussed',
        points: 0
      });
    }

    // Relative paths (2 points)
    const relativePaths = content.match(/\.\//g);
    const hasRelativePaths = relativePaths && relativePaths.length > 0;
    
    if (hasRelativePaths || hardcodedPaths.length === 0) {
      score += 2;
      findings.push({
        type: 'pass',
        message: 'Uses relative paths appropriately',
        points: 2
      });
    } else {
      findings.push({
        type: 'warning',
        message: 'Could benefit from using relative paths',
        points: 0
      });
    }

    return { score: Math.min(score, 10), findings };
  }

  private findHardcodedPaths(content: string): string[] {
    // Match potential absolute paths
    const potentialPaths = content.match(/\/[a-zA-Z0-9][a-zA-Z0-9\/_.-]*|[A-Z]:\\[a-zA-Z0-9\\._-]*/g) || [];
    
    const hardcodedPaths: string[] = [];
    
    for (const path of potentialPaths) {
      // Skip URLs (http://, https://, ftp://, etc.)
      if (/^\/\//.test(path) || content.includes(`http:${path}`) || content.includes(`https:${path}`) || content.includes(`ftp:${path}`)) {
        continue;
      }
      
      // Skip URL paths that are clearly part of URLs
      if (content.includes(`http://`) || content.includes(`https://`)) {
        // Check if this path appears after a domain in the content
        const urlPattern = new RegExp(`https?://[\\w.-]+${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
        if (urlPattern.test(content)) {
          continue;
        }
      }
      
      // Skip common non-filesystem patterns
      if (
        path.startsWith('/api/') || path.startsWith('/v1/') || path.startsWith('/v2/') ||
        path.includes('/data/') && content.includes('api') ||
        path.match(/\/[a-z0-9]+\/[a-z0-9]+$/) && content.includes('.com') ||
        path.length < 4 // Too short to be meaningful
      ) {
        continue;
      }
      
      // These look like real filesystem paths
      if (
        path.startsWith('/home/') || path.startsWith('/Users/') ||
        path.startsWith('/usr/') || path.startsWith('/opt/') ||
        path.startsWith('/etc/') || path.startsWith('/var/') ||
        path.startsWith('/tmp/') || path.startsWith('/bin/') ||
        path.startsWith('/sbin/') || path.match(/^[A-Z]:\\/) ||
        path.includes('/.') // Hidden files/dirs
      ) {
        hardcodedPaths.push(path);
      }
    }
    
    return hardcodedPaths;
  }
}