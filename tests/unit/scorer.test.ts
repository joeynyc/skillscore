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

      expect(score.percentage).toBeGreaterThanOrEqual(90);
      expect(score.letterGrade).toMatch(/A[+-]?/);
      expect(score.categoryScores).toHaveLength(8);
    });

    it('should have mostly high scores in categories for perfect skill', async () => {
      const perfectSkillPath = path.join(fixturesPath, 'perfect-skill');
      const skill = await parser.parseSkill(perfectSkillPath);
      const score = await scorer.scoreSkill(skill);

      // Most categories should score well, but some may have specific issues
      const highScoringCategories = score.categoryScores.filter(cat => cat.percentage >= 80);
      expect(highScoringCategories.length).toBeGreaterThan(5); // Most should be good
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

  describe('Good Skill (mediocre-skill fixture)', () => {
    it('should score well for good skill', async () => {
      const mediocreSkillPath = path.join(fixturesPath, 'mediocre-skill');
      const skill = await parser.parseSkill(mediocreSkillPath);
      const score = await scorer.scoreSkill(skill);

      expect(score.percentage).toBeGreaterThan(80);
      expect(['A', 'B'].some(grade => score.letterGrade.startsWith(grade))).toBeTruthy();
    });
  });

  describe('URL Skill - False Positive Test', () => {
    it('should not flag URL fragments as hardcoded paths', async () => {
      const urlSkillPath = path.join(fixturesPath, 'url-skill');
      const skill = await parser.parseSkill(urlSkillPath);
      const score = await scorer.scoreSkill(skill);

      const portabilityCategory = score.categoryScores.find(cat => cat.category.id === 'portability');
      expect(portabilityCategory).toBeDefined();
      
      // Should not flag URL fragments like /CSS, /api, /natural as hardcoded paths
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
    it('should test structure category specifically', async () => {
      const perfectSkillPath = path.join(fixturesPath, 'perfect-skill');
      const skill = await parser.parseSkill(perfectSkillPath);
      const score = await scorer.scoreSkill(skill);

      const structureCategory = score.categoryScores.find(cat => cat.category.id === 'structure');
      expect(structureCategory).toBeDefined();
      expect(structureCategory!.category.weight).toBe(0.15);
      expect(structureCategory!.maxScore).toBe(10);
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
        }
      };

      const score = await scorer.scoreSkill(skill);
      expect(score).toBeDefined();
      expect(score.percentage).toBeLessThan(60);
      expect(score.letterGrade).toBe('F');
    });
  });
});