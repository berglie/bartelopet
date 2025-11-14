# Release Process

This project uses automated semantic versioning and release management based on conventional commits.

## How It Works

1. **Commit Convention**: All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification
2. **Automatic Versioning**: Version numbers are automatically determined based on commit types
3. **Automated Releases**: GitHub releases are created automatically when changes are pushed to the main branch
4. **Changelog Generation**: CHANGELOG.md is automatically generated and maintained

## Commit Types

| Type       | Description                              | Version Bump |
| ---------- | ---------------------------------------- | ------------ |
| `feat`     | New feature                              | Minor        |
| `fix`      | Bug fix                                  | Patch        |
| `docs`     | Documentation only changes               | Patch        |
| `style`    | Code style changes (formatting, etc)     | Patch        |
| `refactor` | Code refactoring without feature/fix     | Patch        |
| `perf`     | Performance improvements                 | Patch        |
| `test`     | Test changes                             | Patch        |
| `build`    | Build system changes                     | Patch        |
| `ci`       | CI/CD changes                            | Patch        |
| `chore`    | Other changes that don't affect the code | No release   |
| `revert`   | Reverts a previous commit                | Patch        |

**Breaking Changes**: Add `BREAKING CHANGE:` in the commit body or `!` after the type to trigger a major version bump.

## Commit Format

```
type(scope): description

[optional body]

[optional footer(s)]
```

### Examples

```bash
# Simple feature
git commit -m "feat: add user authentication"

# Feature with scope
git commit -m "feat(auth): implement OAuth2 login"

# Bug fix
git commit -m "fix: resolve memory leak in data processing"

# Breaking change (major version)
git commit -m "feat!: redesign API authentication

BREAKING CHANGE: API tokens are now required for all endpoints"
```

## Automated Release Process

When you push to the `main` branch:

1. **CI/CD Pipeline**: Runs tests and builds the application
2. **Deployment**: Deploys to Vercel production
3. **Semantic Release**: Analyzes commits since last release
4. **Version Bump**: Updates version in package.json
5. **Changelog**: Updates CHANGELOG.md with changes
6. **Git Tag**: Creates a new git tag with the version
7. **GitHub Release**: Creates a GitHub release with:
   - Release notes from conventional commits
   - Categorized changes (Features, Bug Fixes, etc.)
   - Links to commits and PRs
   - Download assets

## Local Testing

### Test Release Process (Dry Run)

```bash
# Install dependencies if needed
pnpm install

# Run semantic-release in dry-run mode
pnpm run release:dry-run
```

This will show you what version would be released and what the changelog would look like, without actually creating a release.

### Validate Commit Messages

The commit-msg git hook automatically validates your commit messages. To test manually:

```bash
echo "feat: test message" | npx commitlint
```

## Manual Release (Emergency Only)

If needed, you can trigger a release manually:

```bash
# Ensure you're on main branch with latest changes
git checkout main
git pull

# Run semantic-release manually
GITHUB_TOKEN=your_token pnpm run release
```

## Configuration Files

- `.releaserc.json`: Semantic release configuration
- `commitlint.config.js`: Commit message validation rules
- `.github/release.yml`: GitHub release categories
- `.github/workflows/cd-prod.yaml`: CI/CD pipeline with release automation

## Troubleshooting

### Release Not Created

- Check that commits follow conventional format
- Verify GitHub Actions has write permissions
- Check the workflow logs in GitHub Actions

### Wrong Version Bump

- Ensure commit type matches intended change
- Use `BREAKING CHANGE:` for major versions
- Check `.releaserc.json` for release rules

### Commit Rejected

- Ensure message follows conventional format
- Run `pnpm run hooks:install` to install git hooks
- Use `--no-verify` to bypass (emergency only)

## Best Practices

1. **Write Clear Commits**: The commit message becomes part of the changelog
2. **Use Scopes**: Help organize changes in the changelog
3. **Document Breaking Changes**: Always explain what breaks and how to migrate
4. **Squash Feature Branches**: Keep main branch history clean
5. **Test Locally**: Use dry-run mode before important releases
