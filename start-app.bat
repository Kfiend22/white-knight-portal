@echo off
echo Starting White Knight Portal Application...
echo.

echo Clearing localStorage...
echo localStorage.clear(); > clear-storage.js
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --new-window "javascript:(function() { localStorage.clear(); alert('localStorage cleared!'); })();"

echo.
echo Starting backend server...
start cmd /k "cd backend && npm start"

echo.
echo Starting frontend server...
start cmd /k "npm start"

echo.
echo Application starting...
echo.
echo If you encounter any issues, please refer to the TROUBLESHOOTING.md file.
echo.
echo Press any key to exit...
pause > nul
