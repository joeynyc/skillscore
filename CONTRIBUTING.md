# Contributing to SkillScore 🤝

We love your input! We want to make contributing to SkillScore as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process 🛠️

We use GitHub to host code, track issues and feature requests, and accept pull requests.

### 1. Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/skillscore.git
cd skillscore
npm install
```

### 2. Create a Branch

```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/issue-description
```

### 3. Make Changes

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Test your changes
npm run dev ./test-skills/sample-skill/

# Link for local testing
npm link
skillscore --help
```

### 4. Test Thoroughly

```bash
# Test with various skill types
skillscore ./test-skills/good-skill/
skillscore ./test-skills/bad-skill/
skillscore ./test-skills/minimal-skill/ --json
skillscore ./test-skills/complex-skill/ --markdown

# Test edge cases
skillscore ./nonexistent-path/
skillscore ./empty-directory/
```

### 5. Submit Pull Request

```bash
git add .
git commit -m "feat: add amazing new feature"
git push origin feature/amazing-feature
```

Then create a Pull Request on GitHub.

## Code Style Guidelines 🎨

### TypeScript Standards

- Use **strict mode** TypeScript
- Prefer `interface` over `type` for object types
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

```typescript
/**
 * Parses a skill directory and extracts metadata
 * @param skillPath Path to the skill directory
 * @returns Parsed skill information
 */
async parseSkill(skillPath: string): Promise<ParsedSkill> {
  // Implementation
}
```

### Code Organization

- Keep files focused and under 300 lines when possible
- Use barrel exports in index files
- Separate concerns (parsing, scoring, reporting)
- Follow the existing directory structure

### Error Handling

```typescript
// Good: Specific error messages
throw new Error(`SKILL.md not found in: ${skillPath}`);

// Bad: Generic errors
throw new Error('Something went wrong');
```

## Commit Convention 📝

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new scoring category
fix: resolve path resolution on Windows
docs: update README with new examples
style: format code with prettier
refactor: simplify scorer logic
test: add tests for edge cases
chore: update dependencies
```

## Adding New Features 🚀

### New Scoring Categories

If adding a new scoring category:

1. Update `src/rubric.ts`:
   - Add to `SCORING_CATEGORIES`
   - Create criteria constants
   - Adjust weights (must sum to 1.0)

2. Update `src/scorer.ts`:
   - Add scoring logic to `scoreCategory()`
   - Create private method like `scoreNewCategory()`

3. Update documentation:
   - README.md scoring table
   - CLI help text
   - Examples

### New Output Formats

If adding a new reporter:

1. Create `src/reporters/newFormatReporter.ts`
2. Implement the `generateReport(score: SkillScore): string` method
3. Add CLI option in `src/cli.ts`
4. Update README examples

### New Parsers

If adding support for new skill formats:

1. Create parser in `src/parsers/`
2. Update `SkillParser` to detect format
3. Ensure `ParsedSkill` interface compatibility
4. Add tests and examples

## Testing Guidelines 🧪

### Manual Testing

Create test skills to verify functionality:

```bash
# Test different scenarios
mkdir -p test-skills/perfect-skill
echo "# Perfect Skill\nThis skill does everything right." > test-skills/perfect-skill/SKILL.md

mkdir -p test-skills/minimal-skill
echo "# Minimal" > test-skills/minimal-skill/SKILL.md

mkdir -p test-skills/problematic-skill
echo "rm -rf /* # Dangerous command" > test-skills/problematic-skill/SKILL.md
```

### Edge Cases to Test

- Empty directories
- Missing SKILL.md
- Invalid file permissions
- Very long file paths
- Unicode characters in filenames
- Symlinks and shortcuts
- Skills with no files
- Skills with 1000+ files

## Bug Reports 🐛

Great bug reports tend to have:

- **Summary**: Quick summary of what happened
- **Steps to reproduce**: Detailed steps
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: OS, Node.js version, package version
- **Sample skill**: Minimal skill that reproduces the issue

```
## Bug Report

**Summary**: SkillScore crashes on Windows with path containing spaces

**Steps to reproduce**:
1. Create skill directory: "C:\My Skills\test skill\"
2. Run: skillscore "C:\My Skills\test skill\"
3. See error

**Expected**: Should evaluate the skill normally
**Actual**: TypeError: Cannot read property 'length' of undefined

**Environment**:
- OS: Windows 11
- Node.js: v18.17.0
- SkillScore: v1.0.0

**Sample skill**: Attached test-skill.zip
```

## Feature Requests 💡

We love feature ideas! Please include:

- **Use case**: Why do you need this feature?
- **Proposed solution**: How should it work?
- **Alternatives considered**: Other approaches you thought about
- **Examples**: Show how it would be used

## Development Tips 🎯

### Local Development

```bash
# Build in watch mode
npm run build -- --watch

# Test changes immediately
npm run dev ./test-skill/ --verbose

# Check TypeScript errors
npm run build
```

### Debugging

```bash
# Add debugging to your code
console.log(chalk.gray(`[DEBUG] Processing: ${skillPath}`));

# Use verbose output
skillscore ./test-skill/ --verbose
```

### Performance

- Be mindful of file I/O operations
- Use `fs.pathExists()` before `fs.readFile()`
- Cache repeated calculations
- Limit regex operations on large files

## Architecture Overview 🏗️

```
src/
├── index.ts          # Main entry point & exports
├── cli.ts           # Command-line interface
├── scorer.ts        # Core scoring engine
├── rubric.ts        # Scoring criteria definitions
├── parsers/         # File parsing logic
│   └── skillParser.ts
└── reporters/       # Output formatters
    ├── terminalReporter.ts
    ├── jsonReporter.ts
    └── markdownReporter.ts
```

### Data Flow

1. **CLI** parses arguments and options
2. **Parser** reads and analyzes skill files
3. **Scorer** evaluates against rubric criteria
4. **Reporter** formats results for output

## Questions? 🤔

- 💬 [Start a Discussion](https://github.com/skillscore/skillscore/discussions)
- 📧 Email: maintainers@skillscore.dev
- 🐦 Twitter: [@skillscore_dev](https://twitter.com/skillscore_dev)

## License 📄

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.