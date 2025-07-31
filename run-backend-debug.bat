@echo off
cd /d "%~dp0backend"
echo Current directory: %CD%
echo Running: node app-debug.js
node app-debug.js
pause
