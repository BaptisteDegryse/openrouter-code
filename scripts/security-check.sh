#!/bin/bash

# Security verification script for OpenRouter Code CLI
# This script checks for potential security issues before committing

echo "🔒 Running security check..."

# Check for hardcoded API keys in source files
echo "Checking for hardcoded API keys..."
if grep -r "sk-" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "example\|placeholder"; then
    echo "❌ Found potential hardcoded API keys!"
    exit 1
fi

if grep -r "or-[a-zA-Z0-9]" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "example\|placeholder\|openrouter"; then
    echo "❌ Found potential OpenRouter API keys!"
    exit 1
fi

# Check .gitignore has essential protections
echo "Verifying .gitignore protections..."
if ! grep -q ".openrouter/" .gitignore; then
    echo "❌ .openrouter/ not in .gitignore!"
    exit 1
fi

if ! grep -q "\.env" .gitignore; then
    echo "❌ .env files not in .gitignore!"
    exit 1
fi

# Check for sensitive files in git
echo "Checking git status for sensitive files..."
if git ls-files | grep -E "\.env$|\.openrouter|.*\.api-key$|secrets\.json$" | grep -v ".gitignore"; then
    echo "❌ Found sensitive files tracked by git!"
    exit 1
fi

echo "✅ Security check passed!"
echo "✅ No hardcoded API keys found"
echo "✅ .gitignore properly configured"
echo "✅ No sensitive files tracked by git"
echo ""
echo "Your OpenRouter API key is secure! 🚀"