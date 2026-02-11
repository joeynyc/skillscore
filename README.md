<div align="center">
  <img src="assets/banner.png" alt="SkillScore" width="100%" />

  <br />

  [![npm version](https://badge.fury.io/js/skillscore.svg)](https://badge.fury.io/js/skillscore)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js CI](https://github.com/joeynyc/skillscore/workflows/Node.js%20CI/badge.svg)](https://github.com/joeynyc/skillscore/actions)
  [![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

  **The universal quality standard for AI agent skills.**<br />
  Evaluate any SKILL.md — from [skills.sh](https://skills.sh), [ClaHub](https://clawhub.com), GitHub, or your local machine.

</div>

---

## ✨ Features

- 🎯 **Comprehensive Evaluation**: 8 scoring categories with weighted importance
- 🎨 **Multiple Output Formats**: Terminal (colorful), JSON, and Markdown reports
- 🔍 **Deterministic Analysis**: Reliable, reproducible scoring without requiring API keys
- 📋 **Detailed Feedback**: Specific findings and actionable recommendations
- ⚡ **Fast & Reliable**: Built with TypeScript for speed and reliability
- 🌍 **Cross-Platform**: Works on Windows, macOS, and Linux
- 🐙 **GitHub Integration**: Score skills directly from GitHub repositories
- 📊 **Batch Mode**: Compare multiple skills with a summary table
- 🗣️ **Verbose Mode**: See all findings, not just truncated summaries

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g skillscore
```

### Local Installation

```bash
npm install skillscore
npx skillscore ./my-skill/
```

### From Source

```bash
git clone https://github.com/joeynyc/skillscore.git
cd skillscore
npm install
npm run build
npm link
```

## 🚀 Quick Start

Evaluate a skill directory:

```bash
skillscore ./my-skill/
```

## 📖 Usage Examples

### Basic Usage

```bash
# Evaluate a skill
skillscore ./skills/my-skill/

# Evaluate with verbose output (shows all findings)
skillscore ./skills/my-skill/ --verbose
```

### GitHub Integration

```bash
# Full GitHub URL
skillscore https://github.com/vercel-labs/skills/tree/main/skills/find-skills

# GitHub shorthand
skillscore vercel-labs/skills/find-skills

# Anthropic skills
skillscore anthropic/skills/skill-creator
```

### Output Formats

```bash
# JSON output
skillscore ./skills/my-skill/ --json

# Markdown report
skillscore ./skills/my-skill/ --markdown

# Save to file
skillscore ./skills/my-skill/ --output report.md
skillscore ./skills/my-skill/ --json --output score.json
```

### Batch Mode

```bash
# Compare multiple skills
skillscore ./skill1 ./skill2 ./skill3 --batch

# Compare GitHub skills
skillscore user/repo1/skill1 user/repo2/skill2 --batch --json
```

### Utility Commands

```bash
# Show version
skillscore --version

# Get help
skillscore --help
```

## 📊 Example Output

### Terminal Output
```
📊 SKILLSCORE EVALUATION REPORT
============================================================

📋 Skill: Weather Information Fetcher
   Fetches current weather data for any city using OpenWeatherMap API
   Path: ./weather-skill

🎯 OVERALL SCORE
   A- - 92.0% (9.2/10.0 points)

📝 CATEGORY BREAKDOWN
------------------------------------------------------------
Structure ████████████████████ 100.0%
   SKILL.md exists, clear name/description, follows conventions
   Score: 10/10 (weight: 15%)
   ✓ SKILL.md file exists (+3)
   ✓ Clear skill name: "Weather Information Fetcher" (+2)
   ✓ Clear description provided (+2)
   ... 2 more findings

Clarity ██████████████████░░ 90.0%
   Specific actionable instructions, no ambiguity, logical order
   Score: 9/10 (weight: 20%)
   ✓ Contains specific step-by-step instructions with commands (+3)
   ✓ No ambiguous language detected (+3)
   ✓ Instructions follow logical order (+2)
   ... 1 more finding (use --verbose to see all)

Safety ██████████████░░░░░░ 70.0%
   No destructive commands, respects permissions
   Score: 7/10 (weight: 20%)
   ✓ No dangerous destructive commands found (+3)
   ✓ No obvious secret exfiltration risks (+3)
   ✗ Some potential security concerns detected

📈 SUMMARY
------------------------------------------------------------
✅ Strengths: Structure, Clarity, Dependencies, Documentation
❌ Areas for improvement: Safety

Generated: 2/11/2026, 3:15:49 PM
```

### Batch Mode Output
```
📊 BATCH SKILL EVALUATION
Evaluating 3 skill(s)...

[1/3] Processing: ./weather-skill
✅ Completed

[2/3] Processing: ./file-backup
✅ Completed

[3/3] Processing: user/repo/skill
✅ Completed

📋 COMPARISON SUMMARY

Skill                          Grade  Score    Structure Clarity Safety Status    
Weather Information Fetcher    A-     92.0%    100%      90%     70%    OK        
File Backup Tool              B+     87.0%    95%       85%     90%    OK        
Advanced Data Processor       A      94.0%    100%      95%     85%    OK        

📈 BATCH SUMMARY
✅ Successful: 3
📊 Average Score: 91.0%
```

## 🏆 Scoring System

SkillScore evaluates skills across **8 weighted categories**:

| Category | Weight | Description |
|----------|--------|-------------|
| **Structure** | 15% | SKILL.md exists, clear name/description, follows conventions |
| **Clarity** | 20% | Specific actionable instructions, no ambiguity, logical order |
| **Safety** | 20% | No destructive commands without confirmation, respects permissions |
| **Dependencies** | 10% | Lists required tools/APIs, install instructions, env vars |
| **Error Handling** | 10% | Failure instructions, fallbacks, no silent failures |
| **Scope** | 10% | Single responsibility, accurate description, specific triggers |
| **Documentation** | 10% | Usage examples, expected I/O, troubleshooting |
| **Portability** | 5% | Cross-platform, no hardcoded paths, relative paths |

### Scoring Methodology

Each category is scored from 0-10 points based on specific criteria:

- **Structure**: Checks for SKILL.md existence, clear naming, proper organization
- **Clarity**: Analyzes instruction specificity, ambiguity, logical flow
- **Safety**: Scans for destructive commands, security risks, permission issues
- **Dependencies**: Validates tool listings, installation instructions, environment setup
- **Error Handling**: Reviews error scenarios, fallback strategies, validation
- **Scope**: Assesses single responsibility, trigger clarity, conflict potential
- **Documentation**: Evaluates examples, I/O documentation, troubleshooting guides
- **Portability**: Checks cross-platform compatibility, path handling, limitations

### Grade Scale

| Grade | Score Range | Description |
|-------|-------------|-------------|
| **A+** | 97-100% | Exceptional quality |
| **A** | 93-96% | Excellent |
| **A-** | 90-92% | Very good |
| **B+** | 87-89% | Good |
| **B** | 83-86% | Above average |
| **B-** | 80-82% | Satisfactory |
| **C+** | 77-79% | Acceptable |
| **C** | 73-76% | Fair |
| **C-** | 70-72% | Needs improvement |
| **D+** | 67-69% | Poor |
| **D** | 65-66% | Very poor |
| **D-** | 60-64% | Failing |
| **F** | 0-59% | Unacceptable |

## 📁 What Makes a Good Skill?

### Required Structure

```
my-skill/
├── SKILL.md           # Main skill definition (REQUIRED)
├── README.md          # Documentation (recommended)
├── package.json       # Dependencies (if applicable)
├── scripts/           # Executable scripts
│   ├── setup.sh
│   └── main.py
└── examples/          # Usage examples
    └── example.md
```

### SKILL.md Template

```markdown
# My Awesome Skill

Brief description of what this skill does and when to use it.

## Dependencies

- Tool 1: Installation instructions
- API Key: How to obtain and configure
- Environment: OS requirements

## Usage

1. Step-by-step instructions
2. Specific commands to run
3. Expected outputs

## Error Handling

- Common issues and solutions
- Fallback strategies
- Validation steps

## Examples

```bash
# Working example
./scripts/main.py --input "test data"
```

## Limitations

- Known constraints
- Platform-specific notes
- Edge cases
```

## 🔧 API Usage

Use SkillScore programmatically in your Node.js projects:

```typescript
import { SkillParser, SkillScorer, TerminalReporter } from 'skillscore';

const parser = new SkillParser();
const scorer = new SkillScorer();
const reporter = new TerminalReporter();

async function evaluateSkill(skillPath: string) {
  const skill = await parser.parseSkill(skillPath);
  const score = await scorer.scoreSkill(skill);
  const report = reporter.generateReport(score);
  
  console.log(report);
  return score;
}
```

## 🛠️ CLI Options

```
Usage: skillscore [options] <path>

Arguments:
  path                   Path to skill directory, GitHub URL, or shorthand

Options:
  -V, --version         Output the version number
  -j, --json            Output in JSON format
  -m, --markdown        Output in Markdown format
  -o, --output <file>   Write output to file
  -v, --verbose         Show ALL findings (not just truncated)
  -b, --batch           Batch mode for comparing multiple skills
  --version             Display version number
  -h, --help           Display help for command
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Run tests once
npm run test:run

# Lint code
npm run lint

# Build project
npm run build
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

```bash
git clone https://github.com/joeynyc/skillscore.git
cd skillscore
npm install
npm run build
npm link

# Run in development mode
npm run dev ./test-skill/

# Build for production
npm run build
```

### Running Tests

```bash
npm test
```

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Lint your code (`npm run lint`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Coding Standards

- Use TypeScript for all new code
- Follow existing code style (enforced by ESLint)
- Add tests for new features
- Update documentation for API changes
- Keep commits focused and descriptive

## 🐛 Troubleshooting

### Common Issues

**Error: "Path does not exist"**
- Check for typos in the path
- Ensure you have permission to read the directory
- Verify the path points to a directory, not a file

**Error: "No SKILL.md file found"**
- Skills must contain a SKILL.md file
- Check if you're pointing to the right directory
- The file must be named exactly "SKILL.md"

**Error: "Git is not available"**
- Install Git to clone GitHub repositories
- macOS: `xcode-select --install`
- Ubuntu: `sudo apt-get install git`
- Windows: Download from git-scm.com

**Scores seem too high/low**
- Scoring is calibrated against real-world skills
- See the scoring methodology above
- Consider the specific criteria for each category

### Getting Help

- 🐛 [Report Issues](https://github.com/joeynyc/skillscore/issues)
- 💬 [Discussions](https://github.com/joeynyc/skillscore/discussions)
- 📚 [Documentation](https://github.com/joeynyc/skillscore/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for quality assessment in AI agent skills
- Built for the OpenClaw and Claude Code communities
- Thanks to all contributors and skill creators
- Scoring methodology informed by software engineering best practices

## 📊 Example Scores

Here are some real-world examples of how different skills score:

- **Vercel find-skills**: 85% (B) - Well-structured, good documentation
- **Anthropic frontend-design**: 87% (B+) - Excellent clarity, minor dependency issues  
- **Anthropic skill-creator**: 92% (A-) - Outstanding overall, minor safety concerns

---

<div align="center">
  <strong>Made with ❤️ for the AI agent community</strong><br>
  <small>Help us improve AI agent skills, one evaluation at a time</small>
</div>