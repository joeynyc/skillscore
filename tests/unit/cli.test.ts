import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillScoreCli, CliError } from '../../src/cli';
import path from 'path';

describe('SkillScoreCli', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GitHub URL Detection', () => {
    it('should detect full GitHub URLs', () => {
      const cli = new SkillScoreCli();
      const isGitHubUrl = (cli as any).isGitHubUrl;
      
      expect(isGitHubUrl('https://github.com/user/repo')).toBeTruthy();
      expect(isGitHubUrl('https://github.com/user/repo/tree/main/skills/my-skill')).toBeTruthy();
      expect(isGitHubUrl('http://github.com/user/repo')).toBeTruthy();
    });

    it('should detect shorthand GitHub URLs only with --github flag', () => {
      const cli = new SkillScoreCli();
      const isGitHubUrl = (cli as any).isGitHubUrl;

      // Without flag, shorthands are NOT treated as GitHub URLs
      expect(isGitHubUrl('user/repo')).toBeFalsy();
      expect(isGitHubUrl('user/repo/path/to/skill')).toBeFalsy();
      expect(isGitHubUrl('vercel-labs/skills')).toBeFalsy();

      // With flag, shorthands are treated as GitHub URLs
      expect(isGitHubUrl('user/repo', true)).toBeTruthy();
      expect(isGitHubUrl('user/repo/path/to/skill', true)).toBeTruthy();
      expect(isGitHubUrl('vercel-labs/skills', true)).toBeTruthy();
    });

    it('should not detect non-GitHub URLs', () => {
      const cli = new SkillScoreCli();
      const isGitHubUrl = (cli as any).isGitHubUrl;

      expect(isGitHubUrl('./local/path')).toBeFalsy();
      expect(isGitHubUrl('/absolute/path')).toBeFalsy();
      expect(isGitHubUrl('https://example.com/repo')).toBeFalsy();
      expect(isGitHubUrl('single-word')).toBeFalsy();

      // Local-looking paths should not match even with --github flag
      expect(isGitHubUrl('./local/path', true)).toBeFalsy();
      expect(isGitHubUrl('/absolute/path', true)).toBeFalsy();
    });
  });

  describe('GitHub URL Parsing', () => {
    it('should parse full GitHub URLs correctly', () => {
      const cli = new SkillScoreCli();
      const parseGitHubUrl = (cli as any).parseGitHubUrl;
      
      const result1 = parseGitHubUrl('https://github.com/user/repo');
      expect(result1.repoUrl).toBe('https://github.com/user/repo.git');
      expect(result1.subPath).toBeUndefined();

      const result2 = parseGitHubUrl('https://github.com/user/repo/tree/main/skills/my-skill');
      expect(result2.repoUrl).toBe('https://github.com/user/repo.git');
      expect(result2.subPath).toBe('skills/my-skill');
    });

    it('should parse shorthand GitHub URLs correctly', () => {
      const cli = new SkillScoreCli();
      const parseGitHubUrl = (cli as any).parseGitHubUrl;
      
      const result1 = parseGitHubUrl('user/repo');
      expect(result1.repoUrl).toBe('https://github.com/user/repo.git');
      expect(result1.subPath).toBeUndefined();

      const result2 = parseGitHubUrl('user/repo/skills/my-skill');
      expect(result2.repoUrl).toBe('https://github.com/user/repo.git');
      expect(result2.subPath).toBe('skills/my-skill');
    });

    it('should handle edge cases in GitHub URL parsing', () => {
      const cli = new SkillScoreCli();
      const parseGitHubUrl = (cli as any).parseGitHubUrl;
      
      expect(() => parseGitHubUrl('invalid')).toThrow();
      expect(() => parseGitHubUrl('https://github.com/user')).toThrow();
      expect(() => parseGitHubUrl('user')).toThrow();
    });
  });

  describe('Help and Version', () => {
    it('should have updated help text with GitHub examples', async () => {
      const output = await captureHelpOutput();
      expect(output).toContain('GitHub URL');
      expect(output).toContain('vercel-labs/skills');
      expect(output).toContain('https://github.com/user/repo/tree/main/skills/my-skill');
    });
  });

  describe('CLI Error Handling', () => {
    const fixturesPath = path.join(__dirname, '..', 'fixtures');

    it('should throw CliError for non-existent path', async () => {
      const cli = new SkillScoreCli();
      await expect(
        cli.runParsed(['node', 'skillscore', './does-not-exist'])
      ).rejects.toThrow(CliError);
    });

    it('should throw CliError when path is a file, not a directory', async () => {
      const filePath = path.join(fixturesPath, 'perfect-skill', 'SKILL.md');
      const cli = new SkillScoreCli();
      await expect(
        cli.runParsed(['node', 'skillscore', filePath])
      ).rejects.toThrow(CliError);
    });

    it('should succeed for a valid skill directory', async () => {
      const cli = new SkillScoreCli();
      await expect(
        cli.runParsed(['node', 'skillscore', path.join(fixturesPath, 'perfect-skill')])
      ).resolves.toBeUndefined();
    });

    it('should succeed with --json flag', async () => {
      const cli = new SkillScoreCli();
      await expect(
        cli.runParsed(['node', 'skillscore', '--json', path.join(fixturesPath, 'perfect-skill')])
      ).resolves.toBeUndefined();
    });

    it('should succeed with --verbose flag', async () => {
      const cli = new SkillScoreCli();
      await expect(
        cli.runParsed(['node', 'skillscore', '--verbose', path.join(fixturesPath, 'perfect-skill')])
      ).resolves.toBeUndefined();
    });

    it('should succeed in batch mode with multiple paths', async () => {
      const cli = new SkillScoreCli();
      await expect(
        cli.runParsed(['node', 'skillscore', path.join(fixturesPath, 'perfect-skill'), path.join(fixturesPath, 'mediocre-skill')])
      ).resolves.toBeUndefined();
    });
  });
});

// Helper function to capture help output
async function captureHelpOutput(): Promise<string> {
  const originalWrite = process.stdout.write;
  let output = '';
  
  process.stdout.write = function(string: string) {
    output += string;
    return true;
  } as any;
  
  try {
    const cli = new SkillScoreCli();
    await cli.run(['node', 'skillscore', '--help']);
  } catch {
    // Help command typically exits with code 0, which commander treats as an error
  }
  
  process.stdout.write = originalWrite;
  return output;
}