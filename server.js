/**
 * NTX Construction Group — Backend Server
 * Node.js · Zero dependencies · Cloudinary image uploads
 */

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');
const https = require('https');
const crypto= require('crypto');

const PORT             = process.env.PORT            || 8080;
const DB_FILE          = path.join(__dirname, 'database.json');
const CLOUDINARY_CLOUD = process.env.CLOUDINARY_CLOUD  || 'dxymalfcn';
const CLOUDINARY_KEY   = process.env.CLOUDINARY_KEY    || '627537748819494';
const CLOUDINARY_SECRET= process.env.CLOUDINARY_SECRET || 'gA2CgO8mJpPCJEkGlQLoIvr6NVs';

const MIME = {
  '.html':'text/html','.css':'text/css','.js':'application/javascript',
  '.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml',
  '.ico':'image/x-icon','.webp':'image/webp','.pdf':'application/pdf',
  '.woff':'font/woff','.woff2':'font/woff2',
};

// ── DATABASE ──
const DEFAULT_DB = {
  leads:[],
  services:[
    {id:1,name:'Home Renovation / Remodeling',category:'residential',description:'Full-scale home remodels tailored to your vision.',icon:'fa-home',active:true,order:1},
    {id:2,name:'Kitchen Remodel',category:'residential',description:'Modern kitchen upgrades and full remodels.',icon:'fa-utensils',active:true,order:2},
    {id:3,name:'Bathroom Remodel',category:'residential',description:'Luxury bathroom renovations.',icon:'fa-bath',active:true,order:3},
    {id:4,name:'Foundation Repair',category:'residential',description:'Expert foundation diagnostics and repair.',icon:'fa-layer-group',active:true,order:4},
    {id:5,name:'Commercial Build-Out',category:'commercial',description:'Tenant finish-outs and commercial interiors.',icon:'fa-building',active:true,order:5},
    {id:6,name:'Roofing',category:'residential',description:'Roofing installation, repair, and replacement.',icon:'fa-house-damage',active:true,order:6},
    {id:7,name:'HVAC Services',category:'residential',description:'Heating, ventilation, and air conditioning.',icon:'fa-wind',active:true,order:7},
    {id:8,name:'Solar Power',category:'residential',description:'Solar panel installation for homes and businesses.',icon:'fa-solar-panel',active:true,order:8},
    {id:9,name:'Maintenance Plans',category:'commercial',description:'Quarterly and annual property maintenance contracts.',icon:'fa-tools',active:true,order:9},
  ],
  projects:[
    {id:1,title:'Interior Renovation',category:'residential',location:'Plano, TX',year:2024,featured:true,active:true,description:'Complete interior renovation.',image:'',order:1},
    {id:2,title:'Kitchen Remodel',category:'residential',location:'Dallas, TX',year:2024,featured:false,active:true,description:'Modern kitchen transformation.',image:'',order:2},
    {id:3,title:'Landscaping & Yard',category:'exterior',location:'Frisco, TX',year:2023,featured:false,active:true,description:'Full landscaping project.',image:'',order:3},
    {id:4,title:'Concrete Patio',category:'concrete',location:'Irving, TX',year:2024,featured:true,active:true,description:'Stamped concrete patio.',image:'',order:4},
    {id:5,title:'Bathroom Remodel',category:'residential',location:'Fort Worth, TX',year:2024,featured:false,active:true,description:'Luxury bathroom renovation.',image:'',order:5},
    {id:6,title:'Fence Installation',category:'exterior',location:'Arlington, TX',year:2023,featured:false,active:true,description:'Cedar privacy fence.',image:'',order:6},
    {id:7,title:'Foundation Repair',category:'concrete',location:'Dallas, TX',year:2024,featured:true,active:true,description:'Pier and beam foundation fix.',image:'',order:7},
    {id:8,title:'Commercial Build-Out',category:'commercial',location:'Plano, TX',year:2024,featured:true,active:true,description:'Office tenant finish-out.',image:'',order:8},
  ],
  reviews:[
    {id:1,name:'Sarah Thompson',title:'Homeowner, Frisco TX',text:'NTX completely transformed our home. Professional and kept us informed throughout. Highly recommend!',rating:5,type:'residential',verified:true,shown:true,order:1},
    {id:2,name:'Michael Ross',title:'Homeowner, Plano TX',text:'They handled our home renovation with such care. Communicative and kept everything clean. Delivered on time!',rating:5,type:'residential',verified:true,shown:true,order:2},
    {id:3,name:'David Hernandez',title:'Property Manager, Dallas TX',text:'Ahmed and his team are true professionals. My go-to contractor for all DFW properties.',rating:5,type:'commercial',verified:true,shown:true,order:3},
    {id:4,name:'Jennifer Martinez',title:'Business Owner, Fort Worth TX',text:'Our tenant finish-out was completed on budget and ahead of schedule. Very responsive team.',rating:5,type:'commercial',verified:true,shown:true,order:4},
    {id:5,name:'Robert Kim',title:'Homeowner, Frisco TX',text:'Kitchen and bathroom remodel came out exactly as we envisioned. Great craftsmanship, fair pricing.',rating:5,type:'residential',verified:true,shown:true,order:5},
    {id:6,name:'Lisa Thompson',title:'HOA Manager, Irving TX',text:"NTX handles our community's quarterly maintenance and they're fantastic. Always on time.",rating:5,type:'commercial',verified:true,shown:true,order:6},
  ],
  settings:{
    companyName:'NTX Construction Group',tagline:'Where Vision Comes To Life',
    phonePrimary:'(214) 892-7751',phoneSecondary:'(214) 606-3270',
    email:'info@ntxcgroup.com',website:'https://ntxcgroup.com',
    serviceArea:'Dallas · Fort Worth · Plano · Frisco · Irving · Arlington',
    heroHeadline:'Where Vision Comes To Life',heroSubtext:'Licensed & insured general contractor serving Dallas–Fort Worth.',
    facebook:'',instagram:'',linkedin:'',google:'',
    statProjects:'500+',statYears:'10+',statClients:'300+',statRating:'5.0',
  },
  admin:{username:'admin',password:'ntx2024'},
  _nextId:{leads:1,services:10,projects:9,reviews:7},
};

function loadDB(){
  if(!fs.existsSync(DB_FILE)){saveDB(DEFAULT_DB);return JSON.parse(JSON.stringify(DEFAULT_DB));}
  try{return JSON.parse(fs.readFileSync(DB_FILE,'utf8'));}
  catch(e){return JSON.parse(JSON.stringify(DEFAULT_DB));}
}
function saveDB(d){fs.writeFileSync(DB_FILE,JSON.stringify(d,null,2));}

// ── SESSIONS ──
const sessions=new Map();
function createSession(u){const t=Math.random().toString(36).slice(2)+Date.now().toString(36);sessions.set(t,{u,created:Date.now()});return t;}
function isValidSession(t){if(!t||!sessions.has(t))return false;const s=sessions.get(t);if(Date.now()-s.created>86400000){sessions.delete(t);return false;}return true;}
function getToken(req){const c=(req.headers.cookie||'').match(/ntx_session=([^;]+)/);if(c)return c[1];const a=req.headers.authorization||'';if(a.startsWith('Bearer '))return a.slice(7);return null;}

// ── CLOUDINARY UPLOAD ──
function uploadToCloudinary(fileBuffer, filename, folder){
  return new Promise((resolve,reject)=>{
    const ts  = Math.floor(Date.now()/1000);
    const pid = `${folder}/${Date.now()}_${path.basename(filename).replace(/[^a-z0-9._-]/gi,'_')}`;
    const sig = crypto.createHash('sha1').update(`folder=${folder}&public_id=${pid}&timestamp=${ts}${CLOUDINARY_SECRET}`).digest('hex');
    const boundary='----NTXBound'+Date.now();
    function field(name,val){return `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${val}\r\n`;}
    const ext=path.extname(filename).slice(1)||'jpg';
    const body=Buffer.concat([
      Buffer.from(field('api_key',CLOUDINARY_KEY)+field('timestamp',ts)+field('signature',sig)+field('folder',folder)+field('public_id',pid)),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/${ext}\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const r=https.request({hostname:'api.cloudinary.com',path:`/v1_1/${CLOUDINARY_CLOUD}/image/upload`,method:'POST',headers:{'Content-Type':`multipart/form-data; boundary=${boundary}`,'Content-Length':body.length}},(res)=>{
      const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{
        try{const d=JSON.parse(Buffer.concat(chunks).toString());if(d.secure_url)resolve(d.secure_url);else reject(new Error(d.error?.message||'Upload failed'));}
        catch(e){reject(e);}
      });
    });
    r.on('error',reject);r.write(body);r.end();
  });
}

// ── HELPERS ──
function json(res,code,data){
  res.writeHead(code,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,Cookie','Access-Control-Allow-Credentials':'true'});
  res.end(JSON.stringify(data));
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    const chunks=[];
    req.on('data',c=>chunks.push(c));
    req.on('end',()=>{
      const raw=Buffer.concat(chunks);const ct=req.headers['content-type']||'';
      if(ct.includes('application/json')){try{resolve({fields:JSON.parse(raw.toString()),files:{}});}catch(e){resolve({fields:{},files:{}}); }}
      else if(ct.includes('multipart/form-data')){resolve(parseMultipart(raw,ct));}
      else if(ct.includes('application/x-www-form-urlencoded')){const p=new URLSearchParams(raw.toString());const f={};p.forEach((v,k)=>{f[k]=v;});resolve({fields:f,files:{}});}
      else{resolve({fields:{},files:{}});}
    });
    req.on('error',reject);
  });
}
function parseMultipart(buffer,contentType){
  const bm=contentType.match(/boundary=(.+)/);if(!bm)return{fields:{},files:{}};
  const boundary='--'+bm[1].trim();const fields={},files={};
  const parts=buffer.toString('binary').split(boundary);
  for(const part of parts){
    if(!part||part.trim()===''||part.trim()==='--')continue;
    const[rawH,...bodyP]=part.split('\r\n\r\n');if(!rawH)continue;
    const body=bodyP.join('\r\n\r\n').replace(/\r\n$/,'');
    const nm=rawH.match(/name="([^"]+)"/);const fm=rawH.match(/filename="([^"]+)"/);
    if(!nm)continue;const name=nm[1];
    if(fm){const ctm=rawH.match(/Content-Type:\s*([^\r\n]+)/i);if(!files[name])files[name]=[];files[name].push({filename:fm[1],mimetype:ctm?ctm[1].trim():'application/octet-stream',buffer:Buffer.from(body,'binary')});}
    else{fields[name]=body;}
  }
  return{fields,files};
}
function nextId(db,key){if(!db._nextId)db._nextId={};if(!db._nextId[key])db._nextId[key]=1;return db._nextId[key]++;}
function serveStatic(res,fp){
  if(!fs.existsSync(fp)){res.writeHead(404);res.end('Not found');return;}
  const ext=path.extname(fp).toLowerCase();res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream'});
  fs.createReadStream(fp).pipe(res);
}

// ── SERVER ──
const server=http.createServer(async(req,res)=>{
  const parsed=url.parse(req.url,true);
  const pathname=parsed.pathname.replace(/\/+$/,'')||'/';
  const method=req.method.toUpperCase();

  if(method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,Cookie'});res.end();return;}

  // Static
  if(pathname==='/'||pathname==='/index.html'){serveStatic(res,path.join(__dirname,'index.html'));return;}
  if(pathname==='/admin'||pathname==='/admin.html'||pathname==='/admin-panel'){serveStatic(res,path.join(__dirname,'admin.html'));return;}
  if(!pathname.startsWith('/api')){const fp=path.join(__dirname,pathname);if(fs.existsSync(fp)&&fs.statSync(fp).isFile()){serveStatic(res,fp);return;}}

  // Login
  if(pathname==='/api/login'&&method==='POST'){
    const{fields}=await readBody(req);const db=loadDB();
    if(fields.username===db.admin.username&&fields.password===db.admin.password){
      const token=createSession(fields.username);
      res.writeHead(200,{'Content-Type':'application/json','Set-Cookie':`ntx_session=${token}; Path=/; HttpOnly; SameSite=Lax`,'Access-Control-Allow-Origin':'*'});
      res.end(JSON.stringify({success:true,token}));
    }else{json(res,401,{success:false,error:'Invalid username or password.'});}
    return;
  }
  if(pathname==='/api/logout'&&method==='POST'){const t=getToken(req);if(t)sessions.delete(t);res.writeHead(200,{'Content-Type':'application/json','Set-Cookie':'ntx_session=; Path=/; Max-Age=0'});res.end(JSON.stringify({success:true}));return;}

  // Public quote
  if(pathname==='/api/quote'&&method==='POST'){
    const{fields,files}=await readBody(req);
    const{name,email,phone,message,project_type,address,preferred_contact}=fields;
    if(!name||!email||!phone||!message){json(res,400,{success:false,error:'Name, email, phone and message are required.'});return;}
    const db=loadDB();const id=nextId(db,'leads');const attachments=[];
    for(const file of[...(files['attachments']||[]),...(files['files']||[])]){
      try{const u=await uploadToCloudinary(file.buffer,file.filename,'ntx/attachments');attachments.push({filename:file.filename,url:u});}
      catch(e){console.error('Attachment upload failed:',e.message);}
    }
    const lead={id,name,email,phone,message,project_type:project_type||'',address:address||'',preferred_contact:preferred_contact||'any',status:'new',admin_notes:'',attachments,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    db.leads.push(lead);saveDB(db);
    console.log(`[NEW LEAD] ${name} | ${email} | ${phone}`);
    json(res,201,{success:true,message:"Thank you! We've received your request and will contact you within 24 hours.",id});return;
  }

  // Public data
  if(pathname==='/api/services'&&method==='GET'){const db=loadDB();let l=db.services.filter(s=>s.active);const c=parsed.query.category;if(c)l=l.filter(s=>s.category===c);json(res,200,{success:true,data:l.sort((a,b)=>a.order-b.order)});return;}
  if(pathname==='/api/projects'&&method==='GET'){const db=loadDB();let l=db.projects.filter(p=>p.active);const c=parsed.query.category;if(c&&c!=='all')l=l.filter(p=>p.category===c);json(res,200,{success:true,data:l.sort((a,b)=>a.order-b.order)});return;}
  if(pathname==='/api/reviews'&&method==='GET'){const db=loadDB();json(res,200,{success:true,data:db.reviews.filter(r=>r.shown).sort((a,b)=>a.order-b.order)});return;}
  if(pathname==='/api/settings'&&method==='GET'){const db=loadDB();json(res,200,{success:true,data:db.settings});return;}

  // Admin routes
  if(pathname.startsWith('/api/admin')){
    if(!isValidSession(getToken(req))){json(res,401,{success:false,error:'Unauthorized. Please log in.'});return;}
    const db=loadDB();

    if(pathname==='/api/admin/stats'&&method==='GET'){const l=db.leads;json(res,200,{success:true,data:{total_leads:l.length,new_leads:l.filter(x=>x.status==='new').length,in_review:l.filter(x=>x.status==='in_review').length,replied:l.filter(x=>x.status==='replied').length,won:l.filter(x=>x.status==='won').length,closed:l.filter(x=>x.status==='closed').length,total_services:db.services.length,total_projects:db.projects.length,total_reviews:db.reviews.length}});return;}

    if(pathname==='/api/admin/leads'&&method==='GET'){let l=[...db.leads].reverse();if(parsed.query.status)l=l.filter(x=>x.status===parsed.query.status);json(res,200,{success:true,count:l.length,data:l});return;}
    const leadM=pathname.match(/^\/api\/admin\/leads\/(\d+)$/);
    if(leadM){const id=parseInt(leadM[1]);const lead=db.leads.find(l=>l.id===id);if(!lead){json(res,404,{success:false,error:'Lead not found.'});return;}
      if(method==='GET'){json(res,200,{success:true,data:lead});return;}
      if(method==='PATCH'||method==='PUT'){const{fields}=await readBody(req);if(fields.status)lead.status=fields.status;if(fields.admin_notes!==undefined)lead.admin_notes=fields.admin_notes;lead.updated_at=new Date().toISOString();saveDB(db);json(res,200,{success:true,data:lead});return;}
      if(method==='DELETE'){db.leads=db.leads.filter(l=>l.id!==id);saveDB(db);json(res,200,{success:true,message:'Lead deleted.'});return;}
    }

    // ── IMAGE UPLOAD endpoint ──
    if(pathname==='/api/admin/upload'&&method==='POST'){
      const{files,fields}=await readBody(req);
      const folder=fields.folder||'ntx/portfolio';
      const allFiles=[...(files['image']||[]),...(files['file']||[])];
      if(!allFiles.length){json(res,400,{success:false,error:'No file received.'});return;}
      try{
        const cloudUrl=await uploadToCloudinary(allFiles[0].buffer,allFiles[0].filename,folder);
        json(res,200,{success:true,url:cloudUrl});
      }catch(e){console.error('Upload error:',e.message);json(res,500,{success:false,error:'Upload failed: '+e.message});}
      return;
    }

    if(pathname==='/api/admin/services'&&method==='GET'){json(res,200,{success:true,data:db.services});return;}
    if(pathname==='/api/admin/services'&&method==='POST'){const{fields}=await readBody(req);const s={id:nextId(db,'services'),name:fields.name,category:fields.category||'residential',description:fields.description||'',icon:fields.icon||'',active:true,order:db.services.length+1};db.services.push(s);saveDB(db);json(res,201,{success:true,data:s});return;}
    const svcM=pathname.match(/^\/api\/admin\/services\/(\d+)$/);
    if(svcM){const id=parseInt(svcM[1]);const idx=db.services.findIndex(s=>s.id===id);if(idx===-1){json(res,404,{success:false,error:'Not found'});return;}if(method==='PATCH'||method==='PUT'){const{fields}=await readBody(req);Object.assign(db.services[idx],fields);saveDB(db);json(res,200,{success:true,data:db.services[idx]});return;}if(method==='DELETE'){db.services.splice(idx,1);saveDB(db);json(res,200,{success:true,message:'Deleted.'});return;}}

    if(pathname==='/api/admin/projects'&&method==='GET'){json(res,200,{success:true,data:db.projects});return;}
    if(pathname==='/api/admin/projects'&&method==='POST'){const{fields}=await readBody(req);const p={id:nextId(db,'projects'),title:fields.title,category:fields.category||'residential',description:fields.description||'',location:fields.location||'',year:parseInt(fields.year)||new Date().getFullYear(),featured:false,active:true,image:fields.image||'',order:db.projects.length+1};db.projects.push(p);saveDB(db);json(res,201,{success:true,data:p});return;}
    const projM=pathname.match(/^\/api\/admin\/projects\/(\d+)$/);
    if(projM){const id=parseInt(projM[1]);const idx=db.projects.findIndex(p=>p.id===id);if(idx===-1){json(res,404,{success:false,error:'Not found'});return;}if(method==='PATCH'||method==='PUT'){const{fields}=await readBody(req);Object.assign(db.projects[idx],fields);saveDB(db);json(res,200,{success:true,data:db.projects[idx]});return;}if(method==='DELETE'){db.projects.splice(idx,1);saveDB(db);json(res,200,{success:true,message:'Deleted.'});return;}}

    if(pathname==='/api/admin/reviews'&&method==='GET'){json(res,200,{success:true,data:db.reviews});return;}
    if(pathname==='/api/admin/reviews'&&method==='POST'){const{fields}=await readBody(req);const r={id:nextId(db,'reviews'),name:fields.name,title:fields.title||'',text:fields.text,rating:parseInt(fields.rating)||5,type:fields.type||'residential',verified:true,shown:true,order:db.reviews.length+1};db.reviews.push(r);saveDB(db);json(res,201,{success:true,data:r});return;}
    const revM=pathname.match(/^\/api\/admin\/reviews\/(\d+)$/);
    if(revM){const id=parseInt(revM[1]);const idx=db.reviews.findIndex(r=>r.id===id);if(idx===-1){json(res,404,{success:false,error:'Not found'});return;}if(method==='PATCH'||method==='PUT'){const{fields}=await readBody(req);Object.assign(db.reviews[idx],fields);saveDB(db);json(res,200,{success:true,data:db.reviews[idx]});return;}if(method==='DELETE'){db.reviews.splice(idx,1);saveDB(db);json(res,200,{success:true,message:'Deleted.'});return;}}

    if(pathname==='/api/admin/settings'){
      if(method==='GET'){json(res,200,{success:true,data:db.settings});return;}
      if(method==='PATCH'||method==='PUT'||method==='POST'){const{fields}=await readBody(req);Object.assign(db.settings,fields);saveDB(db);json(res,200,{success:true,data:db.settings});return;}
    }
    if(pathname==='/api/admin/change-password'&&method==='POST'){const{fields}=await readBody(req);if(!fields.newPassword||fields.newPassword.length<6){json(res,400,{success:false,error:'Password must be at least 6 characters.'});return;}db.admin.password=fields.newPassword;if(fields.username)db.admin.username=fields.username;saveDB(db);json(res,200,{success:true,message:'Credentials updated.'});return;}

    json(res,404,{success:false,error:'API endpoint not found.'});return;
  }

  res.writeHead(404,{'Content-Type':'text/plain'});res.end('404 Not Found');
});

server.listen(PORT,()=>{
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   NTX Construction Group — Server Running    ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Website  →  http://localhost:${PORT}           ║`);
  console.log(`║  Admin    →  http://localhost:${PORT}/admin      ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Images   →  Cloudinary (dxymalfcn)          ║');
  console.log('║  Login:      admin / ntx2024                 ║');
  console.log('╚══════════════════════════════════════════════╝\n');
});
