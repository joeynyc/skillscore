<div align="center">
  <img src="assets/banner.png" alt="SkillScore" width="100%" />

  <br />

  [![npm version](https://badge.fury.io/js/skillscore.svg)](https://badge.fury.io/js/skillscore)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js CI](https://github.com/joeynyc/skillscore/workflows/Node.js%20CI/badge.svg)](https://github.com/joeynyc/skillscore/actions)
  [![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

  **The universal quality standard for AI agent skills.**<br />
  Evaluate any SKILL.md — from [skills.sh](https://skills.sh), [ClawHub](https://clawhub.com), GitHub, or your local machine.

</div>

---

## ✨ Features

- 🎯 **Comprehensive Evaluation**: 7 Anthropic-aligned scoring categories with weighted importance
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
# Full GitHub URL (always recognized)
skillscore https://github.com/vercel-labs/skills/tree/main/skills/find-skills

# GitHub shorthand (requires -g/--github flag)
skillscore -g vercel-labs/skills/find-skills

# Anthropic skills
skillscore -g anthropic/skills/skill-creator
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
# Compare multiple skills (auto-enters batch mode)
skillscore ./skill1 ./skill2 ./skill3

# Explicit batch mode flag
skillscore ./skill1 ./skill2 --batch

# Compare GitHub skills
skillscore -g user/repo1/skill1 user/repo2/skill2 --json
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

📋 Skill: weather-fetcher
   Fetches current weather data for any city when the user asks for forecasts or conditions.
   Path: ./weather-skill

🎯 OVERALL SCORE
   A- - 92.0% (9.2/10.0 points)

📝 CATEGORY BREAKDOWN
------------------------------------------------------------
Identity & Metadata ████████████████████ 100.0%
   YAML frontmatter with valid name/description, proper format, not vague
   Score: 10/10 (weight: 20%)
   ✓ Frontmatter name: "weather-fetcher" (+2)
   ✓ Name format valid (lowercase-hyphen, ≤64 chars) (+2)
   ✓ Frontmatter description present (+2)
   ... 3 more findings

Clarity & Instructions ██████████████████░░ 90.0%
   Workflow steps, consistent terminology, templates/examples, degrees of freedom
   Score: 9/10 (weight: 15%)
   ✓ Has structured workflow steps (numbered lists or checklists) (+3)
   ✓ Consistent terminology throughout (+2)
   ✓ 4 code blocks with templates/examples (+2)
   ... 2 more findings (use --verbose to see all)

Safety & Security ██████████████░░░░░░ 70.0%
   No destructive commands without confirmation, no secret exfil, no privilege escalation
   Score: 7/10 (weight: 15%)
   ✓ No dangerous destructive commands found (+3)
   ✓ No secret exfiltration risk detected (+2)
   ⚠ Privilege escalation with justification: sudo (+1)

📈 SUMMARY
------------------------------------------------------------
✅ Strengths: Identity & Metadata, Conciseness, Clarity & Instructions, Routing & Scope
❌ Areas for improvement: Safety & Security

Generated: 3/13/2026, 1:37:51 AM
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

Skill                          Grade  Score    Identity Routing Safety Status
weather-fetcher                A-     92.0%    100%     100%    70%    OK
file-backup                    B+     87.0%    90%      80%     90%    OK
data-processor                 A      94.0%    100%     100%    85%    OK

📈 BATCH SUMMARY
✅ Successful: 3
📊 Average Score: 91.0%
```

## 🏆 Scoring System

SkillScore evaluates skills across **7 weighted categories** aligned with [Anthropic's official skill documentation](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills):

| Category | Weight | Description |
|----------|--------|-------------|
| **Identity & Metadata** | 20% | YAML frontmatter name/description, lowercase-hyphen format, not vague |
| **Conciseness** | 15% | Body ≤500 lines, progressive disclosure, no over-explaining basics |
| **Clarity & Instructions** | 15% | Workflow steps, consistent terminology, templates/examples, degrees of freedom |
| **Routing & Scope** | 15% | WHAT+WHEN description, negative routing, domain vocabulary, third-person voice |
| **Robustness** | 10% | Error handling in code blocks, validation steps, dependency verification |
| **Safety & Security** | 15% | No destructive commands, proximity-based secret exfil detection, no privilege escalation |
| **Portability & Standards** | 10% | No platform-specific paths, MCP tool format, no time-sensitive info, relative paths |

### Scoring Methodology

Each category is scored from 0-10 points based on specific criteria:

- **Identity & Metadata**: Validates YAML frontmatter `name` (lowercase-hyphen, ≤64 chars, no reserved words) and `description` (≤1024 chars, third person, no XML tags), rejects vague names/descriptions
- **Conciseness**: Enforces the 500-line body limit, checks for progressive disclosure via file references, flags over-explaining basics Claude already knows
- **Clarity & Instructions**: Checks for numbered steps or checklists, consistent terminology (no synonym pairs used interchangeably), code block examples, and a mix of imperative ("must") and flexible ("consider") guidance
- **Routing & Scope**: Validates description has action verbs + trigger conditions, negative routing examples ("don't use when..."), domain-specific vocabulary, and third-person voice
- **Robustness**: Scans code blocks for error handling (try/catch, `||`, `set -e`), validates dependency verification commands (`--version`, `command -v`), flags magic constants
- **Safety & Security**: Proximity-based secret exfil detection (secrets + network within 5 lines), destructive command scanning with confirmation check, privilege escalation detection, unbounded loop detection
- **Portability & Standards**: Flags Windows-style paths, hardcoded absolute paths, validates MCP tool `ServerName:tool_name` format, detects time-sensitive info (dates, pinned versions)

### v2.0.0: Anthropic-Aligned Rubric

Complete scoring redesign replacing the original 8 generic categories with 7 categories aligned to Anthropic's official skill documentation:

| Change | Details |
|--------|---------|
| **Frontmatter validation** | Skills must have YAML frontmatter with `name` and `description` fields |
| **Name format checks** | Names must be lowercase-hyphen (`^[a-z0-9][a-z0-9-]*$`), ≤64 chars, no reserved words |
| **Conciseness scoring** | New category enforcing 500-line limit, progressive disclosure, no over-explaining |
| **Third-person detection** | Descriptions should use third-person voice, not "I/We/My" |
| **Proximity-based exfil** | Secret + network pattern detection within 5-line proximity windows |
| **MCP format validation** | MCP tool references must use `ServerName:tool_name` format |
| **Time-sensitive detection** | Flags specific dates, "as of", and pinned version references |

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
---
name: my-awesome-skill
description: Performs [specific task] when the user needs to [trigger condition].
---

# My Awesome Skill

Performs [specific task] using [specific tools/inputs].

## When to Use

Use this skill when you need to [specific task] with [specific tools/inputs].

## When NOT to Use

Don't use this skill when:
- The task is [alternative scenario] — use [other skill] instead
- You need [different capability]

## Dependencies

- Tool 1: Installation instructions (`tool --version` to verify)
- API Key: How to obtain and configure
- Environment: OS requirements

## Workflow

1. Step-by-step instructions
2. Specific commands to run
3. Expected outputs

- [ ] Verify dependencies
- [ ] Confirm configuration

## Output

Results are written to `./output/` as JSON files.

## Error Handling

You must always validate output. Consider retrying on transient failures.

```bash
if ! result=$(./scripts/main.py --input "data"); then
  echo "Error: processing failed"
  exit 1
fi
```

## Examples

### Example Output

```json
{
  "status": "success",
  "result": "Example of what the skill produces"
}
```

## Limitations

- Known constraints
- Platform-specific notes
- Edge cases

See [docs/advanced.md](docs/advanced.md) for more details.
```

## 🔧 API Usage

Use SkillScore programmatically in your Node.js projects:

```typescript
import { SkillParser, SkillScorer, TerminalReporter } from 'skillscore';
import type { Reporter, SkillScore } from 'skillscore';

const parser = new SkillParser();
const scorer = new SkillScorer();
const reporter: Reporter = new TerminalReporter();

async function evaluateSkill(skillPath: string): Promise<SkillScore> {
  const skill = await parser.parseSkill(skillPath);
  const score = await scorer.scoreSkill(skill);
  const report = reporter.generateReport(score);

  console.log(report);
  return score;
}
```

All three reporters (`TerminalReporter`, `JsonReporter`, `MarkdownReporter`) implement the `Reporter` interface.

## 🛠️ CLI Options

```
Usage: skillscore [options] <path...>

Arguments:
  path                   Path(s) to skill directory, GitHub URL, or shorthand

Options:
  -V, --version         Output the version number
  -j, --json            Output in JSON format
  -m, --markdown        Output in Markdown format
  -o, --output <file>   Write output to file
  -v, --verbose         Show ALL findings (not just truncated)
  -b, --batch           Batch mode for comparing multiple skills
  -g, --github          Treat shorthand paths as GitHub repos (user/repo/path)
  -h, --help           Display help for command
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test

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
- Scoring methodology aligned with [Anthropic's official skill documentation](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)

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
