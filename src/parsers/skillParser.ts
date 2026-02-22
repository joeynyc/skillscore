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
  metadata: any;
  structure: FileStructure;
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

    return {
      skillPath: absolutePath,
      skillMdExists,
      skillMdContent,
      name: this.extractName(skillMdContent, absolutePath, frontmatter),
      description: this.extractDescription(skillMdContent, frontmatter),
      files,
      metadata: frontmatter,
      structure
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

  private parseFrontmatter(content: string): any {
    if (!content) return {};
    const match = content.match(/^---\n(.*?)\n---/s);
    if (match && match[1]) {
      try {
        return yaml.parse(match[1]) || {};
      } catch {
        return {};
      }
    }
    return {};
  }

  private extractName(content: string, skillPath: string, frontmatter: any): string {
    if (!content) return path.basename(skillPath);

    const headingMatch = content.match(/^# (.+)$/m);
    if (headingMatch && headingMatch[1]) return headingMatch[1].trim();

    if (frontmatter.name) return frontmatter.name;

    const nameMatch = content.match(/^name:\s*(.+)$/m);
    if (nameMatch && nameMatch[1]) return nameMatch[1].trim();

    return path.basename(skillPath);
  }

  private extractDescription(content: string, frontmatter: any): string {
    if (!content) return '';

    if (frontmatter.description) return frontmatter.description;

    const descMatch = content.match(/^description:\s*(.+)$/m);
    if (descMatch && descMatch[1]) return descMatch[1].trim();

    const afterHeading = content.replace(/^#[^\n]*\n\s*\n/, '');
    const paragraphMatch = afterHeading.match(/^(.+?)(?:\n\s*\n|\n#|$)/s);
    if (paragraphMatch && paragraphMatch[1]) {
      return paragraphMatch[1].trim().replace(/\n/g, ' ');
    }

    return '';
  }
}