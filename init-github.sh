#!/bin/bash

# GitHub 仓库初始化脚本
# 使用方法: ./init-github.sh YOUR_GITHUB_USERNAME

set -e

# 检查参数
if [ -z "$1" ]; then
    echo "错误: 请提供 GitHub 用户名"
    echo "使用方法: ./init-github.sh YOUR_GITHUB_USERNAME"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="AutoClicker"

echo "========================================="
echo "GitHub 仓库初始化"
echo "========================================="
echo "用户名: $GITHUB_USERNAME"
echo "仓库名: $REPO_NAME"
echo ""

# 初始化 Git
echo "1. 初始化 Git 仓库..."
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git 仓库已初始化"
else
    echo "⚠️  Git 仓库已存在"
fi

# 添加所有文件
echo ""
echo "2. 添加文件到 Git..."
git add .
echo "✅ 文件已添加"

# 创建初始提交
echo ""
echo "3. 创建初始提交..."
if git rev-parse HEAD >/dev/null 2>&1; then
    echo "⚠️  已存在提交"
else
    git commit -m "Initial commit: AutoClicker with GitHub Actions

- React Native 0.83.1 + TypeScript
- Android AccessibilityService
- Zustand state management
- Material Design UI
- GitHub Actions auto-build
- Complete documentation"
    echo "✅ 初始提交已创建"
fi

# 设置主分支
echo ""
echo "4. 设置主分支..."
git branch -M main
echo "✅ 主分支已设置为 main"

# 添加远程仓库
echo ""
echo "5. 添加远程仓库..."
REMOTE_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
if git remote | grep -q "origin"; then
    echo "⚠️  远程仓库已存在，更新 URL..."
    git remote set-url origin $REMOTE_URL
else
    git remote add origin $REMOTE_URL
fi
echo "✅ 远程仓库: $REMOTE_URL"

# 提示下一步
echo ""
echo "========================================="
echo "初始化完成！"
echo "========================================="
echo ""
echo "下一步操作："
echo ""
echo "1. 在 GitHub 创建仓库:"
echo "   访问: https://github.com/new"
echo "   仓库名: $REPO_NAME"
echo "   不要初始化 README"
echo ""
echo "2. 推送代码:"
echo "   git push -u origin main"
echo ""
echo "3. 查看自动构建:"
echo "   访问: https://github.com/$GITHUB_USERNAME/$REPO_NAME/actions"
echo ""
echo "4. 下载 APK:"
echo "   构建完成后，在 Actions 页面的 Artifacts 部分下载"
echo ""
echo "========================================="
