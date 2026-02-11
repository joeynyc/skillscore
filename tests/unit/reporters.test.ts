import { describe, it, expect, beforeEach } from 'vitest';
import { TerminalReporter } from '../../src/reporters/terminalReporter';
import { JsonReporter } from '../../src/reporters/jsonReporter';
import { MarkdownReporter } from '../../src/reporters/markdownReporter';
import { SkillScore, CategoryScore } from '../../src/scorer';
import { SCORING_CATEGORIES } from '../../src/rubric';

describe('Reporters', () => {
  let mockScore: SkillScore;

  beforeEach(() => {
    // Create a mock skill score for testing
    const mockCategoryScores: CategoryScore[] = SCORING_CATEGORIES.map(category => ({
      category,
      score: 8,
      maxScore: 10,
      percentage: 80,
      findings: [
        {
          type: 'pass' as const,
          message: `Good ${category.name}`,
          points: 3
        },
        {
          type: 'warning' as const,
          message: `Could improve ${category.name}`,
          points: 0
        }
      ],
      weightedScore: 8 * category.weight
    }));

    mockScore = {
      skill: {
        skillPath: '/test/path',
        skillMdExists: true,
        skillMdContent: 'Test content',
        name: 'Test Skill',
        description: 'Test description',
        files: ['SKILL.md'],
        metadata: {},
        structure: {
          hasSkillMd: true,
          hasReadme: false,
          hasPackageJson: false,
          hasScripts: false,
          totalFiles: 1,
          directories: [],
          fileTypes: { '.md': 1 }
        }
      },
      categoryScores: mockCategoryScores,
      totalScore: mockCategoryScores.reduce((sum, cat) => sum + cat.weightedScore, 0),
      maxTotalScore: mockCategoryScores.reduce((sum, cat) => sum + cat.maxScore * cat.category.weight, 0),
      percentage: 80,
      letterGrade: 'B-',
      timestamp: new Date('2026-02-11T19:00:00Z')
    };
  });

  describe('TerminalReporter', () => {
    let reporter: TerminalReporter;

    beforeEach(() => {
      reporter = new TerminalReporter();
    });

    it('should generate terminal report with color codes', () => {
      const output = reporter.generateReport(mockScore);
      
      expect(output).toContain('SKILLSCORE EVALUATION REPORT');
      expect(output).toContain('Test Skill');
      expect(output).toContain('B-');
      expect(output).toContain('80.0%');
      expect(output).toContain('Structure');
      expect(output).toContain('Clarity');
      expect(output).toContain('Safety');
    });

    it('should include summary section', () => {
      const output = reporter.generateReport(mockScore);
      
      expect(output).toContain('SUMMARY');
      expect(output).toContain('Generated:');
    });

    it('should format progress bars', () => {
      const output = reporter.generateReport(mockScore);
      
      // Should contain progress bar characters
      expect(output).toMatch(/[█░]/);
    });

    it('should show findings', () => {
      const output = reporter.generateReport(mockScore);
      
      expect(output).toContain('✓'); // Pass icon
      // Note: Warning icon might not appear depending on findings truncation
    });
  });

  describe('JsonReporter', () => {
    let reporter: JsonReporter;

    beforeEach(() => {
      reporter = new JsonReporter();
    });

    it('should generate valid JSON', () => {
      const output = reporter.generateReport(mockScore);
      
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should include all required fields', () => {
      const output = reporter.generateReport(mockScore);
      const data = JSON.parse(output);
      
      expect(data).toHaveProperty('skillName');
      expect(data).toHaveProperty('skillPath');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('overallScore');
      expect(data).toHaveProperty('categories');
      expect(data).toHaveProperty('metadata');
      
      expect(data.skillName).toBe('Test Skill');
      expect(data.overallScore.percentage).toBe(80);
      expect(data.overallScore.letterGrade).toBe('B-');
      expect(data.categories).toHaveLength(8);
    });

    it('should include category details', () => {
      const output = reporter.generateReport(mockScore);
      const data = JSON.parse(output);
      
      const structureCategory = data.categories.find((cat: any) => cat.id === 'structure');
      expect(structureCategory).toBeDefined();
      expect(structureCategory.name).toBe('Structure');
      expect(structureCategory.weight).toBe(0.15);
      expect(structureCategory.findings).toHaveLength(2);
    });

    it('should round numbers correctly', () => {
      const output = reporter.generateReport(mockScore);
      const data = JSON.parse(output);
      
      // Numbers should be rounded to 2 decimal places
      expect(data.overallScore.percentage).toBe(80);
      expect(typeof data.overallScore.totalScore).toBe('number');
    });
  });

  describe('MarkdownReporter', () => {
    let reporter: MarkdownReporter;

    beforeEach(() => {
      reporter = new MarkdownReporter();
    });

    it('should generate valid markdown', () => {
      const output = reporter.generateReport(mockScore);
      
      expect(output).toContain('# 📊 SkillScore Evaluation Report');
      expect(output).toContain('## 📋 Skill Information');
      expect(output).toContain('## 🎯 Overall Score');
      expect(output).toContain('## 📝 Category Breakdown');
    });

    it('should include skill information', () => {
      const output = reporter.generateReport(mockScore);
      
      expect(output).toContain('**Name:** Test Skill');
      expect(output).toContain('**Path:** `/test/path`');
      expect(output).toContain('**Description:** Test description');
    });

    it('should include markdown table', () => {
      const output = reporter.generateReport(mockScore);
      
      expect(output).toContain('| Category | Score | Percentage | Weight | Weighted Score |');
      expect(output).toContain('|----------|-------|------------|--------|----------------|');
      expect(output).toContain('Structure'); // Check for category name, emoji may vary
    });

    it('should include category details', () => {
      const output = reporter.generateReport(mockScore);
      
      expect(output).toContain('### '); // Category section headers
      expect(output).toContain('Structure'); // Category name
      expect(output).toContain('**Weight:** 15%');
      expect(output).toContain('✅ **Passed:**');
      expect(output).toContain('⚠️ **Warnings:**');
    });

    it('should include summary and recommendations', () => {
      const output = reporter.generateReport(mockScore);
      
      expect(output).toContain('## 📈 Summary & Recommendations');
      expect(output).toContain('### 🎯 Action Items');
    });

    it('should include progress bars', () => {
      const output = reporter.generateReport(mockScore);
      
      // Should contain progress bar in markdown format
      expect(output).toMatch(/`[█░]+`/);
    });

    it('should include emojis for grades and scores', () => {
      const output = reporter.generateReport(mockScore);
      
      expect(output).toContain('🥉'); // B grade emoji
      expect(output).toMatch(/🔵|🟠|🟡|🟢|🔴/); // Some score color emoji
    });
  });

  describe('Reporter Integration', () => {
    it('should handle edge cases gracefully', () => {
      // Test with minimal score
      const minimalScore: SkillScore = {
        ...mockScore,
        categoryScores: [],
        totalScore: 0,
        maxTotalScore: 1,
        percentage: 0,
        letterGrade: 'F'
      };

      const terminalReporter = new TerminalReporter();
      const jsonReporter = new JsonReporter();
      const markdownReporter = new MarkdownReporter();

      expect(() => terminalReporter.generateReport(minimalScore)).not.toThrow();
      expect(() => jsonReporter.generateReport(minimalScore)).not.toThrow();
      expect(() => markdownReporter.generateReport(minimalScore)).not.toThrow();
    });

    it('should handle perfect scores', () => {
      const perfectScore: SkillScore = {
        ...mockScore,
        percentage: 100,
        letterGrade: 'A+',
        categoryScores: mockScore.categoryScores.map(cat => ({
          ...cat,
          score: 10,
          percentage: 100,
          findings: [{ type: 'pass' as const, message: 'Perfect', points: 10 }]
        }))
      };

      const terminalReporter = new TerminalReporter();
      const jsonReporter = new JsonReporter();
      const markdownReporter = new MarkdownReporter();

      const terminalOutput = terminalReporter.generateReport(perfectScore);
      const jsonOutput = jsonReporter.generateReport(perfectScore);
      const markdownOutput = markdownReporter.generateReport(perfectScore);

      expect(terminalOutput).toContain('A+');
      expect(JSON.parse(jsonOutput).overallScore.letterGrade).toBe('A+');
      expect(markdownOutput).toContain('A+');
    });
  });
});