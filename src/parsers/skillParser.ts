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
    const structure = await this.analyzeStructure(absolutePath, files);
    
    const parsed: ParsedSkill = {
      skillPath: absolutePath,
      skillMdExists,
      skillMdContent,
      name: await this.extractName(skillMdContent, absolutePath),
      description: await this.extractDescription(skillMdContent),
      files,
      metadata: await this.extractMetadata(skillMdContent),
      structure
    };

    return parsed;
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

  private async analyzeStructure(skillPath: string, files: string[]): Promise<FileStructure> {
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

  private async extractName(content: string, skillPath: string): Promise<string> {
    if (!content) {
      return path.basename(skillPath);
    }

    // Look for markdown heading
    const headingMatch = content.match(/^# (.+)$/m);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim();
    }

    // Look for YAML frontmatter name
    const frontmatterMatch = content.match(/^---\n(.*?)\n---/s);
    if (frontmatterMatch && frontmatterMatch[1]) {
      try {
        const metadata = yaml.parse(frontmatterMatch[1]);
        if (metadata && metadata.name) {
          return metadata.name;
        }
      } catch {
        // Ignore YAML parsing errors
      }
    }

    // Look for name: field
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }

    // Fall back to directory name
    return path.basename(skillPath);
  }

  private async extractDescription(content: string): Promise<string> {
    if (!content) {
      return '';
    }

    // Look for YAML frontmatter description
    const frontmatterMatch = content.match(/^---\n(.*?)\n---/s);
    if (frontmatterMatch && frontmatterMatch[1]) {
      try {
        const metadata = yaml.parse(frontmatterMatch[1]);
        if (metadata && metadata.description) {
          return metadata.description;
        }
      } catch {
        // Ignore YAML parsing errors
      }
    }

    // Look for description: field
    const descMatch = content.match(/^description:\s*(.+)$/m);
    if (descMatch && descMatch[1]) {
      return descMatch[1].trim();
    }

    // Look for first paragraph after heading
    const afterHeading = content.replace(/^#[^\n]*\n\s*\n/, '');
    const paragraphMatch = afterHeading.match(/^(.+?)(?:\n\s*\n|\n#|$)/s);
    if (paragraphMatch && paragraphMatch[1]) {
      return paragraphMatch[1].trim().replace(/\n/g, ' ');
    }

    return '';
  }

  private async extractMetadata(content: string): Promise<any> {
    if (!content) {
      return {};
    }

    const frontmatterMatch = content.match(/^---\n(.*?)\n---/s);
    if (frontmatterMatch && frontmatterMatch[1]) {
      try {
        return yaml.parse(frontmatterMatch[1]) || {};
      } catch {
        return {};
      }
    }

    return {};
  }
}