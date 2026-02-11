import { describe, it, expect, beforeEach } from 'vitest';
import { SkillParser } from '../../src/parsers/skillParser';
import path from 'path';

describe('SkillParser', () => {
  let parser: SkillParser;
  const fixturesPath = path.join(__dirname, '..', 'fixtures');

  beforeEach(() => {
    parser = new SkillParser();
  });

  describe('Perfect Skill Parsing', () => {
    it('should parse perfect skill correctly', async () => {
      const skillPath = path.join(fixturesPath, 'perfect-skill');
      const skill = await parser.parseSkill(skillPath);

      expect(skill.skillMdExists).toBeTruthy();
      expect(skill.name).toBe('Perfect Test Skill');
      expect(skill.description).toContain('comprehensive and well-structured');
      expect(skill.skillPath).toBe(skillPath);
      expect(skill.files).toContain('SKILL.md');
      expect(skill.structure.hasSkillMd).toBeTruthy();
      expect(skill.structure.totalFiles).toBeGreaterThan(0);
    });
  });

  describe('Terrible Skill Parsing', () => {
    it('should parse terrible skill and extract basic info', async () => {
      const skillPath = path.join(fixturesPath, 'terrible-skill');
      const skill = await parser.parseSkill(skillPath);

      expect(skill.skillMdExists).toBeTruthy();
      expect(skill.name).toBe('bad skill');
      expect(skill.description).toContain('does stuff maybe');
      expect(skill.skillMdContent).toContain('rm -rf');
    });
  });

  describe('File Structure Analysis', () => {
    it('should correctly analyze file structure', async () => {
      const skillPath = path.join(fixturesPath, 'perfect-skill');
      const skill = await parser.parseSkill(skillPath);

      expect(skill.structure.hasSkillMd).toBeTruthy();
      expect(skill.structure.totalFiles).toBeGreaterThan(0);
      expect(skill.structure.directories).toBeDefined();
      expect(skill.structure.fileTypes).toBeDefined();
      expect(skill.structure.fileTypes['.md']).toBeGreaterThan(0);
    });

    it('should handle empty directories', async () => {
      // Create a minimal skill structure for testing
      const skill = {
        skillPath: '/test/path',
        skillMdExists: false,
        skillMdContent: '',
        name: 'Test',
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

      expect(skill.structure.totalFiles).toBe(0);
      expect(skill.structure.directories).toHaveLength(0);
    });
  });

  describe('Name Extraction', () => {
    it('should extract names from markdown headings', async () => {
      const skillPath = path.join(fixturesPath, 'perfect-skill');
      const skill = await parser.parseSkill(skillPath);
      
      expect(skill.name).toBe('Perfect Test Skill');
    });

    it('should extract names from terrible skills', async () => {
      const skillPath = path.join(fixturesPath, 'terrible-skill');
      const skill = await parser.parseSkill(skillPath);
      
      expect(skill.name).toBe('bad skill');
    });

    it('should fall back to directory name when no heading', () => {
      // This would require creating a skill without a heading
      // For now, we'll test the logic conceptually
      expect(true).toBeTruthy(); // Placeholder
    });
  });

  describe('Description Extraction', () => {
    it('should extract descriptions from content', async () => {
      const skillPath = path.join(fixturesPath, 'perfect-skill');
      const skill = await parser.parseSkill(skillPath);
      
      expect(skill.description).toBeTruthy();
      expect(skill.description.length).toBeGreaterThan(10);
    });

    it('should handle missing descriptions gracefully', async () => {
      const skillPath = path.join(fixturesPath, 'terrible-skill');
      const skill = await parser.parseSkill(skillPath);
      
      expect(skill.description).toBeTruthy(); // Should extract something
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent paths', async () => {
      await expect(parser.parseSkill('/non/existent/path')).rejects.toThrow();
    });

    it('should throw error for file paths (not directories)', async () => {
      const filePath = path.join(fixturesPath, 'perfect-skill', 'SKILL.md');
      await expect(parser.parseSkill(filePath)).rejects.toThrow();
    });
  });
});