import chalk from 'chalk';
import { SkillScore, CategoryScore, Finding, Reporter } from '../scorer';

export class TerminalReporter implements Reporter {
  generateReport(score: SkillScore, verbose: boolean = false): string {
    const lines: string[] = [];
    
    // Header
    lines.push('');
    lines.push(chalk.bold.blue('📊 SKILLSCORE EVALUATION REPORT'));
    lines.push(chalk.gray('='.repeat(60)));
    lines.push('');
    
    // Skill Info
    lines.push(chalk.bold(`📋 Skill: ${score.skill.name}`));
    if (score.skill.description) {
      lines.push(chalk.gray(`   ${score.skill.description}`));
    }
    lines.push(chalk.gray(`   Path: ${score.skill.skillPath}`));
    lines.push('');
    
    // Overall Score
    const gradeColor = this.getGradeColor(score.letterGrade);
    lines.push(chalk.bold('🎯 OVERALL SCORE'));
    lines.push(`   ${gradeColor(score.letterGrade)} - ${chalk.bold(score.percentage.toFixed(1))}% (${score.totalScore.toFixed(1)}/${score.maxTotalScore.toFixed(1)} points)`);
    lines.push('');
    
    // Category Breakdown
    lines.push(chalk.bold('📝 CATEGORY BREAKDOWN'));
    lines.push(chalk.gray('-'.repeat(60)));
    
    for (const cat of score.categoryScores) {
      lines.push(this.formatCategory(cat, verbose));
      lines.push('');
    }
    
    // Summary
    lines.push(chalk.bold('📈 SUMMARY'));
    lines.push(chalk.gray('-'.repeat(60)));
    
    const strengths = score.categoryScores
      .filter(cat => cat.percentage >= 80)
      .map(cat => cat.category.name);
    
    const weaknesses = score.categoryScores
      .filter(cat => cat.percentage < 60)
      .map(cat => cat.category.name);
    
    if (strengths.length > 0) {
      lines.push(chalk.green(`✅ Strengths: ${strengths.join(', ')}`));
    }
    
    if (weaknesses.length > 0) {
      lines.push(chalk.red(`❌ Areas for improvement: ${weaknesses.join(', ')}`));
    }
    
    lines.push('');
    lines.push(chalk.gray(`Generated: ${score.timestamp.toLocaleString()}`));
    lines.push('');
    
    return lines.join('\n');
  }
  
  private formatCategory(cat: CategoryScore, verbose: boolean = false): string {
    const lines: string[] = [];
    const percentage = cat.percentage;
    const color = this.getScoreColor(percentage);
    
    // Category header
    const bar = this.createProgressBar(percentage);
    lines.push(`${color(cat.category.name)} ${bar} ${color(percentage.toFixed(1))}%`);
    lines.push(chalk.gray(`   ${cat.category.description}`));
    lines.push(chalk.gray(`   Score: ${cat.score}/${cat.maxScore} (weight: ${(cat.category.weight * 100).toFixed(0)}%)`));
    
    // Findings
    if (cat.findings.length > 0) {
      let findingsToShow: typeof cat.findings;
      
      if (verbose) {
        // Show all findings in verbose mode
        findingsToShow = cat.findings;
      } else {
        // Show only important findings, truncated
        findingsToShow = cat.findings
          .filter(f => f.type === 'fail' || (f.type === 'pass' && f.points > 0))
          .slice(0, 3);
      }
      
      for (const finding of findingsToShow) {
        lines.push(`   ${this.formatFinding(finding)}`);
      }
      
      if (!verbose && cat.findings.length > findingsToShow.length) {
        const remaining = cat.findings.length - findingsToShow.length;
        lines.push(chalk.gray(`   ... ${remaining} more finding${remaining > 1 ? 's' : ''} (use --verbose to see all)`));
      }
    }
    
    return lines.join('\n');
  }
  
  private formatFinding(finding: Finding): string {
    const icon = this.getFindingIcon(finding.type);
    const color = this.getFindingColor(finding.type);
    const points = finding.points > 0 ? ` (+${finding.points})` : '';
    return `${icon} ${color(finding.message)}${points}`;
  }
  
  private getFindingIcon(type: Finding['type']): string {
    switch (type) {
      case 'pass': return chalk.green('✓');
      case 'fail': return chalk.red('✗');
      case 'warning': return chalk.yellow('⚠');
      case 'info': return chalk.blue('ℹ');
      default: return '•';
    }
  }
  
  private getFindingColor(type: Finding['type']): typeof chalk.green {
    switch (type) {
      case 'pass': return chalk.green;
      case 'fail': return chalk.red;
      case 'warning': return chalk.yellow;
      case 'info': return chalk.blue;
      default: return chalk.gray;
    }
  }
  
  private getScoreColor(percentage: number): typeof chalk.green {
    if (percentage >= 80) return chalk.green;
    if (percentage >= 60) return chalk.yellow;
    return chalk.red;
  }
  
  private getGradeColor(grade: string): typeof chalk.green {
    if (grade.startsWith('A')) return chalk.green.bold;
    if (grade.startsWith('B')) return chalk.blue.bold;
    if (grade.startsWith('C')) return chalk.yellow.bold;
    if (grade.startsWith('D')) return chalk.magenta.bold;
    return chalk.red.bold;
  }
  
  private createProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    if (percentage >= 80) return chalk.green(bar);
    if (percentage >= 60) return chalk.yellow(bar);
    return chalk.red(bar);
  }
}