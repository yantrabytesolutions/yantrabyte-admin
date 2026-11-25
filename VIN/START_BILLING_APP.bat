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
node -e "const http=require('http'),fs=require('fs'),path=require('path');const port=5000;const root=process.cwd();http.createServer((req,res)=>{const cleanPath=decodeURIComponent((req.url||'/').split('?')[0]);const rel=cleanPath==='/'?'index.html':cleanPath.replace(/^\/+/,'');const f=path.resolve(root,rel);if(f!==root&&!f.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}if(fs.existsSync(f)&&fs.statSync(f).isFile()){res.writeHead(200);fs.createReadStream(f).pipe(res);}else{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>{console.log('App running on: http://127.0.0.1:5000');});"
pause
