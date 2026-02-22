import * as fs from 'fs-extra';
import * as path from 'path';
import { SkillScore, Reporter } from '../scorer';

function readVersion(): string {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8')).version;
  } catch {
    return '0.0.0';
  }
}

const VERSION = readVersion();

export interface JsonReport {
  skillName: string;
  skillPath: string;
  description: string;
  overallScore: {
    percentage: number;
    letterGrade: string;
    totalScore: number;
    maxScore: number;
  };
  categories: {
    id: string;
    name: string;
    description: string;
    weight: number;
    score: number;
    maxScore: number;
    percentage: number;
    weightedScore: number;
    findings: {
      type: 'pass' | 'fail' | 'warning' | 'info';
      message: string;
      points: number;
    }[];
  }[];
  metadata: {
    timestamp: string;
    version: string;
    fileCount: number;
    hasSkillMd: boolean;
  };
}

export class JsonReporter implements Reporter {
  generateReport(score: SkillScore): string {
    const report: JsonReport = {
      skillName: score.skill.name,
      skillPath: score.skill.skillPath,
      description: score.skill.description,
      overallScore: {
        percentage: Math.round(score.percentage * 100) / 100,
        letterGrade: score.letterGrade,
        totalScore: Math.round(score.totalScore * 100) / 100,
        maxScore: Math.round(score.maxTotalScore * 100) / 100
      },
      categories: score.categoryScores.map(cat => ({
        id: cat.category.id,
        name: cat.category.name,
        description: cat.category.description,
        weight: cat.category.weight,
        score: Math.round(cat.score * 100) / 100,
        maxScore: cat.maxScore,
        percentage: Math.round(cat.percentage * 100) / 100,
        weightedScore: Math.round(cat.weightedScore * 100) / 100,
        findings: cat.findings.map(finding => ({
          type: finding.type,
          message: finding.message,
          points: finding.points
        }))
      })),
      metadata: {
        timestamp: score.timestamp.toISOString(),
        version: VERSION,
        fileCount: score.skill.structure.totalFiles,
        hasSkillMd: score.skill.structure.hasSkillMd
      }
    };
    
    return JSON.stringify(report, null, 2);
  }
}