import { describe, it, expect, beforeEach } from 'vitest';
import { SkillScorer } from '../../src/scorer';
import { SkillParser } from '../../src/parsers/skillParser';
import path from 'path';

describe('SkillScorer', () => {
  let scorer: SkillScorer;
  let parser: SkillParser;
  const fixturesPath = path.join(__dirname, '..', 'fixtures');

  beforeEach(() => {
    scorer = new SkillScorer();
    parser = new SkillParser();
  });

  describe('Perfect Skill', () => {
    it('should score near 100% for perfect skill', async () => {
      const perfectSkillPath = path.join(fixturesPath, 'perfect-skill');
      const skill = await parser.parseSkill(perfectSkillPath);
      const score = await scorer.scoreSkill(skill);

      expect(score.percentage).toBeGreaterThanOrEqual(85);
      expect(score.letterGrade).toMatch(/[AB][+-]?/);
      expect(score.categoryScores).toHaveLength(7);
    });

    it('should have mostly high scores in categories for perfect skill', async () => {
      const perfectSkillPath = path.join(fixturesPath, 'perfect-skill');
      const skill = await parser.parseSkill(perfectSkillPath);
      const score = await scorer.scoreSkill(skill);

      const highScoringCategories = score.categoryScores.filter(cat => cat.percentage >= 80);
      expect(highScoringCategories.length).toBeGreaterThan(4);
    });
  });

  describe('Terrible Skill', () => {
    it('should score poorly for terrible skill', async () => {
      const terribleSkillPath = path.join(fixturesPath, 'terrible-skill');
      const skill = await parser.parseSkill(terribleSkillPath);
      const score = await scorer.scoreSkill(skill);

      expect(score.percentage).toBeLessThan(60);
      expect(score.letterGrade).toBe('F');
    });

    it('should flag safety issues in terrible skill', async () => {
      const terribleSkillPath = path.join(fixturesPath, 'terrible-skill');
      const skill = await parser.parseSkill(terribleSkillPath);
      const score = await scorer.scoreSkill(skill);

      const safetyCategory = score.categoryScores.find(cat => cat.category.id === 'safety');
      expect(safetyCategory).toBeDefined();
      expect(safetyCategory!.percentage).toBeLessThan(50);

      const failedFindings = safetyCategory!.findings.filter(f => f.type === 'fail');
      expect(failedFindings.length).toBeGreaterThan(0);
    });
  });

  describe('Mediocre Skill', () => {
    it('should score in the middle range', async () => {
      const mediocreSkillPath = path.join(fixturesPath, 'mediocre-skill');
      const skill = await parser.parseSkill(mediocreSkillPath);
      const score = await scorer.scoreSkill(skill);

      expect(score.percentage).toBeGreaterThan(60);
      expect(score.percentage).toBeLessThan(90);
    });
  });

  describe('URL Skill - False Positive Test', () => {
    it('should not flag URL fragments as hardcoded paths', async () => {
      const urlSkillPath = path.join(fixturesPath, 'url-skill');
      const skill = await parser.parseSkill(urlSkillPath);
      const score = await scorer.scoreSkill(skill);

      const portabilityCategory = score.categoryScores.find(cat => cat.category.id === 'portability');
      expect(portabilityCategory).toBeDefined();

      const hardcodedPathFindings = portabilityCategory!.findings.filter(
        f => f.type === 'fail' && f.message.includes('Hardcoded paths found')
      );
      expect(hardcodedPathFindings.length).toBe(0);
    });

    it('should have good portability score for URL skill', async () => {
      const urlSkillPath = path.join(fixturesPath, 'url-skill');
      const skill = await parser.parseSkill(urlSkillPath);
      const score = await scorer.scoreSkill(skill);

      const portabilityCategory = score.categoryScores.find(cat => cat.category.id === 'portability');
      expect(portabilityCategory!.percentage).toBeGreaterThan(70);
    });
  });

  describe('Category Scoring', () => {
    it('should test identity category specifically', async () => {
      const perfectSkillPath = path.join(fixturesPath, 'perfect-skill');
      const skill = await parser.parseSkill(perfectSkillPath);
      const score = await scorer.scoreSkill(skill);

      const identityCategory = score.categoryScores.find(cat => cat.category.id === 'identity');
      expect(identityCategory).toBeDefined();
      expect(identityCategory!.category.weight).toBe(0.20);
      expect(identityCategory!.maxScore).toBe(10);
    });

    it('should weight categories correctly', async () => {
      const perfectSkillPath = path.join(fixturesPath, 'perfect-skill');
      const skill = await parser.parseSkill(perfectSkillPath);
      const score = await scorer.scoreSkill(skill);

      const totalWeight = score.categoryScores.reduce((sum, cat) => sum + cat.category.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should calculate weighted scores correctly', async () => {
      const perfectSkillPath = path.join(fixturesPath, 'perfect-skill');
      const skill = await parser.parseSkill(perfectSkillPath);
      const score = await scorer.scoreSkill(skill);

      for (const category of score.categoryScores) {
        const expectedWeightedScore = category.score * category.category.weight;
        expect(category.weightedScore).toBeCloseTo(expectedWeightedScore, 2);
      }
    });
  });

  describe('New Scoring Checks', () => {
    it('should validate name format in identity scoring', async () => {
      const skill = await parser.parseSkill(path.join(fixturesPath, 'perfect-skill'));
      const score = await scorer.scoreSkill(skill);

      const identity = score.categoryScores.find(cat => cat.category.id === 'identity');
      expect(identity).toBeDefined();
      // Perfect skill has valid frontmatter name
      expect(identity!.percentage).toBe(100);
    });

    it('should check body line count in conciseness scoring', async () => {
      const skill = await parser.parseSkill(path.join(fixturesPath, 'perfect-skill'));
      expect(skill.bodyLineCount).toBeLessThan(500);
      expect(skill.bodyLineCount).toBeGreaterThan(0);
    });

    it('should detect frontmatter presence', async () => {
      const perfect = await parser.parseSkill(path.join(fixturesPath, 'perfect-skill'));
      expect(perfect.frontmatter.name).toBe('system-health-checker');
      expect(perfect.nameSource).toBe('frontmatter');

      const terrible = await parser.parseSkill(path.join(fixturesPath, 'terrible-skill'));
      expect(terrible.frontmatter.name).toBeUndefined();
      expect(terrible.nameSource).toBe('heading');
    });

    it('should detect third-person description', async () => {
      const skill = await parser.parseSkill(path.join(fixturesPath, 'perfect-skill'));
      const score = await scorer.scoreSkill(skill);

      const identity = score.categoryScores.find(cat => cat.category.id === 'identity');
      const thirdPersonFinding = identity!.findings.find(f => f.message.includes('well-formed'));
      expect(thirdPersonFinding).toBeDefined();
      expect(thirdPersonFinding!.type).toBe('pass');
    });

    it('should detect MCP format compliance', async () => {
      const skill = await parser.parseSkill(path.join(fixturesPath, 'perfect-skill'));
      const score = await scorer.scoreSkill(skill);

      const portability = score.categoryScores.find(cat => cat.category.id === 'portability');
      const mcpFinding = portability!.findings.find(f => f.message.includes('MCP'));
      expect(mcpFinding).toBeDefined();
      // No MCP mentions, so N/A → full points
      expect(mcpFinding!.points).toBe(2);
    });

    it('should detect time-sensitive info', async () => {
      const skill = await parser.parseSkill(path.join(fixturesPath, 'perfect-skill'));
      const score = await scorer.scoreSkill(skill);

      const portability = score.categoryScores.find(cat => cat.category.id === 'portability');
      const timeFinding = portability!.findings.find(f => f.message.includes('time-sensitive'));
      expect(timeFinding).toBeDefined();
      expect(timeFinding!.type).toBe('pass');
    });
  });

  describe('Scoring Edge Cases', () => {
    it('should handle empty skill gracefully', async () => {
      const skill = {
        skillPath: '/fake/path',
        skillMdExists: false,
        skillMdContent: '',
        name: '',
        description: '',
        files: [],
        metadata: {},
        structure: {
          hasSkillMd: false,
          hasReadme: false,
          hasPackageJson: false,
          hasScripts: false,
          totalFiles: 0,
          directories: [],
          fileTypes: {}
        },
        frontmatter: {},
        bodyContent: '',
        bodyLineCount: 0,
        nameSource: 'fallback' as const,
        descriptionSource: 'none' as const,
        referencedFiles: []
      };

      const score = await scorer.scoreSkill(skill);
      expect(score).toBeDefined();
      expect(score.percentage).toBeLessThan(60);
      expect(score.letterGrade).toBe('F');
    });
  });
});
