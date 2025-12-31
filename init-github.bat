@echo off
REM GitHub 仓库初始化脚本 (Windows)
REM 使用方法: init-github.bat YOUR_GITHUB_USERNAME

setlocal enabledelayedexpansion

REM 检查参数
if "%1"=="" (
    echo 错误: 请提供 GitHub 用户名
    echo 使用方法: init-github.bat YOUR_GITHUB_USERNAME
    exit /b 1
)

set GITHUB_USERNAME=%1
set REPO_NAME=AutoClicker

echo =========================================
echo GitHub 仓库初始化
echo =========================================
echo 用户名: %GITHUB_USERNAME%
echo 仓库名: %REPO_NAME%
echo.

REM 初始化 Git
echo 1. 初始化 Git 仓库...
if not exist ".git" (
    git init
    echo [OK] Git 仓库已初始化
) else (
    echo [!] Git 仓库已存在
)

REM 添加所有文件
echo.
echo 2. 添加文件到 Git...
git add .
echo [OK] 文件已添加

REM 创建初始提交
echo.
echo 3. 创建初始提交...
git rev-parse HEAD >nul 2>&1
if errorlevel 1 (
    git commit -m "Initial commit: AutoClicker with GitHub Actions" -m "" -m "- React Native 0.83.1 + TypeScript" -m "- Android AccessibilityService" -m "- Zustand state management" -m "- Material Design UI" -m "- GitHub Actions auto-build" -m "- Complete documentation"
    echo [OK] 初始提交已创建
) else (
    echo [!] 已存在提交
)

REM 设置主分支
echo.
echo 4. 设置主分支...
git branch -M main
echo [OK] 主分支已设置为 main

REM 添加远程仓库
echo.
echo 5. 添加远程仓库...
set REMOTE_URL=https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git
git remote | findstr "origin" >nul
if errorlevel 1 (
    git remote add origin %REMOTE_URL%
) else (
    echo [!] 远程仓库已存在，更新 URL...
    git remote set-url origin %REMOTE_URL%
)
echo [OK] 远程仓库: %REMOTE_URL%

REM 提示下一步
echo.
echo =========================================
echo 初始化完成！
echo =========================================
echo.
echo 下一步操作：
echo.
echo 1. 在 GitHub 创建仓库:
echo    访问: https://github.com/new
echo    仓库名: %REPO_NAME%
echo    不要初始化 README
echo.
echo 2. 推送代码:
echo    git push -u origin main
echo.
echo 3. 查看自动构建:
echo    访问: https://github.com/%GITHUB_USERNAME%/%REPO_NAME%/actions
echo.
echo 4. 下载 APK:
echo    构建完成后，在 Actions 页面的 Artifacts 部分下载
echo.
echo =========================================
echo.
pause
