#!/bin/sh
# Script to install git hooks

echo "🔧 Installing git hooks..."

# Get the git hooks directory
GIT_HOOKS_DIR=".git/hooks"
PROJECT_HOOKS_DIR=".githooks"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ This is not a git repository. Please run this script from the project root."
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$GIT_HOOKS_DIR"

# Install pre-commit hook
if [ -f "$PROJECT_HOOKS_DIR/pre-commit" ]; then
    echo "   Installing pre-commit hook..."
    cp "$PROJECT_HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit"
    chmod +x "$GIT_HOOKS_DIR/pre-commit"
    echo "   ✅ pre-commit hook installed"
else
    echo "   ⚠️  pre-commit hook not found in $PROJECT_HOOKS_DIR"
fi

echo "✅ Git hooks installation complete!"
echo ""
echo "The following hooks are now active:"
echo "  • pre-commit: Automatically formats staged files with Prettier"
echo ""
echo "To bypass the hooks (emergency only), use: git commit --no-verify"