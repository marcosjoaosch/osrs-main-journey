// Local runner for the same Worker handler; binds only to loopback.
import {createServer} from 'node:http';
import worker from './worker.mjs';
const port=Number(process.env.QUEST_SERVICE_PORT||4174);
const server=createServer(async(req,res)=>{
  try{
    const request=new Request(`http://127.0.0.1:${port}${req.url}`,{method:req.method,headers:req.headers});
    const response=await worker.fetch(request,{ALLOWED_ORIGINS:process.env.ALLOWED_ORIGINS});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Falha no servidor local'}))}
});
server.listen(port,'127.0.0.1',()=>console.log(`Quest service: http://127.0.0.1:${port}`));
process.on('SIGINT',()=>server.close());
