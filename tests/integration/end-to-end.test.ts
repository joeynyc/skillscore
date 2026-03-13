import { describe, it, expect } from 'vitest';
import { SkillParser } from '../../src/parsers/skillParser';
import { SkillScorer } from '../../src/scorer';
import { TerminalReporter } from '../../src/reporters/terminalReporter';
import { JsonReporter } from '../../src/reporters/jsonReporter';
import { MarkdownReporter } from '../../src/reporters/markdownReporter';
import path from 'path';

describe('End-to-End Integration', () => {
  const fixturesPath = path.join(__dirname, '..', 'fixtures');

  describe('Complete Scoring Pipeline', () => {
    it('should process perfect skill end-to-end', async () => {
      const skillPath = path.join(fixturesPath, 'perfect-skill');

      // Parse
      const parser = new SkillParser();
      const skill = await parser.parseSkill(skillPath);

      // Score
      const scorer = new SkillScorer();
      const score = await scorer.scoreSkill(skill);

      // Generate all report formats
      const terminalReporter = new TerminalReporter();
      const jsonReporter = new JsonReporter();
      const markdownReporter = new MarkdownReporter();

      const terminalOutput = terminalReporter.generateReport(score);
      const jsonOutput = jsonReporter.generateReport(score);
      const markdownOutput = markdownReporter.generateReport(score);

      // Verify terminal output — name comes from frontmatter now
      expect(terminalOutput).toContain('system-health-checker');
      expect(terminalOutput).toMatch(/[AB][+-]?/);
      expect(terminalOutput).toContain('SKILLSCORE EVALUATION REPORT');

      // Verify JSON output
      const jsonData = JSON.parse(jsonOutput);
      expect(jsonData.skillName).toBe('system-health-checker');
      expect(jsonData.overallScore.percentage).toBeGreaterThanOrEqual(85);
      expect(jsonData.categories).toHaveLength(7);

      // Verify Markdown output
      expect(markdownOutput).toContain('# 📊 SkillScore Evaluation Report');
      expect(markdownOutput).toContain('system-health-checker');
      expect(markdownOutput).toContain('| Category | Score |');
    });

    it('should handle terrible skill appropriately', async () => {
      const skillPath = path.join(fixturesPath, 'terrible-skill');

      const parser = new SkillParser();
      const skill = await parser.parseSkill(skillPath);

      const scorer = new SkillScorer();
      const score = await scorer.scoreSkill(skill);

      // Should score poorly
      expect(score.percentage).toBeLessThan(60);
      expect(score.letterGrade).toBe('F');

      // Should identify specific problems
      const safetyCategory = score.categoryScores.find(cat => cat.category.id === 'safety');
      expect(safetyCategory).toBeDefined();
      expect(safetyCategory!.percentage).toBeLessThan(50);
    });

    it('should score mediocre skill in the middle', async () => {
      const skillPath = path.join(fixturesPath, 'mediocre-skill');

      const parser = new SkillParser();
      const skill = await parser.parseSkill(skillPath);

      const scorer = new SkillScorer();
      const score = await scorer.scoreSkill(skill);

      expect(score.percentage).toBeGreaterThan(60);
      expect(score.percentage).toBeLessThan(90);
    });
  });

  describe('False Positive Prevention', () => {
    it('should not flag URL fragments as hardcoded paths', async () => {
      const skillPath = path.join(fixturesPath, 'url-skill');

      const parser = new SkillParser();
      const skill = await parser.parseSkill(skillPath);

      const scorer = new SkillScorer();
      const score = await scorer.scoreSkill(skill);

      // Find portability category
      const portabilityCategory = score.categoryScores.find(cat => cat.category.id === 'portability');
      expect(portabilityCategory).toBeDefined();

      // Should NOT have hardcoded path failures for URL fragments
      const hardcodedPathFailures = portabilityCategory!.findings.filter(
        f => f.type === 'fail' && f.message.includes('Hardcoded paths found')
      );

      expect(hardcodedPathFailures.length).toBe(0);

      // Should have decent portability score
      expect(portabilityCategory!.percentage).toBeGreaterThan(70);
    });
  });

  describe('Output Format Validation', () => {
    it('should generate valid JSON for all test skills', async () => {
      const skillPaths = ['perfect-skill', 'terrible-skill', 'mediocre-skill', 'url-skill'];
      const parser = new SkillParser();
      const scorer = new SkillScorer();
      const jsonReporter = new JsonReporter();

      for (const skillName of skillPaths) {
        const skillPath = path.join(fixturesPath, skillName);
        const skill = await parser.parseSkill(skillPath);
        const score = await scorer.scoreSkill(skill);
        const jsonOutput = jsonReporter.generateReport(score);

        // Should parse as valid JSON
        expect(() => JSON.parse(jsonOutput)).not.toThrow();

        // Should have required fields
        const data = JSON.parse(jsonOutput);
        expect(data).toHaveProperty('skillName');
        expect(data).toHaveProperty('overallScore');
        expect(data).toHaveProperty('categories');
        expect(data.categories).toHaveLength(7);
      }
    });

    it('should generate valid markdown for all test skills', async () => {
      const skillPaths = ['perfect-skill', 'terrible-skill', 'mediocre-skill', 'url-skill'];
      const parser = new SkillParser();
      const scorer = new SkillScorer();
      const markdownReporter = new MarkdownReporter();

      for (const skillName of skillPaths) {
        const skillPath = path.join(fixturesPath, skillName);
        const skill = await parser.parseSkill(skillPath);
        const score = await scorer.scoreSkill(skill);
        const markdownOutput = markdownReporter.generateReport(score);

        // Should have markdown structure
        expect(markdownOutput).toContain('# 📊 SkillScore Evaluation Report');
        expect(markdownOutput).toContain('## 📋 Skill Information');
        expect(markdownOutput).toContain('| Category |');
        expect(markdownOutput).toMatch(/\| .+ \| \d+\/\d+ \| \d+\.\d+% \|/);
      }
    });
  });

  describe('Scoring Consistency', () => {
    it('should produce consistent scores across runs', async () => {
      const skillPath = path.join(fixturesPath, 'perfect-skill');
      const parser = new SkillParser();
      const scorer = new SkillScorer();

      // Run scoring multiple times
      const scores = [];
      for (let i = 0; i < 3; i++) {
        const skill = await parser.parseSkill(skillPath);
        const score = await scorer.scoreSkill(skill);
        scores.push(score);
      }

      // All runs should produce identical scores
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i].percentage).toBe(scores[0].percentage);
        expect(scores[i].letterGrade).toBe(scores[0].letterGrade);
        expect(scores[i].categoryScores).toHaveLength(scores[0].categoryScores.length);
      }
    });
  });

  describe('Error Resilience', () => {
    it('should handle malformed skills gracefully', async () => {
      const mockSkill = {
        skillPath: '/test',
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

      const scorer = new SkillScorer();
      const score = await scorer.scoreSkill(mockSkill);

      expect(score).toBeDefined();
      expect(score.percentage).toBeDefined();
      expect(score.letterGrade).toBeDefined();
      expect(score.categoryScores).toHaveLength(7);
      expect(score.percentage).toBeLessThan(50);
    });
  });
});
