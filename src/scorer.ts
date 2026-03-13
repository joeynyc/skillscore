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
      case 'identity':
        ({ score, findings } = this.scoreIdentity(skill));
        break;
      case 'conciseness':
        ({ score, findings } = this.scoreConciseness(skill));
        break;
      case 'clarity':
        ({ score, findings } = this.scoreClarity(skill));
        break;
      case 'routing':
        ({ score, findings } = this.scoreRouting(skill));
        break;
      case 'robustness':
        ({ score, findings } = this.scoreRobustness(skill));
        break;
      case 'safety':
        ({ score, findings } = this.scoreSafety(skill));
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

  // ── Identity & Metadata (10 pts) ──────────────────────────────────────

  private scoreIdentity(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];

    // (2) YAML frontmatter has `name` field
    if (skill.frontmatter.name && typeof skill.frontmatter.name === 'string') {
      score += 2;
      findings.push({ type: 'pass', message: `Frontmatter name: "${skill.frontmatter.name}"`, points: 2 });
    } else {
      findings.push({ type: 'fail', message: 'No name field in YAML frontmatter', points: 0 });
    }

    // (2) Name format: lowercase-hyphen, ≤64 chars, no "anthropic"/"claude"
    const nameVal = (skill.frontmatter.name as string | undefined) || skill.name;
    const validNameFormat = /^[a-z0-9][a-z0-9-]*$/.test(nameVal) && nameVal.length <= 64;
    const bannedNames = ['anthropic', 'claude'];
    const hasBannedName = bannedNames.some(b => nameVal.toLowerCase().includes(b));

    if (validNameFormat && !hasBannedName) {
      score += 2;
      findings.push({ type: 'pass', message: 'Name format valid (lowercase-hyphen, ≤64 chars)', points: 2 });
    } else if (hasBannedName) {
      findings.push({ type: 'fail', message: 'Name contains reserved word ("anthropic" or "claude")', points: 0 });
    } else {
      findings.push({ type: 'fail', message: `Name format invalid (expected lowercase-hyphen ≤64 chars, got "${nameVal}")`, points: 0 });
    }

    // (1) Name not vague
    const vagueNames = ['helper', 'utils', 'tools', 'misc', 'stuff', 'things'];
    const isVagueName = vagueNames.some(v => nameVal.toLowerCase() === v || nameVal.toLowerCase().endsWith(`-${v}`));
    if (!isVagueName) {
      score += 1;
      findings.push({ type: 'pass', message: 'Name is specific (not vague)', points: 1 });
    } else {
      findings.push({ type: 'fail', message: `Name is too vague: "${nameVal}"`, points: 0 });
    }

    // (2) YAML frontmatter has `description` field
    if (skill.frontmatter.description && typeof skill.frontmatter.description === 'string') {
      score += 2;
      findings.push({ type: 'pass', message: 'Frontmatter description present', points: 2 });
    } else {
      findings.push({ type: 'fail', message: 'No description field in YAML frontmatter', points: 0 });
    }

    // (2) Description quality: non-empty, ≤1024 chars, no XML tags, third person
    const desc = (skill.frontmatter.description as string | undefined) || skill.description;
    if (desc && desc.length > 0) {
      const descOk = desc.length <= 1024 && !/<[^>]+>/.test(desc);
      // Third person: should not start with I/We/My
      const thirdPerson = !/^(I |We |My )/i.test(desc.trim());

      if (descOk && thirdPerson) {
        score += 2;
        findings.push({ type: 'pass', message: 'Description is well-formed (≤1024 chars, third person, no XML)', points: 2 });
      } else if (!thirdPerson) {
        score += 1;
        findings.push({ type: 'warning', message: 'Description uses first person — prefer third person', points: 1 });
      } else {
        score += 1;
        findings.push({ type: 'warning', message: 'Description has formatting issues', points: 1 });
      }
    } else {
      findings.push({ type: 'fail', message: 'Description is empty', points: 0 });
    }

    // (1) Description not vague
    const vagueDescPhrases = ['helps with', 'does stuff', 'does things', 'a tool', 'a helper'];
    const isVagueDesc = desc ? vagueDescPhrases.some(v => desc.toLowerCase().includes(v)) : true;
    if (!isVagueDesc) {
      score += 1;
      findings.push({ type: 'pass', message: 'Description is specific (not vague)', points: 1 });
    } else {
      findings.push({ type: 'fail', message: 'Description is vague or missing', points: 0 });
    }

    return { score: Math.min(score, 10), findings };
  }

  // ── Conciseness (10 pts) ──────────────────────────────────────────────

  private scoreConciseness(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const lineCount = skill.bodyLineCount;

    // (3) Body ≤500 lines
    if (lineCount <= 500) {
      score += 3;
      findings.push({ type: 'pass', message: `Body is ${lineCount} lines (≤500)`, points: 3 });
    } else if (lineCount <= 750) {
      score += 2;
      findings.push({ type: 'warning', message: `Body is ${lineCount} lines (500-750, consider trimming)`, points: 2 });
    } else {
      findings.push({ type: 'fail', message: `Body is ${lineCount} lines (>750, too long)`, points: 0 });
    }

    // (2) Progressive disclosure: references separate files
    if (skill.referencedFiles.length > 0) {
      score += 2;
      findings.push({ type: 'pass', message: `References ${skill.referencedFiles.length} external file(s) for progressive disclosure`, points: 2 });
    } else {
      findings.push({ type: 'info', message: 'No file references for progressive disclosure', points: 0 });
    }

    // (2) Not too many alternatives
    const content = skill.skillMdContent.toLowerCase();
    const alternativePatterns = ['alternatively', 'or you could', 'another option', 'you could also', 'another approach'];
    const altCount = alternativePatterns.reduce((count, p) => {
      const matches = content.match(new RegExp(p, 'gi'));
      return count + (matches ? matches.length : 0);
    }, 0);

    if (altCount <= 5) {
      score += 2;
      findings.push({ type: 'pass', message: `Alternative suggestions: ${altCount} (≤5)`, points: 2 });
    } else {
      findings.push({ type: 'warning', message: `Too many alternatives (${altCount} > 5) — be more decisive`, points: 0 });
    }

    // (2) No over-explaining basics
    const basicExplanations = [
      'json stands for', 'git is a', 'api stands for', 'http stands for',
      'html stands for', 'css stands for', 'sql stands for'
    ];
    const overExplains = basicExplanations.some(b => content.includes(b));
    if (!overExplains) {
      score += 2;
      findings.push({ type: 'pass', message: 'Does not over-explain basics Claude already knows', points: 2 });
    } else {
      findings.push({ type: 'warning', message: 'Over-explains basic concepts Claude already knows', points: 0 });
    }

    // (1) References stay one level deep
    const deepRefs = skill.referencedFiles.filter(f => f.split('/').length > 3);
    if (deepRefs.length === 0) {
      score += 1;
      findings.push({ type: 'pass', message: 'File references are shallow (≤2 levels deep)', points: 1 });
    } else {
      findings.push({ type: 'warning', message: `Deep file references found: ${deepRefs.join(', ')}`, points: 0 });
    }

    return { score: Math.min(score, 10), findings };
  }

  // ── Clarity & Instructions (10 pts) ───────────────────────────────────

  private scoreClarity(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const content = skill.skillMdContent;
    const contentLower = content.toLowerCase();

    // (3) Workflow steps: numbered lists or checklists
    const hasNumberedSteps = /^\d+\.\s/m.test(content);
    const hasChecklists = /^- \[[ x]\]/m.test(content);
    if (hasNumberedSteps || hasChecklists) {
      score += 3;
      findings.push({ type: 'pass', message: 'Has structured workflow steps (numbered lists or checklists)', points: 3 });
    } else if (content.includes('- ')) {
      score += 1;
      findings.push({ type: 'warning', message: 'Has bullet lists but no numbered steps or checklists', points: 1 });
    } else {
      findings.push({ type: 'fail', message: 'No structured workflow steps found', points: 0 });
    }

    // (2) Consistent terminology (no synonym pairs both used 3+ times)
    const synonymPairs: [string, string][] = [
      ['run', 'execute'], ['create', 'make'], ['delete', 'remove'],
      ['start', 'begin'], ['finish', 'complete'], ['get', 'fetch'],
      ['send', 'transmit'], ['file', 'document'], ['error', 'failure']
    ];
    let inconsistentTerms = 0;
    for (const [a, b] of synonymPairs) {
      const countA = (contentLower.match(new RegExp(`\\b${a}\\b`, 'g')) || []).length;
      const countB = (contentLower.match(new RegExp(`\\b${b}\\b`, 'g')) || []).length;
      if (countA >= 3 && countB >= 3) {
        inconsistentTerms++;
      }
    }
    if (inconsistentTerms === 0) {
      score += 2;
      findings.push({ type: 'pass', message: 'Consistent terminology throughout', points: 2 });
    } else {
      score += 1;
      findings.push({ type: 'warning', message: `${inconsistentTerms} synonym pair(s) used interchangeably`, points: 1 });
    }

    // (2) Templates or examples with code blocks
    const codeBlockCount = (content.match(/```/g) || []).length / 2;
    if (codeBlockCount >= 2) {
      score += 2;
      findings.push({ type: 'pass', message: `${Math.floor(codeBlockCount)} code blocks with templates/examples`, points: 2 });
    } else if (codeBlockCount >= 1) {
      score += 1;
      findings.push({ type: 'warning', message: 'Only 1 code block — add more examples', points: 1 });
    } else {
      findings.push({ type: 'fail', message: 'No code blocks or templates found', points: 0 });
    }

    // (2) Degrees of freedom signals
    const imperative = ['must', 'always', 'never', 'shall', 'required'].filter(w => contentLower.includes(w));
    const flexible = ['consider', 'optionally', 'prefer', 'may', 'recommended'].filter(w => contentLower.includes(w));
    if (imperative.length > 0 && flexible.length > 0) {
      score += 2;
      findings.push({ type: 'pass', message: 'Good mix of imperative and flexible guidance', points: 2 });
    } else if (imperative.length > 0 || flexible.length > 0) {
      score += 1;
      findings.push({ type: 'warning', message: 'One-sided guidance — mix "must" with "consider"', points: 1 });
    } else {
      findings.push({ type: 'fail', message: 'No degrees-of-freedom signals found', points: 0 });
    }

    // (1) Checklist items
    if (hasChecklists) {
      score += 1;
      findings.push({ type: 'pass', message: 'Has checklist items (- [ ])', points: 1 });
    } else {
      findings.push({ type: 'info', message: 'No checklist items found', points: 0 });
    }

    return { score: Math.min(score, 10), findings };
  }

  // ── Routing & Scope (10 pts) ──────────────────────────────────────────

  private scoreRouting(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const desc = skill.description;
    const descLower = desc.toLowerCase();
    const content = skill.skillMdContent.toLowerCase();

    // (3) Description has WHAT (action verb) + WHEN (trigger/condition)
    const actionVerbs = ['creates', 'generates', 'analyzes', 'evaluates', 'deploys', 'monitors',
      'validates', 'formats', 'converts', 'transforms', 'checks', 'builds', 'tests',
      'integrates', 'backs up', 'compresses', 'uploads', 'processes', 'parses'];
    const triggerWords = ['when', 'if', 'trigger', 'upon', 'after', 'before', 'during'];

    const hasAction = actionVerbs.some(v => descLower.includes(v));
    const hasTrigger = triggerWords.some(t => descLower.includes(t)) ||
      content.includes('use when') || content.includes('use this when') || content.includes('triggered when');

    if (hasAction && hasTrigger) {
      score += 3;
      findings.push({ type: 'pass', message: 'Description has clear WHAT (action) + WHEN (trigger)', points: 3 });
    } else if (hasAction || hasTrigger) {
      score += 1;
      findings.push({ type: 'warning', message: `Description has ${hasAction ? 'action' : 'trigger'} but missing ${hasAction ? 'trigger' : 'action'}`, points: 1 });
    } else {
      findings.push({ type: 'fail', message: 'Description lacks clear action verb and trigger condition', points: 0 });
    }

    // (2) Negative routing examples
    const negativePatterns = ["don't use", "do not use", "not for", "don't call",
      "instead use", "not when", "don't use when", "avoid using this", "when not to use"];
    const hasNegativeExamples = negativePatterns.some(p => content.includes(p));
    if (hasNegativeExamples) {
      score += 2;
      findings.push({ type: 'pass', message: 'Has negative routing examples (what NOT to use this for)', points: 2 });
    } else {
      findings.push({ type: 'fail', message: 'No negative routing examples found', points: 0 });
    }

    // (2) Domain-specific vocabulary in description
    const genericWords = new Set(['do', 'make', 'use', 'get', 'set', 'run', 'help', 'thing', 'stuff']);
    const descWords = descLower.split(/\W+/).filter(w => w.length > 3 && !genericWords.has(w));
    const uniqueSpecificWords = new Set(descWords);
    if (uniqueSpecificWords.size >= 3) {
      score += 2;
      findings.push({ type: 'pass', message: 'Description uses domain-specific vocabulary', points: 2 });
    } else if (uniqueSpecificWords.size >= 1) {
      score += 1;
      findings.push({ type: 'warning', message: 'Description could use more specific vocabulary', points: 1 });
    } else {
      findings.push({ type: 'fail', message: 'Description is too generic', points: 0 });
    }

    // (2) Third-person voice (no "I ", "We ", "My " starts)
    const lines = skill.skillMdContent.split('\n');
    const firstPersonStarts = lines.filter(l => /^\s*(I |We |My )/i.test(l)).length;
    if (firstPersonStarts === 0) {
      score += 2;
      findings.push({ type: 'pass', message: 'Uses third-person voice throughout', points: 2 });
    } else if (firstPersonStarts <= 2) {
      score += 1;
      findings.push({ type: 'warning', message: `${firstPersonStarts} line(s) start with first person — prefer third person`, points: 1 });
    } else {
      findings.push({ type: 'fail', message: `${firstPersonStarts} lines start with first person`, points: 0 });
    }

    // (1) Description under 1024 chars, no scope creep
    if (desc.length > 0 && desc.length <= 1024) {
      score += 1;
      findings.push({ type: 'pass', message: `Description length: ${desc.length} chars (≤1024)`, points: 1 });
    } else if (desc.length > 1024) {
      findings.push({ type: 'fail', message: `Description too long: ${desc.length} chars (>1024)`, points: 0 });
    } else {
      findings.push({ type: 'fail', message: 'No description found', points: 0 });
    }

    return { score: Math.min(score, 10), findings };
  }

  // ── Robustness (10 pts) ───────────────────────────────────────────────

  private scoreRobustness(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const content = skill.skillMdContent;
    const contentLower = content.toLowerCase();

    // (3) Error handling in code blocks
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    const errorHandlingPatterns = ['try', 'catch', '||', 'set -e', 'if ', 'else', '2>&1',
      'trap', '|| exit', '|| echo', 'if !', 'if ['];
    const hasErrorHandling = codeBlocks.some(block => {
      const blockLower = block.toLowerCase();
      return errorHandlingPatterns.some(p => blockLower.includes(p));
    });

    if (hasErrorHandling) {
      score += 3;
      findings.push({ type: 'pass', message: 'Code blocks include error handling', points: 3 });
    } else if (codeBlocks.length === 0) {
      score += 1;
      findings.push({ type: 'info', message: 'No code blocks to check for error handling', points: 1 });
    } else {
      findings.push({ type: 'fail', message: 'Code blocks lack error handling (try/catch, ||, set -e)', points: 0 });
    }

    // (2) Validation steps near code blocks or numbered steps
    const validationKeywords = ['validate', 'verify', 'check', 'confirm', 'ensure', 'assert'];
    const hasValidation = validationKeywords.some(k => contentLower.includes(k));
    if (hasValidation) {
      score += 2;
      findings.push({ type: 'pass', message: 'Includes validation steps', points: 2 });
    } else {
      findings.push({ type: 'fail', message: 'No validation steps found', points: 0 });
    }

    // (2) No magic constants in scripts
    const magicNumberPattern = /\b(?:sleep|timeout|retry|wait|delay|limit)\s+\d+\b/;
    const hasMagicInCode = codeBlocks.some(block => magicNumberPattern.test(block));
    const hasCommentedNumbers = codeBlocks.some(block => /#.*\d/.test(block));
    if (!hasMagicInCode || hasCommentedNumbers) {
      score += 2;
      findings.push({ type: 'pass', message: 'No unexplained magic constants in scripts', points: 2 });
    } else {
      findings.push({ type: 'warning', message: 'Magic constants in scripts without explanation', points: 0 });
    }

    // (2) Dependencies documented with verification commands
    const verifyPatterns = ['command -v', 'which ', '--version', '-v ', 'verify'];
    const hasVerifyCommands = verifyPatterns.some(p => contentLower.includes(p));
    if (hasVerifyCommands) {
      score += 2;
      findings.push({ type: 'pass', message: 'Dependencies documented with verification commands', points: 2 });
    } else {
      findings.push({ type: 'fail', message: 'No dependency verification commands found', points: 0 });
    }

    // (1) Feedback loops
    const feedbackWords = ['review', 'iterate', 'verify the result', 'check the output', 'confirm the'];
    const hasFeedback = feedbackWords.some(w => contentLower.includes(w));
    if (hasFeedback) {
      score += 1;
      findings.push({ type: 'pass', message: 'Includes feedback loops (review/iterate/verify)', points: 1 });
    } else {
      findings.push({ type: 'info', message: 'No feedback loop signals found', points: 0 });
    }

    return { score: Math.min(score, 10), findings };
  }

  // ── Safety & Security (10 pts) ────────────────────────────────────────

  private scoreSafety(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const content = skill.skillMdContent;
    const contentLower = content.toLowerCase();

    // (3) No destructive commands without confirmation
    const destructiveCommands = ['rm -rf', 'rm -f', 'del /f', 'format', 'fdisk', 'dd if='];
    const destructiveFound = destructiveCommands.filter(cmd => contentLower.includes(cmd));

    if (destructiveFound.length === 0) {
      score += 3;
      findings.push({ type: 'pass', message: 'No dangerous destructive commands found', points: 3 });
    } else {
      const hasConfirmation = contentLower.includes('confirm') || contentLower.includes('ask') || contentLower.includes('prompt');
      if (hasConfirmation) {
        score += 2;
        findings.push({ type: 'warning', message: `Destructive commands with confirmation: ${destructiveFound.join(', ')}`, points: 2 });
      } else {
        findings.push({ type: 'fail', message: `Dangerous commands without confirmation: ${destructiveFound.join(', ')}`, points: 0 });
      }
    }

    // (2) No secret exfil risk (proximity-based: secrets + network within 5 lines)
    const lines = content.split('\n');
    const secretPatterns = ['password', 'secret', 'token', 'api_key', 'private_key', 'credential'];
    const networkPatterns = ['curl', 'wget', 'http', 'upload', 'send to'];
    let proximityRisk = false;

    for (let i = 0; i < lines.length; i++) {
      const line = (lines[i] || '').toLowerCase();
      const hasSecret = secretPatterns.some(p => line.includes(p));
      if (hasSecret) {
        // Check surrounding 5 lines for network patterns
        for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 6); j++) {
          const nearbyLine = (lines[j] || '').toLowerCase();
          if (networkPatterns.some(p => nearbyLine.includes(p))) {
            proximityRisk = true;
            break;
          }
        }
      }
      if (proximityRisk) break;
    }

    if (!proximityRisk) {
      score += 2;
      findings.push({ type: 'pass', message: 'No secret exfiltration risk detected', points: 2 });
    } else {
      const hasProtection = contentLower.includes('sanitize') || contentLower.includes('redact') || contentLower.includes('mask');
      if (hasProtection) {
        score += 1;
        findings.push({ type: 'warning', message: 'Potential secret + network proximity with protection measures', points: 1 });
      } else {
        findings.push({ type: 'fail', message: 'Secret references near network operations (exfiltration risk)', points: 0 });
      }
    }

    // (2) No privilege escalation
    const privEscalation = ['sudo', 'su -', 'chmod 777', 'chown root'];
    const privFound = privEscalation.filter(cmd => contentLower.includes(cmd));

    if (privFound.length === 0) {
      score += 2;
      findings.push({ type: 'pass', message: 'No privilege escalation commands found', points: 2 });
    } else {
      const hasJustification = contentLower.includes('require') || contentLower.includes('need') || contentLower.includes('install');
      if (hasJustification) {
        score += 1;
        findings.push({ type: 'warning', message: `Privilege escalation with justification: ${privFound.join(', ')}`, points: 1 });
      } else {
        findings.push({ type: 'fail', message: `Privilege escalation without justification: ${privFound.join(', ')}`, points: 0 });
      }
    }

    // (1) No unbounded loops
    const loopPatterns = ['while true', 'for (;;)', 'infinite', 'forever'];
    const unboundedLoops = loopPatterns.filter(pattern => contentLower.includes(pattern));

    if (unboundedLoops.length === 0) {
      score += 1;
      findings.push({ type: 'pass', message: 'No unbounded loops detected', points: 1 });
    } else {
      const hasBreak = contentLower.includes('break') || contentLower.includes('exit') || contentLower.includes('timeout');
      if (hasBreak) {
        score += 1;
        findings.push({ type: 'warning', message: 'Potential unbounded loops with break conditions', points: 1 });
      } else {
        findings.push({ type: 'fail', message: `Unbounded loops without exit conditions: ${unboundedLoops.join(', ')}`, points: 0 });
      }
    }

    // (1) File access matches stated purpose
    const fileOps = ['read', 'write', 'open', 'create file', 'mkdir'];
    const hasFileOps = fileOps.some(f => contentLower.includes(f));
    const hasFileScope = contentLower.includes('file') || contentLower.includes('directory') || contentLower.includes('path');
    if (!hasFileOps || hasFileScope) {
      score += 1;
      findings.push({ type: 'pass', message: 'File access appears consistent with stated purpose', points: 1 });
    } else {
      findings.push({ type: 'warning', message: 'File operations found without clear file-related purpose', points: 0 });
    }

    // (1) Network access matches stated purpose
    const networkTerms = ['curl', 'wget', 'fetch', 'http', 'api', 'endpoint'];
    const hasNetwork = networkTerms.some(term => contentLower.includes(term));
    const hasNetworkScope = contentLower.includes('api') || contentLower.includes('url') ||
      contentLower.includes('endpoint') || contentLower.includes('request') || contentLower.includes('upload');
    if (!hasNetwork || hasNetworkScope) {
      score += 1;
      findings.push({ type: 'pass', message: 'Network access matches stated purpose', points: 1 });
    } else {
      findings.push({ type: 'warning', message: 'Network operations without clear network-related purpose', points: 0 });
    }

    return { score: Math.min(score, 10), findings };
  }

  // ── Portability & Standards (10 pts) ──────────────────────────────────

  private scorePortability(skill: ParsedSkill): { score: number; findings: Finding[] } {
    let score = 0;
    const findings: Finding[] = [];
    const content = skill.skillMdContent;
    const contentLower = content.toLowerCase();

    // (3) No Windows-style paths
    const windowsPaths = /C:\\|\\\\server|\\\\[A-Za-z]/;
    if (!windowsPaths.test(content)) {
      score += 3;
      findings.push({ type: 'pass', message: 'No Windows-style paths detected', points: 3 });
    } else {
      score += 1;
      findings.push({ type: 'warning', message: 'Contains Windows-style paths (limits portability)', points: 1 });
    }

    // (2) No hardcoded absolute paths
    const hardcodedPaths = this.findHardcodedPaths(content);
    if (hardcodedPaths.length === 0) {
      score += 2;
      findings.push({ type: 'pass', message: 'No hardcoded absolute paths found', points: 2 });
    } else {
      findings.push({ type: 'fail', message: `Hardcoded paths found: ${hardcodedPaths.slice(0, 3).join(', ')}`, points: 0 });
    }

    // (2) MCP tool refs use ServerName:tool_name format (if any present)
    const mcpPattern = /\b[A-Z][a-zA-Z]*:[a-z_][a-z_0-9]*\b/;
    const mcpMention = contentLower.includes('mcp') || contentLower.includes('model context protocol');
    if (mcpMention) {
      if (mcpPattern.test(content)) {
        score += 2;
        findings.push({ type: 'pass', message: 'MCP tool references use ServerName:tool_name format', points: 2 });
      } else {
        findings.push({ type: 'fail', message: 'MCP mentioned but tool refs not in ServerName:tool_name format', points: 0 });
      }
    } else {
      // No MCP refs — not applicable, give full points
      score += 2;
      findings.push({ type: 'info', message: 'No MCP tool references (N/A)', points: 2 });
    }

    // (2) No time-sensitive info
    const timeSensitive = [
      /as of (january|february|march|april|may|june|july|august|september|october|november|december|\d{4})/i,
      /\b20\d{2}-\d{2}-\d{2}\b/, // ISO dates
      /pinned to version/i,
      /current version is/i,
      /latest version/i
    ];
    const hasTimeSensitive = timeSensitive.some(p => p.test(content));
    if (!hasTimeSensitive) {
      score += 2;
      findings.push({ type: 'pass', message: 'No time-sensitive information detected', points: 2 });
    } else {
      findings.push({ type: 'warning', message: 'Contains time-sensitive info (dates, pinned versions)', points: 0 });
    }

    // (1) Uses relative paths
    const relativePaths = content.match(/\.\//g);
    const hasRelativePaths = relativePaths && relativePaths.length > 0;
    if (hasRelativePaths || hardcodedPaths.length === 0) {
      score += 1;
      findings.push({ type: 'pass', message: 'Uses relative paths appropriately', points: 1 });
    } else {
      findings.push({ type: 'warning', message: 'Could benefit from using relative paths', points: 0 });
    }

    return { score: Math.min(score, 10), findings };
  }

  private findHardcodedPaths(content: string): string[] {
    const potentialPaths = content.match(/\/[a-zA-Z0-9][a-zA-Z0-9\/_.-]*|[A-Z]:\\[a-zA-Z0-9\\._-]*/g) || [];
    const hardcodedPaths: string[] = [];

    for (const p of potentialPaths) {
      // Skip URLs
      if (/^\/\//.test(p) || content.includes(`http:${p}`) || content.includes(`https:${p}`) || content.includes(`ftp:${p}`)) {
        continue;
      }

      if (content.includes('http://') || content.includes('https://')) {
        const urlPattern = new RegExp(`https?://[\\w.-]+${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
        if (urlPattern.test(content)) {
          continue;
        }
      }

      // Skip common non-filesystem patterns
      if (
        p.startsWith('/api/') || p.startsWith('/v1/') || p.startsWith('/v2/') ||
        p.includes('/data/') && content.includes('api') ||
        p.match(/\/[a-z0-9]+\/[a-z0-9]+$/) && content.includes('.com') ||
        p.length < 4
      ) {
        continue;
      }

      // Real filesystem paths
      if (
        p.startsWith('/home/') || p.startsWith('/Users/') ||
        p.startsWith('/usr/') || p.startsWith('/opt/') ||
        p.startsWith('/etc/') || p.startsWith('/var/') ||
        p.startsWith('/tmp/') || p.startsWith('/bin/') ||
        p.startsWith('/sbin/') || p.match(/^[A-Z]:\\/) ||
        p.includes('/.')
      ) {
        hardcodedPaths.push(p);
      }
    }

    return hardcodedPaths;
  }
}
