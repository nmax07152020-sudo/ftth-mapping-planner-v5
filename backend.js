const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let pg = null;
try { pg = require('pg'); } catch (_) { pg = null; }

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'WIN-Ftth-V5-Change-This-Secret';

const seed = {
  users: [
    {username:'admin', password_hash:hashPassword('admin123'), role:'Admin', name:'WIN Administrator'},
    {username:'fieldtech1', password_hash:hashPassword('tech123'), role:'Field Technician', name:'WIN Field Technician 1'}
  ],
  technicians: [
    {id:'TECH-001',name:'John D.',contact:'0917-000-0001',team:'Team A',area:'North Area',status:'Online',gps:'Not connected'},
    {id:'TECH-002',name:'Mark R.',contact:'0917-000-0002',team:'Team A',area:'Marbel-Columbio Rd',status:'On Duty',gps:'Not connected'},
    {id:'TECH-003',name:'Liza P.',contact:'0917-000-0003',team:'Team B',area:'Central Loop',status:'Online',gps:'Not connected'},
    {id:'TECH-004',name:'Carlo M.',contact:'0917-000-0004',team:'Team B',area:'North Area',status:'Offline',gps:'Not connected'},
    {id:'TECH-005',name:'Rico S.',contact:'0917-000-0005',team:'Team C',area:'Sitio El Dorado',status:'Online',gps:'Not connected'}
  ],
  jobs: [
    {id:'JOB-001',type:'Installation',site:'Maria Santos',node:'NAP-001 / P1',tech:'TECH-003',priority:'Normal',status:'Working',notes:'Customer installation'},
    {id:'JOB-002',type:'Repair',site:'Ana Reyes',node:'NAP-005 / P1',tech:'TECH-002',priority:'High',status:'On Route',notes:'Low RX reported'},
    {id:'JOB-003',type:'OTDR Fault Check',site:'Central Loop',node:'OLT-001',tech:'TECH-001',priority:'Urgent',status:'Pending',notes:'Check 1.24 km fault'}
  ],
  clients: [
    {account:'ACC-001',name:'Maria Santos',address:'Brgy Central',port:'NAP-001 / P1',plan:'Fiber 100',status:'Active',phone:''},
    {account:'ACC-002',name:'Jose Cruz',address:'Marbel Rd',port:'NAP-001 / P2',plan:'Fiber 200',status:'Active',phone:''},
    {account:'ACC-003',name:'Ana Reyes',address:'Sitio El Dorado',port:'NAP-005 / P1',plan:'Fiber 100',status:'Repair',phone:''},
    {account:'ACC-004',name:'Carlo Dela Rosa',address:'Columbio Rd',port:'NAP-002 / P7',plan:'Fiber 500',status:'Pending',phone:''},
    {account:'ACC-005',name:'Rina Garcia',address:'Central Loop',port:'NAP-004 / P4',plan:'Fiber 200',status:'Active',phone:''}
  ],
  nodes: [
    {id:'OLT-001',type:'OLT',lat:14.5757,lng:121.1991,label:'OLT-001',core_type:'4 Core (Blue, Orange, Green, Brown)'},
    {id:'LCP-001',type:'LCP',lat:14.5749,lng:121.1969,label:'LCP-001',core_type:'4 Core (Blue, Orange, Green, Brown)'},
    {id:'NAP-001',type:'NAP',lat:14.5782,lng:121.2012,label:'NAP-001',core_type:'4 Core (Blue, Orange, Green, Brown)'},
    {id:'NAP-002',type:'NAP',lat:14.5733,lng:121.2000,label:'NAP-002',core_type:'4 Core (Blue, Orange, Green, Brown)'},
    {id:'NAP-003',type:'NAP',lat:14.5714,lng:121.1972,label:'NAP-003',core_type:'4 Core (Blue, Orange, Green, Brown)'},
    {id:'NAP-004',type:'NAP',lat:14.5767,lng:121.1949,label:'NAP-004',core_type:'4 Core (Blue, Orange, Green, Brown)'},
    {id:'NAP-005',type:'NAP',lat:14.5771,lng:121.2008,label:'NAP-005',core_type:'4 Core (Blue, Orange, Green, Brown)'},
    {id:'CLOS-001',type:'CLOSURE',lat:14.5758,lng:121.1978,label:'CLS-001',core_type:'4 Core (Blue, Orange, Green, Brown)'},
    {id:'POLE-001',type:'POLE',lat:14.5769,lng:121.1986,label:'P-001',core_type:'4 Core (Blue, Orange, Green, Brown)'},
    {id:'POLE-002',type:'POLE',lat:14.5744,lng:121.1984,label:'P-002',core_type:'4 Core (Blue, Orange, Green, Brown)'}
  ],
  plans: [{id:1,name:'Central FTTH Network',route_points:[[14.5757,121.1991],[14.5754,121.1987],[14.5750,121.1982],[14.5745,121.1978],[14.5740,121.1974],[14.5733,121.1972],[14.5723,121.1970],[14.5714,121.1972]]}],
  faults: [], qr_activations: [], activities: [
    {time_label:'10:42',actor:'John D.',activity:'NAP-005 activated',status:'Completed'},
    {time_label:'10:21',actor:'Mark R.',activity:'OTDR fault check',status:'Alert'},
    {time_label:'09:55',actor:'Liza P.',activity:'Customer installation',status:'Completed'},
    {time_label:'09:32',actor:'John D.',activity:'GPS check-in',status:'Online'}
  ],
  settings: {default_core:'4 Core (Blue, Orange, Green, Brown)',default_splitter:'1:8',safety_margin:'2.0',max_gps_accuracy:'20',require_qr:'1',show_fault_alert:'1',keep_gps_history:'1'}
};

function hashPassword(password){ return crypto.createHash('sha256').update(password).digest('hex'); }
function safeJsonParse(v, fallback){ try{return JSON.parse(v)}catch{return fallback} }
function cloneSeed(){ return JSON.parse(JSON.stringify(seed)); }
function ensureLocal(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
  if(!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(cloneSeed(),null,2));
}
function readLocal(){ ensureLocal(); return safeJsonParse(fs.readFileSync(DATA_FILE,'utf8'), cloneSeed()); }
function writeLocal(db){ ensureLocal(); fs.writeFileSync(DATA_FILE, JSON.stringify(db,null,2)); }

let pool = null;
if (process.env.DATABASE_URL && pg) pool = new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:5});

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'Admin',name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS technicians (id TEXT PRIMARY KEY,name TEXT NOT NULL,contact TEXT DEFAULT '',team TEXT DEFAULT '',area TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'Offline',gps TEXT DEFAULT 'Not connected',gps_lat DOUBLE PRECISION,gps_lng DOUBLE PRECISION,gps_accuracy DOUBLE PRECISION,last_update TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY,type TEXT NOT NULL,site TEXT NOT NULL,node TEXT DEFAULT '',tech TEXT DEFAULT '',priority TEXT NOT NULL DEFAULT 'Normal',status TEXT NOT NULL DEFAULT 'Pending',notes TEXT DEFAULT '',updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS clients (account TEXT PRIMARY KEY,name TEXT NOT NULL,address TEXT DEFAULT '',port TEXT DEFAULT 'Unassigned',plan TEXT NOT NULL DEFAULT 'Fiber 100',status TEXT NOT NULL DEFAULT 'Pending',phone TEXT DEFAULT '',lat DOUBLE PRECISION,lng DOUBLE PRECISION,updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS nodes (id TEXT PRIMARY KEY,type TEXT NOT NULL,lat DOUBLE PRECISION NOT NULL,lng DOUBLE PRECISION NOT NULL,label TEXT NOT NULL,core_type TEXT DEFAULT '',updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS plans (id INTEGER PRIMARY KEY,name TEXT NOT NULL,route_points JSONB NOT NULL DEFAULT '[]'::jsonb,updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS faults (id BIGSERIAL PRIMARY KEY,olt TEXT NOT NULL,distance_km NUMERIC(10,3) NOT NULL,lat DOUBLE PRECISION NOT NULL,lng DOUBLE PRECISION NOT NULL,nearest_node TEXT DEFAULT '',created_by TEXT DEFAULT '',created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS qr_activations (id BIGSERIAL PRIMARY KEY,nap_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Activated',activated_by TEXT DEFAULT '',activated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS activities (id BIGSERIAL PRIMARY KEY,time_label TEXT NOT NULL,actor TEXT NOT NULL,activity TEXT NOT NULL,status TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY,value TEXT NOT NULL);
`;
let pgReady = null;
async function ensurePg(){
  if(!pool) return false;
  if(pgReady) return pgReady;
  pgReady=(async()=>{
    await pool.query(schemaSql);
    const c=await pool.query('SELECT COUNT(*)::int AS c FROM users');
    if(c.rows[0].c===0) {
      for(const u of seed.users) await pool.query('INSERT INTO users(username,password_hash,role,name) VALUES($1,$2,$3,$4)',[u.username,u.password_hash,u.role,u.name]);
      for(const t of seed.technicians) await upsertPgTechnician(t);
      for(const j of seed.jobs) await upsertPgJob(j);
      for(const c1 of seed.clients) await upsertPgClient(c1);
      for(const n of seed.nodes) await upsertPgNode(n);
      const p=seed.plans[0]; await pool.query('INSERT INTO plans(id,name,route_points) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING',[p.id,p.name,JSON.stringify(p.route_points)]);
      for(const a of seed.activities) await pool.query('INSERT INTO activities(time_label,actor,activity,status) VALUES($1,$2,$3,$4)',[a.time_label,a.actor,a.activity,a.status]);
      for(const [k,v] of Object.entries(seed.settings)) await pool.query('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO NOTHING',[k,String(v)]);
    }
    return true;
  })().catch(e=>{console.error('Postgres init failed:',e);return false;});
  return pgReady;
}

async function upsertPgTechnician(t){await pool.query(`INSERT INTO technicians(id,name,contact,team,area,status,gps,gps_lat,gps_lng,gps_accuracy,last_update) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,contact=EXCLUDED.contact,team=EXCLUDED.team,area=EXCLUDED.area,status=EXCLUDED.status,gps=EXCLUDED.gps,gps_lat=EXCLUDED.gps_lat,gps_lng=EXCLUDED.gps_lng,gps_accuracy=EXCLUDED.gps_accuracy,last_update=EXCLUDED.last_update`,[t.id,t.name,t.contact||'',t.team||'',t.area||'',t.status||'Offline',t.gps||'Not connected',t.gps_lat??null,t.gps_lng??null,t.gps_accuracy??null,t.last_update??null])}
async function upsertPgJob(j){await pool.query(`INSERT INTO jobs(id,type,site,node,tech,priority,status,notes,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,NOW()) ON CONFLICT(id) DO UPDATE SET type=EXCLUDED.type,site=EXCLUDED.site,node=EXCLUDED.node,tech=EXCLUDED.tech,priority=EXCLUDED.priority,status=EXCLUDED.status,notes=EXCLUDED.notes,updated_at=NOW()`,[j.id,j.type,j.site,j.node||'',j.tech||'',j.priority||'Normal',j.status||'Pending',j.notes||''])}
async function upsertPgClient(c){await pool.query(`INSERT INTO clients(account,name,address,port,plan,status,phone,lat,lng,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) ON CONFLICT(account) DO UPDATE SET name=EXCLUDED.name,address=EXCLUDED.address,port=EXCLUDED.port,plan=EXCLUDED.plan,status=EXCLUDED.status,phone=EXCLUDED.phone,lat=EXCLUDED.lat,lng=EXCLUDED.lng,updated_at=NOW()`,[c.account,c.name,c.address||'',c.port||'Unassigned',c.plan||'Fiber 100',c.status||'Pending',c.phone||'',c.lat??null,c.lng??null])}
async function upsertPgNode(n){await pool.query(`INSERT INTO nodes(id,type,lat,lng,label,core_type,updated_at) VALUES($1,$2,$3,$4,$5,$6,NOW()) ON CONFLICT(id) DO UPDATE SET type=EXCLUDED.type,lat=EXCLUDED.lat,lng=EXCLUDED.lng,label=EXCLUDED.label,core_type=EXCLUDED.core_type,updated_at=NOW()`,[n.id,n.type,n.lat,n.lng,n.label,n.core_type||''])}

function sign(payload){const b=Buffer.from(JSON.stringify(payload)).toString('base64url');const sig=crypto.createHmac('sha256',SESSION_SECRET).update(b).digest('base64url');return `${b}.${sig}`}
function verify(token){try{const [b,s]=token.split('.');if(!b||!s)return null;const exp=crypto.createHmac('sha256',SESSION_SECRET).update(b).digest('base64url');if(!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(exp)))return null;const p=JSON.parse(Buffer.from(b,'base64url').toString());if(p.exp<Date.now())return null;return p}catch{return null}}
function getAuth(req){const h=req.headers?.authorization||'';return h.startsWith('Bearer ')?verify(h.slice(7)):null}
function json(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));}
function send(res,status,body,type='text/html; charset=utf-8'){res.statusCode=status;res.setHeader('Content-Type',type);res.end(body)}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>resolve(s?safeJsonParse(s,{}):{}));req.on('error',reject)})}
function nowLabel(){return new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
function unauthorized(res){return json(res,401,{error:'Unauthorized'})}
function notFound(res){return json(res,404,{error:'Not found'})}

async function bootstrap(){
  if(await ensurePg()){
    const [technicians,jobs,clients,nodes,plans,faults,qr_activations,activities,settings]=await Promise.all([
      pool.query('SELECT id,name,contact,team,area,status,gps,gps_lat,gps_lng,gps_accuracy,last_update FROM technicians ORDER BY id'),
      pool.query('SELECT id,type,site,node,tech,priority,status,notes,updated_at FROM jobs ORDER BY updated_at DESC'),
      pool.query('SELECT account,name,address,port,plan,status,phone,lat,lng,updated_at FROM clients ORDER BY account'),
      pool.query('SELECT id,type,lat,lng,label,core_type FROM nodes ORDER BY id'),
      pool.query('SELECT id,name,route_points FROM plans ORDER BY id'),
      pool.query('SELECT id,olt,distance_km,lat,lng,nearest_node,created_by,created_at FROM faults ORDER BY id DESC LIMIT 50'),
      pool.query('SELECT id,nap_id,status,activated_by,activated_at FROM qr_activations ORDER BY id DESC LIMIT 50'),
      pool.query('SELECT time_label,actor,activity,status FROM activities ORDER BY id DESC LIMIT 30'),
      pool.query('SELECT key,value FROM settings')
    ]);
    return {technicians:technicians.rows,jobs:jobs.rows,clients:clients.rows,nodes:nodes.rows,plans:plans.rows,faults:faults.rows,qr_activations:qr_activations.rows,activities:activities.rows,settings:Object.fromEntries(settings.rows.map(r=>[r.key,r.value])),database:'Postgres'};
  }
  const db=readLocal();
  return {...db,database:'Local JSON'};
}

async function addActivity(actor,activity,status){
  const row={time_label:nowLabel(),actor,activity,status};
  if(await ensurePg()){await pool.query('INSERT INTO activities(time_label,actor,activity,status) VALUES($1,$2,$3,$4)',[row.time_label,row.actor,row.activity,row.status]);return row;}
  const db=readLocal();db.activities.unshift(row);db.activities=db.activities.slice(0,100);writeLocal(db);return row;
}

async function routeApi(req,res){
  const url = new URL(req.url, 'http://localhost');
  const pathname=url.pathname;
  if(pathname==='/api/health') return json(res,200,{ok:true,database:pool?'Postgres-capable':'Local JSON',timestamp:new Date().toISOString()});
  if(pathname==='/api/login' && req.method==='POST'){
    const b=await body(req);const username=String(b.username||'').trim();const password=String(b.password||'');
    let user=null;
    if(await ensurePg()){const r=await pool.query('SELECT username,password_hash,role,name FROM users WHERE username=$1',[username]);user=r.rows[0]||null}
    else {user=readLocal().users.find(u=>u.username===username)||null}
    if(!user || !crypto.timingSafeEqual(Buffer.from(user.password_hash),Buffer.from(hashPassword(password)))) return json(res,401,{error:'Invalid username or password'});
    const token=sign({username:user.username,role:user.role,name:user.name,exp:Date.now()+1000*60*60*12});
    return json(res,200,{token,user:{username:user.username,role:user.role,name:user.name}});
  }
  if(pathname.startsWith('/api/') && pathname!=='/api/login' && pathname!=='/api/health') { const auth=getAuth(req); if(!auth) return unauthorized(res); }
  const auth=getAuth(req);
  try{
    if(pathname==='/api/bootstrap' && req.method==='GET') return json(res,200,await bootstrap());
    if(pathname==='/api/technicians' && req.method==='GET') return json(res,200,(await bootstrap()).technicians);
    if(pathname==='/api/technicians' && req.method==='POST'){
      const b=await body(req); if(!b.id||!b.name) return json(res,400,{error:'Technician ID and name are required'});
      if(await ensurePg()){await upsertPgTechnician(b)} else {const db=readLocal(); if(db.technicians.some(x=>x.id===b.id)) return json(res,409,{error:'Technician ID already exists'});db.technicians.push(b);writeLocal(db)}
      await addActivity(auth.name,b.id+' technician saved','Completed'); return json(res,200,b);
    }
    const mt=pathname.match(/^\/api\/technicians\/([^/]+)$/);
    if(mt){const id=decodeURIComponent(mt[1]);
      if(req.method==='PUT'){const b=await body(req);b.id=id;if(await ensurePg())await upsertPgTechnician(b);else{const db=readLocal();const i=db.technicians.findIndex(x=>x.id===id);if(i<0)return notFound(res);db.technicians[i]={...db.technicians[i],...b};writeLocal(db)}await addActivity(auth.name,id+' technician updated','Updated');return json(res,200,b)}
      if(req.method==='DELETE'){if(await ensurePg()){await pool.query('UPDATE jobs SET tech=\'\' WHERE tech=$1',[id]);await pool.query('DELETE FROM technicians WHERE id=$1',[id])}else{const db=readLocal();db.jobs.forEach(j=>{if(j.tech===id)j.tech=''});db.technicians=db.technicians.filter(x=>x.id!==id);writeLocal(db)}await addActivity(auth.name,id+' technician deleted','Alert');return json(res,200,{ok:true})}
    }
    if(pathname==='/api/jobs' && req.method==='GET') return json(res,200,(await bootstrap()).jobs);
    if(pathname==='/api/jobs' && req.method==='POST'){const b=await body(req);if(!b.id||!b.site)return json(res,400,{error:'Job ID and site are required'});if(await ensurePg()){const c=await pool.query('SELECT 1 FROM jobs WHERE id=$1',[b.id]);if(c.rowCount)return json(res,409,{error:'Job ID already exists'});await upsertPgJob(b)}else{const db=readLocal();if(db.jobs.some(x=>x.id===b.id))return json(res,409,{error:'Job ID already exists'});db.jobs.unshift(b);writeLocal(db)}await addActivity(auth.name,b.id+' field job created',b.status||'Pending');return json(res,200,b)}
    const mj=pathname.match(/^\/api\/jobs\/([^/]+)$/); if(mj){const id=decodeURIComponent(mj[1]);if(req.method==='PUT'){const b=await body(req);b.id=id;if(await ensurePg())await upsertPgJob(b);else{const db=readLocal();const i=db.jobs.findIndex(x=>x.id===id);if(i<0)return notFound(res);db.jobs[i]={...db.jobs[i],...b};writeLocal(db)}await addActivity(auth.name,id+' field job updated',b.status||'Updated');return json(res,200,b)}if(req.method==='DELETE'){if(await ensurePg())await pool.query('DELETE FROM jobs WHERE id=$1',[id]);else{const db=readLocal();db.jobs=db.jobs.filter(x=>x.id!==id);writeLocal(db)}await addActivity(auth.name,id+' field job deleted','Alert');return json(res,200,{ok:true})}}

    if(pathname==='/api/clients' && req.method==='GET') return json(res,200,(await bootstrap()).clients);
    if(pathname==='/api/clients' && req.method==='POST'){const b=await body(req);if(!b.account||!b.name)return json(res,400,{error:'Account and customer name are required'});if(await ensurePg()){const c=await pool.query('SELECT 1 FROM clients WHERE account=$1',[b.account]);if(c.rowCount)return json(res,409,{error:'Account already exists'});await upsertPgClient(b)}else{const db=readLocal();if(db.clients.some(x=>x.account===b.account))return json(res,409,{error:'Account already exists'});db.clients.push(b);writeLocal(db)}await addActivity(auth.name,b.name+' client saved','Completed');return json(res,200,b)}
    const mc=pathname.match(/^\/api\/clients\/([^/]+)$/); if(mc){const id=decodeURIComponent(mc[1]);if(req.method==='PUT'){const b=await body(req);b.account=id;if(await ensurePg())await upsertPgClient(b);else{const db=readLocal();const i=db.clients.findIndex(x=>x.account===id);if(i<0)return notFound(res);db.clients[i]={...db.clients[i],...b};writeLocal(db)}await addActivity(auth.name,id+' CRM client updated','Updated');return json(res,200,b)}if(req.method==='DELETE'){if(await ensurePg())await pool.query('DELETE FROM clients WHERE account=$1',[id]);else{const db=readLocal();db.clients=db.clients.filter(x=>x.account!==id);writeLocal(db)}await addActivity(auth.name,id+' CRM client deleted','Alert');return json(res,200,{ok:true})}}

    if(pathname==='/api/nodes' && req.method==='GET') return json(res,200,(await bootstrap()).nodes);
    if(pathname==='/api/nodes' && req.method==='POST'){const b=await body(req);if(!b.id||!b.type)return json(res,400,{error:'Node ID and type are required'});if(await ensurePg()){const c=await pool.query('SELECT 1 FROM nodes WHERE id=$1',[b.id]);if(c.rowCount)return json(res,409,{error:'Node ID already exists'});await upsertPgNode(b)}else{const db=readLocal();if(db.nodes.some(x=>x.id===b.id))return json(res,409,{error:'Node ID already exists'});db.nodes.push(b);writeLocal(db)}await addActivity(auth.name,b.id+' added to map','Completed');return json(res,200,b)}
    const mn=pathname.match(/^\/api\/nodes\/([^/]+)$/); if(mn){const id=decodeURIComponent(mn[1]);if(req.method==='PUT'){const b=await body(req);b.id=id;if(await ensurePg())await upsertPgNode(b);else{const db=readLocal();const i=db.nodes.findIndex(x=>x.id===id);if(i<0)return notFound(res);db.nodes[i]={...db.nodes[i],...b};writeLocal(db)}return json(res,200,b)}if(req.method==='DELETE'){if(await ensurePg())await pool.query('DELETE FROM nodes WHERE id=$1',[id]);else{const db=readLocal();db.nodes=db.nodes.filter(x=>x.id!==id);writeLocal(db)}await addActivity(auth.name,id+' removed from map','Alert');return json(res,200,{ok:true})}}

    if(pathname==='/api/plan' && req.method==='GET') return json(res,200,(await bootstrap()).plans[0]||{id:1,name:'Central FTTH Network',route_points:[]});
    if(pathname==='/api/plan' && req.method==='PUT'){const b=await body(req);const p={id:1,name:b.name||'Central FTTH Network',route_points:Array.isArray(b.route_points)?b.route_points:[]};if(await ensurePg())await pool.query('INSERT INTO plans(id,name,route_points) VALUES(1,$1,$2) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,route_points=EXCLUDED.route_points,updated_at=NOW()',[p.name,JSON.stringify(p.route_points)]);else{const db=readLocal();db.plans=[p];writeLocal(db)}await addActivity(auth.name,'Plan '+p.name+' saved','Completed');return json(res,200,p)}
    if(pathname==='/api/plan' && req.method==='DELETE'){if(await ensurePg())await pool.query('DELETE FROM plans WHERE id=1');else{const db=readLocal();db.plans=[];writeLocal(db)}await addActivity(auth.name,'Plan deleted','Alert');return json(res,200,{ok:true})}

    if(pathname==='/api/faults' && req.method==='GET') return json(res,200,(await bootstrap()).faults);
    if(pathname==='/api/faults' && req.method==='POST'){const b=await body(req);if(await ensurePg()){const r=await pool.query('INSERT INTO faults(olt,distance_km,lat,lng,nearest_node,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,olt,distance_km,lat,lng,nearest_node,created_by,created_at',[b.olt,b.distance_km,b.lat,b.lng,b.nearest_node||'',auth.username]);return json(res,200,r.rows[0])}const db=readLocal();const id=Date.now();const f={id,olt:b.olt,distance_km:b.distance_km,lat:b.lat,lng:b.lng,nearest_node:b.nearest_node||'',created_by:auth.username,created_at:new Date().toISOString()};db.faults.unshift(f);writeLocal(db);await addActivity(auth.name,'OTDR fault recorded at '+Number(b.distance_km).toFixed(3)+' km','Alert');return json(res,200,f)}

    if(pathname==='/api/qr/activate' && req.method==='POST'){const b=await body(req);const nap=String(b.nap_id||'').trim().toUpperCase();if(!/^NAP-\d+$/.test(nap))return json(res,400,{error:'Invalid NAP ID'});if(await ensurePg()){const r=await pool.query('INSERT INTO qr_activations(nap_id,status,activated_by) VALUES($1,\'Activated\',$2) RETURNING id,nap_id,status,activated_by,activated_at',[nap,auth.username]);await addActivity(auth.name,nap+' activated via QR','Completed');return json(res,200,r.rows[0])}const db=readLocal();const q={id:Date.now(),nap_id:nap,status:'Activated',activated_by:auth.username,activated_at:new Date().toISOString()};db.qr_activations.unshift(q);writeLocal(db);await addActivity(auth.name,nap+' activated via QR','Completed');return json(res,200,q)}

    if(pathname==='/api/gps' && req.method==='POST'){const b=await body(req);if(!b.tech_id||!Number.isFinite(Number(b.lat))||!Number.isFinite(Number(b.lng)))return json(res,400,{error:'tech_id, lat and lng are required'});const gps=`${Number(b.lat).toFixed(6)}, ${Number(b.lng).toFixed(6)} (±${Math.round(Number(b.accuracy||0))}m)`;if(await ensurePg()){await pool.query('UPDATE technicians SET gps=$1,gps_lat=$2,gps_lng=$3,gps_accuracy=$4,last_update=NOW(),status=CASE WHEN status=\'Offline\' THEN \'On Duty\' ELSE status END WHERE id=$5',[gps,b.lat,b.lng,b.accuracy||null,b.tech_id])}else{const db=readLocal();const t=db.technicians.find(x=>x.id===b.tech_id);if(t){t.gps=gps;t.gps_lat=b.lat;t.gps_lng=b.lng;t.gps_accuracy=b.accuracy||null;t.last_update=new Date().toISOString();if(t.status==='Offline')t.status='On Duty';writeLocal(db)}}return json(res,200,{ok:true,gps})}

    if(pathname==='/api/settings' && req.method==='PUT'){const b=await body(req);if(await ensurePg()){for(const [k,v] of Object.entries(b))await pool.query('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',[k,String(v)])}else{const db=readLocal();db.settings={...db.settings,...b};writeLocal(db)}return json(res,200,{ok:true,settings:b})}
    if(pathname==='/api/export' && req.method==='GET') return json(res,200,await bootstrap());
    return notFound(res);
  }catch(e){console.error(e);return json(res,500,{error:e.message||'Server error'});}
}

module.exports = { routeApi };
