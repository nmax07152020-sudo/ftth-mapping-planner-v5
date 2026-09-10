const http = require('http');
const fs = require('fs');
const path = require('path');
const { routeApi } = require('./backend');
const PORT = process.env.PORT || 3000;
const publicDir = __dirname;
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
  try{
    if(req.url.startsWith('/api/')) return routeApi(req,res);
    let file = path.join(publicDir, req.url==='/'?'index.html':req.url.replace(/\?.*$/,'').replace(/^\//,''));
    if(!file.startsWith(publicDir)) return res.end('Forbidden');
    if(!fs.existsSync(file) || fs.statSync(file).isDirectory()) file=path.join(publicDir,'index.html');
    res.statusCode=200;res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');fs.createReadStream(file).pipe(res);
  }catch(e){res.statusCode=500;res.end('Server error')}
});
server.listen(PORT,()=>console.log(`WIN FTTH v5 running on http://localhost:${PORT}`));
