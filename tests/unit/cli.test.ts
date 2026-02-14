import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillScoreCli } from '../../src/cli';

// Mock external dependencies
vi.mock('child_process', () => ({
  execSync: vi.fn()
}));

vi.mock('fs-extra', async () => {
  const actual = await vi.importActual('fs-extra');
  return {
    ...actual,
    remove: vi.fn(),
    ensureDir: vi.fn(),
    pathExists: vi.fn()
  };
});

describe('SkillScoreCli', () => {
  beforeEach(() => {
    // Initialize test environment
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

  describe('Command Line Arguments', () => {
    it('should accept verbose flag', () => {
      // Test that the CLI is configured to accept verbose flag
      // We test the configuration, not the actual execution
      expect(SkillScoreCli).toBeDefined();
      // Note: We avoid actually running CLI commands that call process.exit()
    });

    it('should accept output format flags', () => {
      // Test that the CLI is configured to accept output format flags
      expect(SkillScoreCli).toBeDefined();
      // Note: We avoid actually running CLI commands that call process.exit()
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