import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import { glob } from 'glob';

export interface ParsedSkill {
  skillPath: string;
  skillMdExists: boolean;
  skillMdContent: string;
  name: string;
  description: string;
  files: string[];
  metadata: Record<string, unknown>;
  structure: FileStructure;
  frontmatter: Record<string, unknown>;
  bodyContent: string;
  bodyLineCount: number;
  nameSource: 'frontmatter' | 'heading' | 'fallback';
  descriptionSource: 'frontmatter' | 'inline' | 'inferred' | 'none';
  referencedFiles: string[];
}

export interface FileStructure {
  hasSkillMd: boolean;
  hasReadme: boolean;
  hasPackageJson: boolean;
  hasScripts: boolean;
  totalFiles: number;
  directories: string[];
  fileTypes: { [ext: string]: number };
}

export class SkillParser {
  async parseSkill(skillPath: string): Promise<ParsedSkill> {
    const absolutePath = path.resolve(skillPath);

    if (!await fs.pathExists(absolutePath)) {
      throw new Error(`Skill path does not exist: ${absolutePath}`);
    }

    const stat = await fs.stat(absolutePath);
    if (!stat.isDirectory()) {
      throw new Error(`Skill path must be a directory: ${absolutePath}`);
    }

    const skillMdPath = path.join(absolutePath, 'SKILL.md');
    const skillMdExists = await fs.pathExists(skillMdPath);

    let skillMdContent = '';
    if (skillMdExists) {
      skillMdContent = await fs.readFile(skillMdPath, 'utf-8');
    }

    const files = await this.getAllFiles(absolutePath);
    const structure = this.analyzeStructure(files);
    const frontmatter = this.parseFrontmatter(skillMdContent);
    const bodyContent = this.stripFrontmatter(skillMdContent);
    const bodyLineCount = bodyContent ? bodyContent.split('\n').length : 0;
    const referencedFiles = this.extractReferencedFiles(skillMdContent);

    const { name, nameSource } = this.extractNameWithSource(skillMdContent, absolutePath, frontmatter);
    const { description, descriptionSource } = this.extractDescriptionWithSource(skillMdContent, frontmatter);

    return {
      skillPath: absolutePath,
      skillMdExists,
      skillMdContent,
      name,
      description,
      files,
      metadata: frontmatter,
      structure,
      frontmatter,
      bodyContent,
      bodyLineCount,
      nameSource,
      descriptionSource,
      referencedFiles
    };
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    try {
      const files = await glob('**/*', {
        cwd: dir,
        dot: true,
        nodir: true
      });
      return files;
    } catch (error) {
      console.warn(`Warning: Could not list files in ${dir}:`, error);
      return [];
    }
  }

  private analyzeStructure(files: string[]): FileStructure {
    const fileTypes: { [ext: string]: number } = {};
    const directories = new Set<string>();

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;

      const dir = path.dirname(file);
      if (dir !== '.') {
        const firstDir = dir.split('/')[0];
        if (firstDir) {
          directories.add(firstDir);
        }
      }
    }

    return {
      hasSkillMd: files.includes('SKILL.md'),
      hasReadme: files.some(f => f.toLowerCase().startsWith('readme')),
      hasPackageJson: files.includes('package.json'),
      hasScripts: files.some(f => f.endsWith('.py') || f.endsWith('.js') || f.endsWith('.sh')),
      totalFiles: files.length,
      directories: Array.from(directories),
      fileTypes
    };
  }

  private parseFrontmatter(content: string): Record<string, unknown> {
    if (!content) return {};
    const match = content.match(/^---\n(.*?)\n---/s);
    if (match && match[1]) {
      try {
        return (yaml.parse(match[1]) as Record<string, unknown>) || {};
      } catch {
        return {};
      }
    }
    return {};
  }

  private stripFrontmatter(content: string): string {
    if (!content) return '';
    return content.replace(/^---\n.*?\n---\n?/s, '');
  }

  private extractReferencedFiles(content: string): string[] {
    if (!content) return [];
    // Match markdown links to files: [text](path) where path looks like a file
    const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
    const refs: string[] = [];
    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      const ref = match[1];
      if (ref && !ref.startsWith('http') && !ref.startsWith('#')) {
        refs.push(ref);
      }
    }
    return refs;
  }

  private extractNameWithSource(content: string, skillPath: string, frontmatter: Record<string, unknown>): { name: string; nameSource: 'frontmatter' | 'heading' | 'fallback' } {
    if (frontmatter.name && typeof frontmatter.name === 'string') {
      return { name: frontmatter.name, nameSource: 'frontmatter' };
    }

    if (content) {
      const headingMatch = content.match(/^# (.+)$/m);
      if (headingMatch && headingMatch[1]) {
        return { name: headingMatch[1].trim(), nameSource: 'heading' };
      }
    }

    return { name: path.basename(skillPath), nameSource: 'fallback' };
  }

  private extractDescriptionWithSource(content: string, frontmatter: Record<string, unknown>): { description: string; descriptionSource: 'frontmatter' | 'inline' | 'inferred' | 'none' } {
    if (frontmatter.description && typeof frontmatter.description === 'string') {
      return { description: frontmatter.description, descriptionSource: 'frontmatter' };
    }

    if (!content) return { description: '', descriptionSource: 'none' };

    const descMatch = content.match(/^description:\s*(.+)$/m);
    if (descMatch && descMatch[1]) {
      return { description: descMatch[1].trim(), descriptionSource: 'inline' };
    }

    const afterHeading = content.replace(/^#[^\n]*\n\s*\n/, '');
    const paragraphMatch = afterHeading.match(/^(.+?)(?:\n\s*\n|\n#|$)/s);
    if (paragraphMatch && paragraphMatch[1]) {
      return { description: paragraphMatch[1].trim().replace(/\n/g, ' '), descriptionSource: 'inferred' };
    }

    return { description: '', descriptionSource: 'none' };
  }
}
