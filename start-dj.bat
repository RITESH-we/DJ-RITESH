@echo off
title PRO DJ AUTOMIXER
echo ========================================================
echo Starting PRO DJ AUTOMIXER on http://localhost:5173/ ...
echo ========================================================
set PATH=%~dp0node-portable\node-v20.15.1-win-x64;%PATH%
cd /d "%~dp0"
call npm.cmd run dev -- --host --port 5173
pause
