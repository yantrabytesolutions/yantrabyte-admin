@echo off
title Nagarathnamma Cash Bill App
cd /d "%~dp0"
echo ===================================================
echo   Nagarathnamma Screen & Offset Printing
echo   Cash Bill App (Mobile & PC Sync)
echo ===================================================
echo.
echo Starting server...
start "" "http://localhost:5000"
node -e "const http=require('http'),fs=require('fs'),path=require('path');const port=5000;http.createServer((req,res)=>{let f=path.join('.',req.url==='/'?'index.html':req.url);if(fs.existsSync(f)&&fs.statSync(f).isFile()){res.writeHead(200);fs.createReadStream(f).pipe(res);}else{res.writeHead(404);res.end('Not found');}}).listen(port,'0.0.0.0',()=>{console.log('App running on: http://localhost:5000');});"
pause
