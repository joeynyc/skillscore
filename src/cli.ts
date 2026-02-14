#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { SkillParser } from './parsers/skillParser';
import { SkillScorer } from './scorer';
import { TerminalReporter } from './reporters/terminalReporter';
import { JsonReporter } from './reporters/jsonReporter';
import { MarkdownReporter } from './reporters/markdownReporter';

interface CliOptions {
  json?: boolean;
  markdown?: boolean;
  output?: string;
  verbose?: boolean;
  batch?: boolean;
  version?: boolean;
}

interface GitHubUrlInfo {
  repoUrl: string;
  subPath: string | undefined;
  tempDir: string;
}

export class SkillScoreCli {
  private program: Command;
  private packageInfo: any;

  constructor() {
    this.program = new Command();
    this.packageInfo = this.loadPackageInfo();
    this.setupCommand();
  }

  private loadPackageInfo(): any {
    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      return JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    } catch {
      return { name: 'skillscore', version: '1.0.0' };
    }
  }

  private setupCommand(): void {
    this.program
      .name('skillscore')
      .description('Evaluate AI agent skills and produce quality scores')
      .version(this.packageInfo.version)
      .argument('<path...>', 'Path(s) to skill directory, GitHub URL, or shorthand (user/repo/path)')
      .option('-j, --json', 'Output in JSON format')
      .option('-m, --markdown', 'Output in Markdown format')
      .option('-o, --output <file>', 'Write output to file')
      .option('-v, --verbose', 'Verbose output with detailed findings (shows all findings, not just truncated)')
      .option('-b, --batch', 'Batch mode - accepts multiple paths/URLs for comparison')
      .option('--version', 'Display version number')
      .helpOption('-h, --help', 'Display help for command')
      .addHelpText('after', `
Examples:
  $ skillscore ./my-skill                    # Evaluate local skill
  $ skillscore ./skills/weather-skill        # Evaluate specific skill
  $ skillscore vercel-labs/skills/find-skills          # GitHub shorthand
  $ skillscore https://github.com/user/repo/tree/main/skills/my-skill  # Full GitHub URL
  $ skillscore ./my-skill --json             # JSON output
  $ skillscore ./my-skill --markdown         # Markdown output
  $ skillscore ./my-skill -o report.md       # Save to file
  $ skillscore ./my-skill --json -o score.json  # JSON to file
  $ skillscore ./my-skill --verbose          # Show all findings (not truncated)
  $ skillscore ./skill1 ./skill2 ./skill3    # Compare multiple skills (auto batch)
  $ skillscore ./skill1 ./skill2 --batch     # Explicit batch mode
  $ skillscore --version                     # Show version number

Scoring Categories:
  Structure (15%)     - SKILL.md exists, clear name/description
  Clarity (20%)       - Specific actionable instructions
  Safety (20%)        - No destructive commands, respects permissions  
  Dependencies (10%)  - Lists required tools, install instructions
  Error Handling (10%) - Failure instructions, fallbacks
  Scope (10%)         - Single responsibility, clear triggers
  Documentation (10%) - Usage examples, troubleshooting
  Portability (5%)    - Cross-platform, relative paths

Grade Scale:
  A+ (97-100%) | A (93-96%) | A- (90-92%)
  B+ (87-89%)  | B (83-86%) | B- (80-82%)
  C+ (77-79%)  | C (73-76%) | C- (70-72%)
  D+ (67-69%)  | D (65-66%) | D- (60-64%)
  F  (0-59%)
`);

    this.program.action(async (paths: string[], options: CliOptions) => {
      try {
        // Handle version flag
        if (options.version) {
          console.log(this.packageInfo.version);
          return;
        }

        await this.executeScore(paths, options);
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  async run(args?: string[]): Promise<void> {
    await this.program.parseAsync(args);
  }

  private async executeScore(paths: string[], options: CliOptions): Promise<void> {
    // Handle batch mode (explicit flag or multiple paths)
    if (options.batch || paths.length > 1) {
      await this.executeBatchScore(paths, options);
      return;
    }

    // Handle single skill scoring
    await this.executeSingleScore(paths[0]!, options);
  }

  private async executeSingleScore(skillPath: string, options: CliOptions): Promise<void> {
    const startTime = Date.now();
    
    // Show scanning progress indicator
    if (!options.json && !options.markdown && !options.output) {
      process.stdout.write(chalk.gray('🔍 Scanning...'));
    }
    
    if (options.verbose) {
      console.log(chalk.gray(`\n🔍 Analyzing skill at: ${skillPath}`));
    }

    let resolvedPath: string;
    let gitHubInfo: GitHubUrlInfo | null = null;

    // Check if this is a GitHub URL
    if (this.isGitHubUrl(skillPath)) {
      if (options.verbose) {
        console.log(chalk.gray(`🐙 Detected GitHub URL, cloning...`));
      } else if (!options.json && !options.markdown && !options.output) {
        process.stdout.write(chalk.gray('\r🐙 Cloning...    '));
      }
      
      gitHubInfo = await this.cloneGitHubUrl(skillPath);
      if (gitHubInfo.subPath) {
        resolvedPath = path.join(gitHubInfo.tempDir, gitHubInfo.subPath);
      } else {
        resolvedPath = gitHubInfo.tempDir;
      }
    } else {
      // Resolve local path
      resolvedPath = path.resolve(skillPath);
      
      // Better error handling for missing paths
      if (!await fs.pathExists(resolvedPath)) {
        throw new Error(`Path does not exist: ${skillPath}\nPlease verify the path is correct and accessible.`);
      }
      
      // Check if it's a file instead of directory
      const stat = await fs.stat(resolvedPath);
      if (!stat.isDirectory()) {
        throw new Error(`Path must be a directory containing a skill, not a file: ${skillPath}\nTip: Point to the directory containing SKILL.md`);
      }
    }

    try {
      if (!options.json && !options.markdown && !options.output) {
        process.stdout.write(chalk.gray('\r📋 Parsing...     '));
      }
      
      // Parse skill
      const parser = new SkillParser();
      const parsedSkill = await parser.parseSkill(resolvedPath);
      
      // Better error for missing SKILL.md
      if (!parsedSkill.skillMdExists) {
        throw new Error(`No SKILL.md file found in: ${skillPath}\nA valid skill directory must contain a SKILL.md file.\nTip: Check if you're pointing to the correct skill directory.`);
      }
      
      if (options.verbose) {
        console.log(chalk.gray(`📋 Skill: ${parsedSkill.name}`));
        console.log(chalk.gray(`📁 Files: ${parsedSkill.structure.totalFiles}`));
        console.log(chalk.gray(`📄 SKILL.md: ${parsedSkill.skillMdExists ? 'found' : 'missing'}`));
      } else if (!options.json && !options.markdown && !options.output) {
        process.stdout.write(chalk.gray('\r📊 Scoring...     '));
      }

      // Score skill
      const scorer = new SkillScorer();
      const score = await scorer.scoreSkill(parsedSkill);
      
      const duration = Date.now() - startTime;
      if (options.verbose) {
        console.log(chalk.gray(`⏱️  Analysis completed in ${duration}ms`));
      }

      // Clear progress indicator
      if (!options.json && !options.markdown && !options.output) {
        process.stdout.write('\r' + ' '.repeat(20) + '\r');
      }

      // Generate report
      let output: string;
      let extension = 'txt';

      if (options.json) {
        const reporter = new JsonReporter();
        output = reporter.generateReport(score);
        extension = 'json';
      } else if (options.markdown) {
        const reporter = new MarkdownReporter();
        output = reporter.generateReport(score);
        extension = 'md';
      } else {
        const reporter = new TerminalReporter();
        output = reporter.generateReport(score, options.verbose);
        extension = 'txt';
      }

      // Output handling
      if (options.output) {
        const outputPath = path.resolve(options.output);
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, output, 'utf-8');
        
        if (!options.json && !options.markdown) {
          // For terminal output, also show summary
          console.log(chalk.green(`✅ Report saved to: ${outputPath}`));
          console.log('');
          console.log(chalk.bold(`📊 ${score.skill.name}: ${score.letterGrade} (${score.percentage.toFixed(1)}%)`));
        }
      } else {
        console.log(output);
      }
    } finally {
      // Clean up temporary directory if we cloned from GitHub
      if (gitHubInfo) {
        try {
          await fs.remove(gitHubInfo.tempDir);
          if (options.verbose) {
            console.log(chalk.gray(`🧹 Cleaned up temporary directory`));
          }
        } catch (error) {
          if (options.verbose) {
            console.log(chalk.yellow(`⚠️  Could not clean up temporary directory: ${gitHubInfo.tempDir}`));
          }
        }
      }
    }
  }

  private async executeBatchScore(skillPaths: string[], options: CliOptions): Promise<void> {
    console.log(chalk.bold.blue('📊 BATCH SKILL EVALUATION'));
    console.log(chalk.gray(`Evaluating ${skillPaths.length} skill(s)...`));
    console.log('');

    const results: Array<{ path: string; score?: any; error?: string }> = [];

    for (let i = 0; i < skillPaths.length; i++) {
      const skillPath = skillPaths[i];
      if (!skillPath) {
        console.log(chalk.red(`❌ Error: Invalid skill path at index ${i}`));
        continue;
      }
      
      console.log(chalk.gray(`[${i + 1}/${skillPaths.length}] Processing: ${skillPath}`));

      try {
        // For batch mode, we'll directly score without displaying individual results
        let resolvedPath: string;
        let gitHubInfo: GitHubUrlInfo | null = null;

        if (this.isGitHubUrl(skillPath)) {
          gitHubInfo = await this.cloneGitHubUrl(skillPath);
          if (gitHubInfo.subPath) {
            resolvedPath = path.join(gitHubInfo.tempDir, gitHubInfo.subPath);
          } else {
            resolvedPath = gitHubInfo.tempDir;
          }
        } else {
          resolvedPath = path.resolve(skillPath);
          if (!await fs.pathExists(resolvedPath)) {
            throw new Error(`Path does not exist: ${skillPath}`);
          }
        }

        try {
          const parser = new SkillParser();
          const scorer = new SkillScorer();
          const skill = await parser.parseSkill(resolvedPath);
          const score = await scorer.scoreSkill(skill);
          
          results.push({ path: skillPath, score });
          console.log(chalk.green(`✅ Completed`));
          
        } finally {
          // Clean up GitHub temp dir
          if (gitHubInfo) {
            try {
              await fs.remove(gitHubInfo.tempDir);
            } catch {
              // Ignore cleanup errors
            }
          }
        }
        
      } catch (error) {
        results.push({ 
          path: skillPath, 
          error: error instanceof Error ? error.message : String(error) 
        });
        console.log(chalk.red(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      }
      
      console.log('');
    }

    // Generate comparison table
    this.printComparisonTable(results);
  }

  private printComparisonTable(results: Array<{ path: string; score?: any; error?: string }>): void {
    console.log(chalk.bold('📋 COMPARISON SUMMARY'));
    console.log('');

    // Table header
    const headers = ['Skill', 'Grade', 'Score', 'Structure', 'Clarity', 'Safety', 'Status'];
    const colWidths = [30, 6, 8, 9, 7, 6, 10];
    
    // Print header
    const headerCells = headers.map((header, i) => header.padEnd(colWidths[i] || 0));
    const headerRow = headerCells.join('');
    console.log(chalk.bold(headerRow));
    console.log('-'.repeat(headerRow.length));

    // Print results
    results.forEach(result => {
      if (result.error) {
        const cells = [
          (path.basename(result.path) || 'Unknown').padEnd(colWidths[0] || 0),
          '-'.padEnd(colWidths[1] || 0),
          '-'.padEnd(colWidths[2] || 0),
          '-'.padEnd(colWidths[3] || 0),
          '-'.padEnd(colWidths[4] || 0),
          '-'.padEnd(colWidths[5] || 0),
          'ERROR'.padEnd(colWidths[6] || 0)
        ];
        console.log(chalk.red(cells.join('')));
      } else if (result.score) {
        const score = result.score;
        const structureCat = score.categoryScores?.find((c: any) => c?.category?.id === 'structure');
        const clarityCat = score.categoryScores?.find((c: any) => c?.category?.id === 'clarity');
        const safetyCat = score.categoryScores?.find((c: any) => c?.category?.id === 'safety');
        
        const structure = structureCat?.percentage !== undefined ? structureCat.percentage.toFixed(0) : '-';
        const clarity = clarityCat?.percentage !== undefined ? clarityCat.percentage.toFixed(0) : '-';
        const safety = safetyCat?.percentage !== undefined ? safetyCat.percentage.toFixed(0) : '-';
        
        const skillName = (score.skill?.name || path.basename(result.path) || 'Unknown').substring(0, Math.max(0, (colWidths[0] || 30) - 1));
        const percentage = score.percentage !== undefined ? score.percentage.toFixed(1) : '0.0';
        const letterGrade = score.letterGrade || 'F';
        
        const cells = [
          skillName.padEnd(colWidths[0] || 0),
          letterGrade.padEnd(colWidths[1] || 0),
          (percentage + '%').padEnd(colWidths[2] || 0),
          (structure + '%').padEnd(colWidths[3] || 0),
          (clarity + '%').padEnd(colWidths[4] || 0),
          (safety + '%').padEnd(colWidths[5] || 0),
          'OK'.padEnd(colWidths[6] || 0)
        ];
        const row = cells.join('');
        
        // Color code based on grade
        if (letterGrade.startsWith('A')) {
          console.log(chalk.green(row));
        } else if (letterGrade.startsWith('B')) {
          console.log(chalk.blue(row));
        } else if (letterGrade.startsWith('C')) {
          console.log(chalk.yellow(row));
        } else {
          console.log(chalk.red(row));
        }
      }
    });

    console.log('');
    
    // Summary stats
    const successful = results.filter(r => r.score).length;
    const failed = results.filter(r => r.error).length;
    const scoresWithData = results.filter(r => r.score && typeof r.score.percentage === 'number');
    const avgScore = scoresWithData.length > 0 
      ? scoresWithData.reduce((sum, r) => sum + (r.score?.percentage || 0), 0) / scoresWithData.length
      : 0;

    console.log(chalk.bold('📈 BATCH SUMMARY'));
    console.log(`✅ Successful: ${successful}`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed}`);
    }
    if (successful > 0) {
      console.log(`📊 Average Score: ${avgScore.toFixed(1)}%`);
    }
  }

  private isGitHubUrl(input: string): boolean {
    // Full GitHub URLs
    if (input.startsWith('https://github.com/') || input.startsWith('http://github.com/')) {
      return true;
    }
    
    // Don't treat local/relative paths as GitHub URLs
    if (input.startsWith('./') || input.startsWith('../') || input.startsWith('/') || input.includes('\\')) {
      return false;
    }
    
    // Shorthand format: user/repo or user/repo/path (but not local paths like tests/fixtures)
    const shorthandPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/;
    if (shorthandPattern.test(input)) {
      // Additional validation: typical GitHub usernames don't contain common local path prefixes
      const parts = input.split('/');
      const possibleUsername = parts[0];
      
      if (possibleUsername) {
        // Common local path prefixes that shouldn't be GitHub usernames
        const localPrefixes = ['tests', 'test', 'spec', 'src', 'lib', 'dist', 'build', 'node_modules'];
        if (localPrefixes.includes(possibleUsername.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    }
    
    return false;
  }

  private parseGitHubUrl(input: string): { repoUrl: string; subPath: string | undefined } {
    let repoUrl: string;
    let subPath: string | undefined;

    if (input.startsWith('https://github.com/') || input.startsWith('http://github.com/')) {
      // Full URL format
      const url = new URL(input);
      const pathParts = url.pathname.split('/').filter(p => p);
      
      if (pathParts.length < 2) {
        throw new Error('Invalid GitHub URL: missing user/repo');
      }
      
      const [user, repo] = pathParts;
      repoUrl = `https://github.com/${user}/${repo}.git`;
      
      // Check for tree/branch/subpath
      if (pathParts.length > 2 && pathParts[2] === 'tree') {
        // Format: github.com/user/repo/tree/branch/path/to/skill
        if (pathParts.length > 4) {
          subPath = pathParts.slice(4).join('/');
        }
      }
    } else {
      // Shorthand format: user/repo or user/repo/path
      const parts = input.split('/');
      if (parts.length < 2) {
        throw new Error('Invalid shorthand format: expected user/repo or user/repo/path');
      }
      
      const [user, repo, ...pathParts] = parts;
      repoUrl = `https://github.com/${user}/${repo}.git`;
      
      if (pathParts.length > 0) {
        subPath = pathParts.join('/');
      }
    }

    return { repoUrl, subPath };
  }

  private async cloneGitHubUrl(input: string): Promise<GitHubUrlInfo> {
    const { repoUrl, subPath } = this.parseGitHubUrl(input);
    
    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), `skillscore-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    await fs.ensureDir(tempDir);
    
    try {
      // Check if git is available
      try {
        execSync('git --version', { stdio: 'ignore' });
      } catch {
        throw new Error('Git is not available. Please install git to clone GitHub repositories.');
      }

      // Clone the repository (shallow clone for speed)
      const cloneCmd = `git clone --depth 1 "${repoUrl}" "${tempDir}"`;
      execSync(cloneCmd, { stdio: 'ignore' });
      
      // If we have a subpath, verify it exists
      if (subPath) {
        const fullSubPath = path.join(tempDir, subPath);
        if (!await fs.pathExists(fullSubPath)) {
          throw new Error(`Subpath '${subPath}' does not exist in the repository`);
        }
      }
      
      return { repoUrl, subPath, tempDir };
    } catch (error) {
      // Clean up temp dir on failure
      try {
        await fs.remove(tempDir);
      } catch {}
      throw error;
    }
  }

  private handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    
    // Clear any progress indicators
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
    
    console.error('');
    console.error(chalk.red('❌ Error:'), message.split('\n')[0]);
    
    // Show additional error context if available
    const lines = message.split('\n');
    if (lines.length > 1) {
      console.error('');
      for (let i = 1; i < lines.length; i++) {
        console.error(chalk.gray('   ' + lines[i]));
      }
    }
    
    console.error('');
    
    // Provide context-specific tips
    if (message.includes('does not exist')) {
      console.error(chalk.yellow('💡 Tip:'), 'Verify the path is correct and accessible');
      console.error(chalk.gray('   • Check for typos in the path'));
      console.error(chalk.gray('   • Ensure you have permission to read the directory'));
    } else if (message.includes('No SKILL.md file found')) {
      console.error(chalk.yellow('💡 Tip:'), 'Skills must contain a SKILL.md file');
      console.error(chalk.gray('   • Check if you\'re pointing to the right directory'));
      console.error(chalk.gray('   • The file must be named exactly "SKILL.md"'));
    } else if (message.includes('must be a directory')) {
      console.error(chalk.yellow('💡 Tip:'), 'Point to a skill directory, not a file');
      console.error(chalk.gray('   • Example: skillscore ./my-skill/ (not ./my-skill/SKILL.md)'));
    } else if (message.includes('Git is not available')) {
      console.error(chalk.yellow('💡 Tip:'), 'Install Git to clone GitHub repositories');
      console.error(chalk.gray('   • macOS: xcode-select --install'));
      console.error(chalk.gray('   • Ubuntu: sudo apt-get install git'));
    } else if (message.includes('process.exit unexpectedly')) {
      // Don't show this internal testing error to users
      return;
    }
    
    console.error('');
    console.error(chalk.gray('Run'), chalk.cyan('skillscore --help'), chalk.gray('for usage information'));
    console.error('');
    
    process.exit(1);
  }
}

// For direct execution
if (require.main === module) {
  const cli = new SkillScoreCli();
  cli.run();
}