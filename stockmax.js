// StockMax — protótipo interativo responsivo (p5.js). Cole no editor.p5js.org e clique em ▶.
// Contas de demonstração (com estoque de exemplo) continuam funcionando; contas novas começam com estoque zerado.
const C={bg:'#ffffff',sf:'#faf7ee',acc:'#ffc933',acd:'#f2b705',ink:'#1c1c1e',mut:'#6e6e73',line:'#e8e6df',ok:'#1f9d62',warn:'#c77700',bad:'#d93025'};
const USERS=[{email:'admin@stockmax.com',pw:'admin123',name:'Admin',role:'Admin',demo:1},{email:'operador@stockmax.com',pw:'op123',name:'Operador',role:'Operador',demo:1}];
const WS={demo:{
  SUPS:[{id:1,nome:'TechParts Ltda',doc:'12.345.678/0001-90',tel:'(11) 3456-7890',mail:'vendas@techparts.com'},{id:2,nome:'Distribuidora Alfa',doc:'98.765.432/0001-10',tel:'(19) 3222-1100',mail:'contato@alfa.com'},{id:3,nome:'Casa do Cabo ME',doc:'045.678.912-33',tel:'(11) 99876-5432',mail:'cabos@casa.com'}],
  P:[{sku:'TEC-001',nome:'Teclado Mecânico',sup:1,qty:24,min:10,custo:180,ativo:true},{sku:'MOU-002',nome:'Mouse Sem Fio',sup:1,qty:6,min:10,custo:60,ativo:true},{sku:'MON-003',nome:'Monitor 24"',sup:2,qty:0,min:5,custo:620,ativo:true},{sku:'CAB-004',nome:'Cabo HDMI 2m',sup:3,qty:60,min:20,custo:12,ativo:true},{sku:'HUB-005',nome:'Hub USB-C',sup:3,qty:4,min:8,custo:75,ativo:true}],
  LOG:[{t:'20/10 09:12',sku:'MON-003',tipo:'Saída',qty:5,motivo:'Venda pedido #1042',user:'Operador'},{t:'20/10 08:40',sku:'TEC-001',tipo:'Entrada',qty:20,motivo:'Compra NF 8831',user:'Admin'},{t:'19/10 17:05',sku:'MOU-002',tipo:'Saída',qty:4,motivo:'Venda balcão',user:'Operador'}]}};
let P=[],LOG=[],SUPS=[];
let scr='login',mode='in',user=null,modal=null,hits=[],F={},foc=null,err='',toast='',toastT=0,toastC=C.ok,flt='Todos',sel=0,mtype='Entrada';
let menu=false,sy=0,ch=0,oy=0,M=false,x0=0,cw=0,navW=0,topH=0,botH=0,hi,ds=null,ly=0,drag=false;

function setup(){const c=createCanvas(windowWidth,windowHeight);c.elt.style.touchAction='none';document.body.style.cssText='margin:0;overflow:hidden';textFont('Helvetica');
  // campo invisível: faz o teclado do celular abrir e dá suporte a apagar, colar e selecionar
  hi=createInput('');hi.elt.style.cssText='position:fixed;left:0;top:0;width:8px;height:8px;opacity:0;font-size:16px;border:0;padding:0;pointer-events:none';
  hi.elt.maxLength=40;hi.elt.autocomplete='off';hi.elt.addEventListener('keydown',keyNav)}
function windowResized(){resizeCanvas(windowWidth,windowHeight)}

const inb=(x,y,w,h,o=oy)=>mouseX>x&&mouseX<x+w&&mouseY+o>y&&mouseY+o<y+h;
const R=(x,y,w,h,c,r=8,s)=>{fill(c);s?stroke(s):noStroke();rect(x,y,w,h,r)};
const T=(s,x,y,z=14,c=C.ink,a=LEFT,b=false)=>{noStroke();fill(c);textSize(z);textAlign(a,CENTER);textStyle(b?BOLD:NORMAL);text(s,x,y)};
const money=v=>'R$ '+v.toLocaleString('pt-BR',{minimumFractionDigits:2});
const now=()=>{const d=new Date();return nf(d.getDate(),2)+'/'+nf(d.getMonth()+1,2)+' '+nf(d.getHours(),2)+':'+nf(d.getMinutes(),2)};
const say=(m,c=C.ok)=>{toast=m;toastC=c;toastT=200};
const nm=s=>(P.find(p=>p.sku===s)||{nome:s}).nome;
const st=p=>!p.ativo?['Inativo',C.mut]:p.qty===0?['Esgotado',C.bad]:p.qty<=p.min?['Crítico',C.warn]:['OK',C.ok];
const cap=()=>P.filter(p=>p.ativo).reduce((s,p)=>s+p.qty*p.custo,0);
const TC={Entrada:C.ok,Saída:C.bad,Ajuste:C.warn};
const K5=['dash','prod','hist','forn','flow'];
const go=k=>{scr=k;sy=0;menu=false};

function btn(l,x,y,w,h,fn,o={}){const hv=inb(x,y,w,h)&&!o.off;R(x,y,w,h,o.off?'#efede6':hv?(o.hc||C.acd):(o.c||C.acc),10,o.off?null:o.s);T(l,x+w/2,y+h/2,o.z||14,o.off?'#a8a69d':(o.tc||C.ink),CENTER,true);if(!o.off)hits.push({x,y,w,h,fn,o:oy})}
function ff(id){foc=id;hi.value(F[id]||'');hi.elt.type=id==='pw'?'password':'text';hi.elt.inputMode=['qty','min','custo'].includes(id)?'decimal':'text';hi.elt.focus()}
function field(id,l,x,y,w){const f=foc===id,v=F[id]||'',s=id==='pw'?'•'.repeat(v.length):v;T(l,x,y,12,C.mut);R(x,y+14,w,40,'#fff',10,f?C.acd:C.line);T(s,x+12,y+34,15);
  if(f&&frameCount%60<30){stroke(C.ink);line(x+13+textWidth(s),y+25,x+13+textWidth(s),y+43)}
  hits.push({x,y:y+14,w,h:40,fn:()=>ff(id),o:oy});if(v){T('×',x+w-20,y+33,20,C.mut,CENTER);hits.push({x:x+w-38,y:y+14,w:38,h:40,fn:()=>{F[id]='';ff(id)},o:oy})}}
function pill(s,x,y,c){textSize(11);textStyle(BOLD);const w=textWidth(s)+18,k=color(c);k.setAlpha(45);R(x,y-10,w,20,k,10);T(s,x+9,y,11,c,LEFT,true);return w}
function head(t,s){T(t,x0,34,26,C.ink,LEFT,true);T(s,x0,62,13,C.mut)}
function listPanel(t,y,a,rh,fn,em){const h=56+Math.max(a.length,1)*rh;R(x0,y,cw,h,C.sf,16,C.line);T(t,x0+16,y+28,16,C.ink,LEFT,true);
  if(!a.length)T(em,x0+16,y+56+rh/2,13,C.mut);a.forEach((p,i)=>{const yy=y+56+i*rh;stroke(C.line);line(x0+12,yy,x0+cw-12,yy);fn(p,x0,yy,i)});return y+h+16}
function textPanel(t,y,a){R(x0,y,cw,52+a.length*28,C.sf,16,C.line);T(t,x0+16,y+28,16,C.ink,LEFT,true);a.forEach((s,i)=>T('• '+s,x0+16,y+60+i*28,13));return y+68+a.length*28}

function draw(){background(C.bg);hits=[];M=width<760;navW=M?0:220;topH=M?56:0;botH=0;
  const vw=width-navW,pad=M?14:32;cw=min(vw-2*pad,920);x0=navW+(vw-cw)/2;
  if(foc&&document.activeElement===hi.elt)F[foc]=hi.value();
  if(scr==='login'){oy=0;login()}else{
    sy=constrain(sy,0,max(0,ch+30-(height-topH-botH)));push();translate(0,topH-sy);oy=sy-topH;
    ch=({dash,prod,hist,forn,flow})[scr]();pop();oy=0;chrome()}
  if(menu&&M&&scr!=='login')drawer();
  if(modal){modalUI()}
  if(toastT>0){toastT--;textSize(14);const w=min(textWidth(toast)+56,width-24),x=(width-w)/2,y=height-botH-64;R(x,y,w,44,C.ink,12);R(x,y,6,44,toastC,3);T(toast,x+22,y+22,13,'#fff')}
  cursor(hits.some(h=>inb(h.x,h.y,h.w,h.h,h.o))?HAND:ARROW)}

/* ---------- LOGIN (30% amarelo / 70% branco) ---------- */
function login(){const lw=M?width:width*.3,lh=M?height*.3:height;R(0,0,lw,lh,C.acc,0);
  if(M){T('StockMax',20,lh/2-14,28,C.ink,LEFT,true);T('Controle de estoque simples e seguro',20,lh/2+18,13)}
  else{T('StockMax',32,60,30,C.ink,LEFT,true);T('Controle de estoque',32,height*.3,24,C.ink,LEFT,true);T('simples e seguro.',32,height*.3+32,24,C.ink,LEFT,true);
    if(lw>=300)for(let i=0;i<3;i++){R(40+i*88,height-190-i*34,76,150+i*34,C.acc,10,C.ink);for(let j=0;j<2+i;j++)R(50+i*88,height-176-i*34+j*36,56,24,'#fff',5)}}
  const aw=M?width:width-lw,fw=min(aw-48,340),fx=lw*(M?0:1)+(aw-fw)/2,fy=M?lh+18:max(24,height/2-230),up=mode==='up',n=up?3:2;
  T(up?'Criar conta':'Entrar',fx,fy+14,28,C.ink,LEFT,true);T(up?'Comece com o estoque zerado.':'Acesse o seu painel.',fx,fy+44,13,C.mut);
  let y=fy+64;if(up){field('nome','Nome',fx,y,fw);y+=72}field('email','E-mail',fx,y,fw);field('pw','Senha',fx,y+72,fw);y+=144;
  T(err,fx,y+4,12,C.bad);btn(up?'Criar conta':'Entrar',fx,y+16,fw,46,up?doReg:doLogin);
  btn(up?'Já tenho conta':'Criar conta nova',fx,y+72,fw,40,()=>{mode=up?'in':'up';err='';F={};ff(mode==='up'?'nome':'email')},{c:'#fff',s:C.line,hc:C.sf})}
function enter(u){user=u;const k=u.demo?'demo':u.email;WS[k]=WS[k]||{P:[],LOG:[],SUPS:[]};({P,LOG,SUPS}=WS[k]);err='';F={};foc=null;hi.value('');hi.elt.blur();go('dash');say('Bem-vindo, '+u.name+'!')}
function doLogin(){const u=USERS.find(u=>u.email===(F.email||'').trim().toLowerCase()&&u.pw===F.pw);u?enter(u):err='E-mail ou senha inválidos.'}
function doReg(){const e=(F.email||'').trim().toLowerCase(),n=(F.nome||'').trim();
  if(!n||!e.includes('@')||(F.pw||'').length<6)err='Informe nome, e-mail válido e senha (mín. 6).';
  else if(USERS.some(u=>u.email===e))err='Este e-mail já está cadastrado.';else{const u={email:e,pw:F.pw,name:n,role:'Admin'};USERS.push(u);enter(u)}}
function logout(){menu=false;user=null;scr='login';mode='in';F={};modal=null;ff('email')}

/* ---------- MENU ---------- */
function blk(x,y,w,h){hits.push({x,y,w,h,fn:()=>{},o:0})}
function chrome(){const k5=K5;
  if(!M){R(0,0,navW,height,C.acc,0);blk(0,0,navW,height);T('StockMax',24,40,24,C.ink,LEFT,true);
    ['Painel','Produtos','Movimentações','Fornecedores','Fluxo do app'].forEach((l,i)=>{const y=90+i*46,on=scr===k5[i];R(12,y,navW-24,38,on?C.ink:C.acc,10);T(l,32,y+19,14,on?'#fff':C.ink,LEFT,on);hits.push({x:12,y,w:navW-24,h:38,o:0,fn:()=>go(k5[i])})});
    R(12,height-100,navW-24,84,'#ffe08a',12);T(user.name,26,height-78,14,C.ink,LEFT,true);T(user.role,26,height-58,11);btn('Sair',navW-84,height-72,60,32,logout,{c:C.ink,tc:'#fff',hc:'#333',z:12})}
  else{R(0,0,width,topH,C.acc,0);blk(0,0,width,topH);
    btn('',4,6,44,44,()=>menu=true,{c:C.acc,hc:C.acd});[18,26,34].forEach(y=>R(14,y,24,3,C.ink,2));
    T('StockMax',58,28,20,C.ink,LEFT,true);T(user.name,width-14,28,12,C.ink,RIGHT)}}

function drawer(){fill(0,140);noStroke();rect(0,0,width,height);hits=[];oy=0;const dw=min(300,width*.8);
  hits.push({x:0,y:0,w:width,h:height,o:0,fn:()=>menu=false});
  R(0,0,dw,height,C.acc,0);hits.push({x:0,y:0,w:dw,h:height,o:0,fn:()=>{}});
  T('StockMax',24,40,24,C.ink,LEFT,true);T('×',dw-32,38,30,C.ink,CENTER);hits.push({x:dw-58,y:10,w:52,h:52,o:0,fn:()=>menu=false});
  ['Painel','Produtos','Movimentações','Fornecedores','Fluxo do app'].forEach((l,i)=>{const y=90+i*52,on=scr===K5[i];R(14,y,dw-28,44,on?C.ink:'#ffd966',12);T(l,34,y+22,15,on?'#fff':C.ink,LEFT,true);hits.push({x:14,y,w:dw-28,h:44,o:0,fn:()=>go(K5[i])})});
  R(14,height-104,dw-28,88,'#ffe08a',14);T(user.name,28,height-80,14,C.ink,LEFT,true);T(user.role,28,height-60,11);btn('Sair',dw-90,height-80,64,36,logout,{c:C.ink,tc:'#fff',hc:'#333',z:12})}

/* ---------- TELAS ---------- */
function dash(){head('Painel','Visão em tempo real do estoque');let y=84;
  const act=P.filter(p=>p.ativo),crit=act.filter(p=>p.qty>0&&p.qty<=p.min),out=act.filter(p=>p.qty===0),cols=M?1:3,w=(cw-(cols-1)*14)/cols;
  [['Capital investido',money(cap()),C.acc],['Estoque crítico',crit.length+' produtos',C.warn],['Esgotados',out.length+' produtos',C.bad]].forEach(([l,v,c],i)=>{
    const x=x0+(i%cols)*(w+14),yy=y+floor(i/cols)*102;R(x,yy,w,88,i?C.sf:C.acc,16,i?C.line:null);if(i)R(x,yy+16,5,56,c,3);T(l,x+22,yy+26,13,i?C.mut:C.ink);T(v,x+22,yy+58,26,C.ink,LEFT,true)});
  y+=ceil(3/cols)*102+8;
  y=listPanel('Produtos em alerta',y,act.filter(p=>p.qty<=p.min),64,(p,x,yy)=>{const[s,c]=st(p);T(p.nome,x+16,yy+22,14,C.ink,LEFT,true);const w=pill(s+' '+p.qty,x+16,yy+46,c);T(p.sku+' · mín. '+p.min,x+16+w+8,yy+46,11,C.mut);btn('Repor',x+cw-88,yy+14,72,34,()=>openMov(P.indexOf(p)),{z:12})},'Nenhum produto em alerta.');
  return listPanel('Últimas movimentações',y,LOG.slice(0,6),64,(l,x,yy)=>{T(nm(l.sku),x+16,yy+22,14,C.ink,LEFT,true);const w=pill(l.tipo+' '+l.qty,x+16,yy+46,TC[l.tipo]);T(l.user+' · '+l.t,x+16+w+8,yy+46,11,C.mut)},'Nenhuma movimentação ainda.')}

function prod(){head('Produtos','SKU, fornecedor e estoque mínimo');const adm=user.role==='Admin';let y=84;
  btn('+ Novo produto',x0,y,160,40,openProd,{off:!adm});if(!adm)T('Somente Admin cria e desativa',x0+172,y+20,11,C.mut);y+=56;
  return listPanel('Produtos ('+P.length+')',y,P,116,(p,x,yy)=>{const[s,c]=st(p),a=p.ativo?C.ink:C.mut,f=SUPS.find(f=>f.id===p.sup);
    T(p.nome,x+16,yy+24,15,a,LEFT,true);const w=pill(s,x+16,yy+50,c);T(p.sku+' · '+(f?f.nome:'Sem fornecedor'),x+16+w+8,yy+50,11,C.mut);T('Qtd '+p.qty+' · mín. '+p.min+' · custo '+money(p.custo),x+16,yy+72,12,C.mut);
    btn('Mov.',x+16,yy+82,64,28,()=>openMov(P.indexOf(p)),{off:!p.ativo,z:12});
    btn(p.ativo?'Desativar':'Ativar',x+88,yy+82,96,28,()=>{p.ativo=!p.ativo;say(p.ativo?'Produto reativado.':'Produto desativado (soft delete: is_active = false).',C.warn)},{off:!adm,c:'#fff',s:C.line,hc:C.sf,z:12})},'Nenhum produto cadastrado ainda.')}

function hist(){head('Movimentações','Trilha de auditoria: quem, o quê, quando e por quê');let y=84;
  ['Todos','Entrada','Saída','Ajuste'].forEach((f,i)=>{const w=(cw-18)/4;btn(f,x0+i*(w+6),y,w,34,()=>flt=f,{c:flt===f?C.acc:'#fff',s:C.line,hc:flt===f?C.acd:C.sf,z:12})});y+=46;
  btn('+ Nova movimentação',x0,y,200,40,()=>openMov(0),{off:!P.some(p=>p.ativo)});y+=56;
  return listPanel('Registros',y,LOG.filter(l=>flt==='Todos'||l.tipo===flt),84,(l,x,yy)=>{T(nm(l.sku),x+16,yy+24,14,C.ink,LEFT,true);const w=pill(l.tipo+' '+l.qty,x+16,yy+50,TC[l.tipo]);T(l.user+' · '+l.t,x+16+w+8,yy+50,11,C.mut);T(l.motivo,x+16,yy+71,12,C.mut)},'Nenhum registro.')}

function forn(){head('Fornecedores','Cadastro simplificado vinculado aos produtos');let y=84;
  btn('+ Novo fornecedor',x0,y,180,40,openSup,{off:user.role!=='Admin'});y+=56;
  return listPanel('Fornecedores ('+SUPS.length+')',y,SUPS,84,(f,x,yy)=>{T(f.nome,x+16,yy+24,14,C.ink,LEFT,true);const w=pill(P.filter(p=>p.sup===f.id).length+' produtos',x+16,yy+50,C.warn);T(f.doc+' · '+f.tel,x+16+w+8,yy+50,11,C.mut);T(f.mail,x+16,yy+71,12,C.mut)},'Nenhum fornecedor cadastrado ainda.')}

function flow(){head('Fluxo do app','Toque em uma etapa para abrir a tela');let y=84;const nw=min(cw,360),nx=x0+(cw-nw)/2,mx=nx+nw/2;
  [['login','Login','e-mail e senha (ou criar conta)'],['dash','Painel','alertas e capital investido'],['prod','Produtos','cadastro e soft delete'],['mov','Nova movimentação','tipo, quantidade e motivo'],['hist','Histórico','trilha de auditoria'],['forn','Fornecedores','vínculo com produtos']].forEach(([k,t,s],i)=>{
    const on=scr===k||(k==='mov'&&modal==='mov');R(nx,y,nw,58,on?C.acc:C.sf,14,C.line);T(t,mx,y+22,14,C.ink,CENTER,true);T(s,mx,y+42,11,C.mut,CENTER);
    if(k!=='login')hits.push({x:nx,y,w:nw,h:58,o:oy,fn:()=>{if(k==='mov'){go('hist');openMov(0)}else go(k)}});
    if(i<5){stroke(C.acd);strokeWeight(2);line(mx,y+58,mx,y+70);strokeWeight(1);fill(C.acd);noStroke();triangle(mx,y+76,mx-6,y+66,mx+6,y+66)}y+=76});
  y=textPanel('Regras de negócio',y+6,['Login obrigatório antes de qualquer tela','Motivo obrigatório em toda movimentação','Saída não pode exceder o saldo','Operador não cria nem desativa produtos','Desativar = soft delete (is_active = false)','Saldo ≤ mínimo → alerta no painel']);
  return textPanel('Arquitetura serverless',y,['Navegador (desktop / mobile)','Next.js + API Routes na Vercel (NextAuth)','Prisma / Drizzle ORM','PostgreSQL na Neon (transações atômicas)'])}

/* ---------- MODAIS ---------- */
const close=()=>{modal=null;foc=null;hi.elt.blur()};
function openProd(){modal='prod';F={};err='';sel=0;ff('sku')}
function openSup(){modal='sup';F={};err='';ff('sn')}
function openMov(i){if(!P.length){say('Cadastre um produto antes de movimentar.',C.warn);return}modal='mov';sel=i;mtype='Entrada';F={};err='';ff('qty')}
function okMov(){const p=P[sel],q=parseInt(F.qty),m=(F.motivo||'').trim();
  if(isNaN(q)||q<0||(mtype!=='Ajuste'&&q===0))err='Informe uma quantidade válida.';
  else if(!m)err='O motivo é obrigatório para toda movimentação.';
  else if(mtype==='Saída'&&q>p.qty)err='Saldo insuficiente: há '+p.qty+' em estoque.';
  else{p.qty=mtype==='Entrada'?p.qty+q:mtype==='Saída'?p.qty-q:q;LOG.unshift({t:now(),sku:p.sku,tipo:mtype,qty:q,motivo:m,user:user.name});close();
    p.qty<=p.min?say('Registrado. Alerta: '+p.nome+' no estoque mínimo!',C.warn):say('Movimentação registrada por '+user.name+'.')}}
function okProd(){const s=(F.sku||'').trim().toUpperCase(),n=(F.nome||'').trim();
  if(!s||!n)err='SKU e nome são obrigatórios.';else if(P.some(p=>p.sku===s))err='Já existe um produto com este SKU.';
  else{P.push({sku:s,nome:n,sup:SUPS.length?SUPS[sel].id:null,qty:0,min:+F.min||0,custo:+F.custo||0,ativo:true});close();say('Produto cadastrado.')}}
function okSup(){const n=(F.sn||'').trim();if(!n)err='Informe o nome do fornecedor.';else{SUPS.push({id:Date.now(),nome:n,doc:F.sd||'—',tel:F.st||'—',mail:F.sm||'—'});close();say('Fornecedor cadastrado.')}}
function modalUI(){fill(0,150);noStroke();rect(0,0,width,height);hits=[];oy=0;const w=min(width-24,420),x=(width-w)/2,mh=modal==='mov'?420:430,y=M?10:max(10,(height-mh)/2),iw=w-48,sec=(l,fn)=>btn(l,x+24,y+mh-70,w*.36,44,close,{c:'#fff',s:C.line,hc:C.sf});
  R(x,y,w,mh,'#fff',18);R(x,y,w,6,C.acc,3);
  if(modal==='mov'){const p=P[sel];T('Registrar movimentação',x+24,y+36,20,C.ink,LEFT,true);
    btn('◀',x+24,y+60,40,44,()=>sel=(sel+P.length-1)%P.length,{c:C.sf,s:C.line});R(x+70,y+60,w-140,44,C.sf,10);T(p.nome,x+w/2,y+74,14,C.ink,CENTER,true);T('Saldo: '+p.qty+' · mín. '+p.min,x+w/2,y+93,11,C.mut,CENTER);
    btn('▶',x+w-64,y+60,40,44,()=>sel=(sel+1)%P.length,{c:C.sf,s:C.line});
    const bw=(iw-16)/3;['Entrada','Saída','Ajuste'].forEach((t,i)=>btn(t,x+24+i*(bw+8),y+120,bw,38,()=>mtype=t,{c:mtype===t?C.acc:'#fff',s:C.line,hc:mtype===t?C.acd:C.sf,z:13}));
    field('qty',mtype==='Ajuste'?'Novo saldo':'Quantidade',x+24,y+170,iw);field('motivo','Motivo (obrigatório)',x+24,y+240,iw);T(err,x+24,y+318,12,C.bad);
    btn('Cancelar',x+24,y+346,iw*.38,46,close,{c:'#fff',s:C.line,hc:C.sf});btn('Confirmar',x+24+iw*.38+10,y+346,iw*.62-10,46,okMov)}
  else if(modal==='prod'){T('Novo produto',x+24,y+36,20,C.ink,LEFT,true);field('sku','SKU',x+24,y+54,iw);field('nome','Nome do produto',x+24,y+124,iw);field('min','Estoque mínimo',x+24,y+194,iw/2-6);field('custo','Custo (R$)',x+24+iw/2+6,y+194,iw/2-6);
    T('Fornecedor',x+24,y+274,12,C.mut);if(!SUPS.length)T('Nenhum cadastrado (opcional).',x+24,y+306,12,C.mut);
    SUPS.slice(0,3).forEach((f,i)=>{const bw=(iw-16)/3;btn(f.nome.split(' ')[0],x+24+i*(bw+8),y+288,bw,34,()=>sel=i,{c:sel===i?C.acc:'#fff',s:C.line,hc:sel===i?C.acd:C.sf,z:12})});
    T(err,x+24,y+344,12,C.bad);btn('Cancelar',x+24,y+362,iw*.38,46,close,{c:'#fff',s:C.line,hc:C.sf});btn('Salvar',x+24+iw*.38+10,y+362,iw*.62-10,46,okProd)}
  else{T('Novo fornecedor',x+24,y+36,20,C.ink,LEFT,true);field('sn','Razão social',x+24,y+54,iw);field('sd','CNPJ/CPF',x+24,y+124,iw);field('st','Telefone',x+24,y+194,iw);field('sm','E-mail',x+24,y+264,iw);
    T(err,x+24,y+344,12,C.bad);btn('Cancelar',x+24,y+362,iw*.38,46,close,{c:'#fff',s:C.line,hc:C.sf});btn('Salvar',x+24+iw*.38+10,y+362,iw*.62-10,46,okSup)}}

/* ---------- ENTRADA (toque/mouse/teclado) ---------- */
function mousePressed(){ds={x:mouseX,y:mouseY};drag=false;ly=mouseY;return false}
function mouseDragged(){if(ds&&dist(mouseX,mouseY,ds.x,ds.y)>8)drag=true;if(drag&&!modal&&!menu)sy-=mouseY-ly;ly=mouseY;return false}
function mouseReleased(){if(!ds)return;const d=drag;ds=null;if(d)return false;
  const h=[...hits].reverse().find(h=>inb(h.x,h.y,h.w,h.h,h.o));foc=null;hi.elt.blur();if(h)h.fn();return false}
function mouseWheel(e){if(!modal&&!menu)sy+=e.delta;return false}
function keyNav(e){if(!foc)return;
  if(e.key==='Tab'){const o=modal==='mov'?['qty','motivo']:modal==='prod'?['sku','nome','min','custo']:modal==='sup'?['sn','sd','st','sm']:mode==='up'?['nome','email','pw']:['email','pw'];ff(o[(o.indexOf(foc)+1)%o.length])}
  else if(e.key==='Enter'){modal==='mov'?okMov():modal==='prod'?okProd():modal==='sup'?okSup():mode==='up'?doReg():doLogin()}else return;
  e.preventDefault();e.stopPropagation()}

