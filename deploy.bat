@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

rem ============================================================
rem  Command Book 一键部署脚本
rem  作用：提交本地改动并推送双远端
rem    GitHub → 触发 Actions 自动构建上线
rem    Gitee  → 国内源码备份
rem  用法：
rem    deploy.bat                    用默认提交信息
rem    deploy.bat "feat: 新增xxx"     指定提交信息
rem ============================================================

set MSG=%~1
if "%MSG%"=="" set MSG=ci: deploy update

echo [deploy] 1/3 提交本地改动...
git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%MSG%"
  if errorlevel 1 (
    echo [deploy] 提交失败，中止。
    exit /b 1
  )
) else (
  echo [deploy] 没有待提交的改动，跳过 commit。
)

echo [deploy] 2/3 推送 GitHub（触发自动部署）...
git push github master
if errorlevel 1 (
  echo.
  echo [deploy] GitHub 推送失败！
  echo          提示：GitHub 需要代理访问，请先开启本地代理（端口 7897）后重试。
  exit /b 1
)

echo [deploy] 3/3 推送 Gitee（备份）...
git push origin master
if errorlevel 1 (
  echo.
  echo [deploy] Gitee 推送失败！
  exit /b 1
)

echo.
echo [deploy] 部署完成：
echo           GitHub Pages 正在自动构建，约 1-2 分钟后访问
echo           https://11052022.github.io/command-book-web/
echo.
endlocal