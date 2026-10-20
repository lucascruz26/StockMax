/* StockMax – protótipo navegável em JavaScript puro (sem frameworks).
   Contas de teste: admin@stockmax.com / admin123  |  op@stockmax.com / op123
   Protótipo: dados em memória. Em produção: Next.js + Prisma + PostgreSQL,
   NextAuth/Clerk, senhas com bcrypt/argon2 e transações atômicas. */
(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = n => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const dt = d => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const nid = a => Math.max(0, ...a.map(x => x.id)) + 1;
  const now = Date.now();

  // ---------- Dados (4 módulos) ----------
  const db = {
    users: [
      { id: 1, name: 'José Roberto', email: 'admin@stockmax.com', pass: 'admin123', role: 'ADMIN' },
      { id: 2, name: 'Lucas Ermenegildo', email: 'op@stockmax.com', pass: 'op123', role: 'OPERADOR' }
    ],
    suppliers: [
      { id: 1, name: 'Distribuidora Alfa Ltda', doc: '12.345.678/0001-90', contact: '(43) 3333-1000', addr: 'Londrina, PR' },
      { id: 2, name: 'Bebidas Beta S.A.', doc: '98.765.432/0001-10', contact: 'vendas@beta.com', addr: 'Curitiba, PR' }
    ],
    products: [
      { id: 1, sku: 'ARR-001', name: 'Arroz 5kg', cat: 'Grãos', unit: 'un', cost: 18, price: 27.9, qty: 40, min: 15, sup: 1, active: true },
      { id: 2, sku: 'FEI-002', name: 'Feijão 1kg', cat: 'Grãos', unit: 'un', cost: 5.5, price: 8.9, qty: 8, min: 12, sup: 1, active: true },
      { id: 3, sku: 'REF-003', name: 'Refrigerante 2L', cat: 'Bebidas', unit: 'un', cost: 4.2, price: 7.5, qty: 60, min: 20, sup: 2, active: true },
      { id: 4, sku: 'SUC-004', name: 'Suco de Uva 1L', cat: 'Bebidas', unit: 'un', cost: 6, price: 10.9, qty: 5, min: 10, sup: 2, active: true },
      { id: 5, sku: 'OLD-005', name: 'Produto Descontinuado', cat: 'Outros', unit: 'un', cost: 3, price: 5, qty: 0, min: 0, sup: 1, active: false }
    ],
    moves: [
      { id: 1, pid: 2, uid: 2, type: 'SAÍDA', qty: 12, before: 20, after: 8, reason: 'Venda balcão', at: now - 3600e3 },
      { id: 2, pid: 3, uid: 1, type: 'ENTRADA', qty: 40, before: 20, after: 60, reason: 'Compra NF 1042', at: now - 86400e3 }
    ]
  };

  // ---------- Estado ----------
  const ui = { modal: null, err: '' };
  let user = null;
  try { user = db.users.find(u => u.id == sessionStorage.getItem('sm_uid')) || null; } catch (e) {}
  const isAdmin = () => user && user.role === 'ADMIN';
  const low = p => p.active && p.qty <= p.min;
  const pname = id => (db.products.find(p => p.id == id) || {}).name || '—';
  const uname = id => (db.users.find(u => u.id == id) || {}).name || '—';
  const sname = id => (db.suppliers.find(s => s.id == id) || {}).name || '—';

  // Toda alteração de saldo gera registro de auditoria (quem, quando, quanto, por quê)
  const move = (p, type, q, reason) => {
    const before = p.qty;
    p.qty = type === 'ENTRADA' ? before + q : type === 'SAÍDA' ? before - q : q;
    db.moves.unshift({ id: nid(db.moves), pid: p.id, uid: user.id, type, qty: q, before, after: p.qty, reason, at: Date.now() });
  };

  // ---------- Estilos ----------
  const css = `
:root{--y:#FFC72C;--yd:#E6A800;--yl:#FFF6D6;--ink:#222;--mt:#777;--rd:#D93025;--gr:#1E8E3E}
*{box-sizing:border-box}body{margin:0;font:15px system-ui,sans-serif;color:var(--ink);background:#fff}
h1{margin:0 0 16px}h2{font-size:16px;margin:0 0 10px}
.login{display:grid;grid-template-columns:30% 70%;min-height:100vh}
.lp{background:var(--y);padding:40px 28px;display:flex;flex-direction:column;justify-content:center;gap:10px}
.lp ul{padding-left:18px}.lp li{margin:6px 0}
.lf{display:grid;place-items:center;padding:24px}
.lf form{width:100%;max-width:360px;display:grid;gap:12px}
.logo{font-size:28px;font-weight:800}
label{display:grid;gap:4px;font-weight:600;font-size:13px}
input,select{padding:10px;border:1px solid #ddd;border-radius:8px;font:inherit}
input:focus,select:focus{outline:2px solid var(--y)}
button{border:0;border-radius:8px;padding:10px 16px;font:inherit;font-weight:700;cursor:pointer;background:var(--y);color:var(--ink)}
button:hover{background:var(--yd)}button.g{background:#fff;border:1px solid #ddd}button.r{background:#fff;color:var(--rd);border:1px solid var(--rd)}
.app{display:grid;grid-template-columns:230px 1fr;min-height:100vh}
nav{background:var(--y);padding:20px 14px;display:flex;flex-direction:column;gap:6px}
nav a{padding:10px 12px;border-radius:8px;color:var(--ink);text-decoration:none;font-weight:600;display:flex;justify-content:space-between;gap:8px}
nav a.on,nav a:hover{background:#fff}
nav .u{margin-top:auto;font-size:13px;display:grid;gap:6px}
main{padding:24px;overflow:auto}
.card{background:#fff;border:1px solid #eee;border-top:4px solid var(--y);border-radius:12px;padding:16px;box-shadow:0 1px 4px #0001}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:16px}
.k small{color:var(--mt)}.k b{display:block;font-size:24px}.warn{border-top-color:var(--rd)}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-bottom:16px}
.al{display:flex;justify-content:space-between;padding:8px;border-radius:6px;background:var(--yl);margin-bottom:6px}
.bar{margin:8px 0;font-size:13px}.bar i{display:block;height:8px;border-radius:4px;background:var(--y);margin-top:3px}.bar i.lo{background:var(--rd)}
.tw{overflow-x:auto}table{width:100%;border-collapse:collapse}th{background:var(--yl);text-align:left}
th,td{padding:10px;border-bottom:1px solid #eee;white-space:nowrap}
tr.off{opacity:.5}.mt{color:var(--mt)}
.b{padding:2px 8px;border-radius:99px;font-size:12px;font-weight:700;background:var(--yl)}.b.rd{background:#fde7e5;color:var(--rd)}.b.gr{background:#e3f4e8;color:var(--gr)}
.tools{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}.tools input{flex:1;min-width:180px}
.mod{position:fixed;inset:0;background:#0006;display:grid;place-items:center;padding:16px;z-index:5}
.mod form{background:#fff;border-radius:12px;padding:20px;width:100%;max-width:460px;display:grid;gap:10px;max-height:90vh;overflow:auto}
.err{color:var(--rd);font-size:13px}.hint{font-size:12px;color:var(--mt)}
.toast{position:fixed;bottom:20px;right:20px;background:var(--ink);color:#fff;padding:12px 16px;border-radius:8px;z-index:9}
.mv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;align-items:end;margin-bottom:16px}
@media(max-width:800px){.login{grid-template-columns:1fr}.lp{padding:24px}.app{grid-template-columns:1fr}nav{flex-direction:row;overflow-x:auto;padding:10px;align-items:center}nav .u{margin:0 0 0 auto;white-space:nowrap}main{padding:14px}}`;

  // ---------- Componentes ----------
  const F = (l, n, v = '', t = 'text', x = '') => `<label>${l}<input name="${n}" type="${t}" value="${esc(v)}" ${x}></label>`;
  const T = (heads, rows) => `<div class="card tw"><table><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${heads.length}" class="mt">Nenhum registro</td></tr>`}</tbody></table></div>`;
  const movTable = list => T(['Data', 'Produto', 'Tipo', 'Qtd', 'Saldo', 'Usuário', 'Motivo'], list.map(m =>
    `<tr><td>${dt(m.at)}</td><td>${esc(pname(m.pid))}</td><td><span class="b ${m.type === 'ENTRADA' ? 'gr' : m.type === 'SAÍDA' ? 'rd' : ''}">${m.type}</span></td><td>${m.qty}</td><td>${m.before} → ${m.after}</td><td>${esc(uname(m.uid))}</td><td>${esc(m.reason)}</td></tr>`));

  // ---------- Telas ----------
  const loginView = () => `<div class="login">
  <div class="lp"><div class="logo">📦 StockMax</div><b>Gestão de estoque simples, rastreável e em tempo real.</b>
  <ul><li>Quantidades atualizadas em tempo real</li><li>Histórico de cada movimentação</li><li>Alertas de estoque mínimo</li><li>Acesso em desktop e mobile</li></ul></div>
  <div class="lf"><form data-f="login"><h1>Entrar</h1>${F('E-mail', 'email', '', 'email', 'required autocomplete="username"')}${F('Senha', 'pass', '', 'password', 'required autocomplete="current-password"')}
  <div class="err">${esc(ui.err)}</div><button>Acessar painel</button>
  <div class="hint">Teste: admin@stockmax.com / admin123 (Admin)<br>op@stockmax.com / op123 (Operador)</div></form></div></div>`;

  const bar = p => `<div class="bar">${esc(p.name)} <span class="mt">(${p.qty}/${p.min} ${p.unit})</span><i class="${low(p) ? 'lo' : ''}" style="width:${Math.min(100, p.qty / Math.max(1, p.min * 2) * 100)}%"></i></div>`;

  const dashboard = () => {
    const act = db.products.filter(p => p.active), al = act.filter(low);
    const kp = [['Produtos ativos', act.length], ['Unidades em estoque', act.reduce((s, p) => s + p.qty, 0)], ['Valor em estoque', brl(act.reduce((s, p) => s + p.qty * p.cost, 0))], ['Alertas de mínimo', al.length]];
    return `<h1>Dashboard</h1><div class="kpis">${kp.map(([a, b], i) => `<div class="card k ${i == 3 && al.length ? 'warn' : ''}"><small>${a}</small><b>${b}</b></div>`).join('')}</div>
    <div class="cols"><div class="card"><h2>⚠ Estoque mínimo atingido</h2>${al.map(p => `<div class="al"><span>${esc(p.name)}<br><small class="mt">${esc(sname(p.sup))}</small></span><b>${p.qty}/${p.min}</b></div>`).join('') || '<p class="mt">Tudo em ordem.</p>'}</div>
    <div class="card"><h2>Nível por produto</h2>${act.map(bar).join('')}</div></div>
    <h2>Últimas movimentações</h2>${movTable(db.moves.slice(0, 5))}`;
  };

  const produtos = () => `<h1>Produtos</h1><div class="tools"><input id="q" placeholder="Buscar por nome, SKU ou categoria...">${isAdmin() ? '<button data-a="new-prod">+ Novo produto</button>' : ''}</div>
  ${T(['SKU', 'Produto', 'Categoria', 'Custo', 'Venda', 'Qtd', 'Mín.', 'Status', ''], db.products.map(p =>
    `<tr class="${p.active ? '' : 'off'}"><td>${esc(p.sku)}</td><td>${esc(p.name)}</td><td>${esc(p.cat)}</td><td>${brl(p.cost)}</td><td>${brl(p.price)}</td><td>${p.qty} ${p.unit}</td><td>${p.min}</td>
    <td>${!p.active ? '<span class="b">Inativo</span>' : low(p) ? '<span class="b rd">Estoque baixo</span>' : '<span class="b gr">OK</span>'}</td>
    <td>${isAdmin() ? `<button class="g" data-a="edit-prod:${p.id}">Editar</button> <button class="${p.active ? 'r' : 'g'}" data-a="toggle:${p.id}">${p.active ? 'Inativar' : 'Reativar'}</button>` : ''}</td></tr>`))}
  <p class="hint">Soft delete: produtos nunca são apagados, apenas marcados como inativos (is_active = false). O saldo só muda via Movimentações.</p>`;

  const fornecedores = () => `<h1>Fornecedores</h1><div class="tools">${isAdmin() ? '<button data-a="new-sup">+ Novo fornecedor</button>' : ''}</div>
  ${T(['Razão social', 'CNPJ/CPF', 'Contato', 'Endereço', 'Produtos'], db.suppliers.map(s =>
    `<tr><td>${esc(s.name)}</td><td>${esc(s.doc)}</td><td>${esc(s.contact)}</td><td>${esc(s.addr)}</td><td>${db.products.filter(p => p.sup == s.id && p.active).length}</td></tr>`))}`;

  const movimentacoes = () => `<h1>Movimentações</h1><form class="card mv" data-f="mov">
  <label>Produto<select name="pid">${db.products.filter(p => p.active).map(p => `<option value="${p.id}">${esc(p.name)} (${p.qty})</option>`).join('')}</select></label>
  <label>Tipo<select name="type"><option>ENTRADA</option><option>SAÍDA</option><option value="AJUSTE">AJUSTE (novo saldo)</option></select></label>
  ${F('Quantidade', 'qty', '', 'number', 'min="0" step="1" required')}${F('Motivo', 'reason', '', 'text', 'required')}<button>Registrar</button></form>
  <h2>Histórico (auditoria)</h2>${movTable(db.moves)}`;

  const modal = () => {
    const m = ui.modal;
    if (m.t === 'prod') {
      const p = m.id ? db.products.find(x => x.id == m.id) : {};
      return `<div class="mod"><form data-f="prod"><h2>${m.id ? 'Editar' : 'Novo'} produto</h2>${F('SKU', 'sku', p.sku, 'text', 'required')}${F('Nome', 'name', p.name, 'text', 'required')}${F('Categoria', 'cat', p.cat)}${F('Unidade', 'unit', p.unit || 'un')}
      ${F('Preço de custo', 'cost', p.cost ?? 0, 'number', 'step="0.01" min="0"')}${F('Preço de venda', 'price', p.price ?? 0, 'number', 'step="0.01" min="0"')}
      ${m.id ? '' : F('Quantidade inicial', 'qty', 0, 'number', 'min="0"')}${F('Estoque mínimo', 'min', p.min ?? 0, 'number', 'min="0"')}
      <label>Fornecedor<select name="sup">${db.suppliers.map(s => `<option value="${s.id}" ${s.id == p.sup ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
      <button>Salvar</button><button type="button" class="g" data-a="close">Cancelar</button></form></div>`;
    }
    return `<div class="mod"><form data-f="sup"><h2>Novo fornecedor</h2>${F('Razão social', 'name', '', 'text', 'required')}${F('CNPJ/CPF', 'doc')}${F('Contato', 'contact')}${F('Endereço', 'addr')}
    <button>Salvar</button><button type="button" class="g" data-a="close">Cancelar</button></form></div>`;
  };

  // ---------- Shell + roteador ----------
  const NAV = [['dashboard', '📊 Dashboard'], ['produtos', '📦 Produtos'], ['fornecedores', '🏭 Fornecedores'], ['movimentacoes', '🔁 Movimentações']];
  const views = { dashboard, produtos, fornecedores, movimentacoes };
  const root = document.createElement('div');

  function render() {
    if (!user) { root.innerHTML = loginView(); return; } // guarda: sem login, sem dashboard
    const r = (location.hash || '#/dashboard').slice(2), k = views[r] ? r : 'dashboard';
    const n = db.products.filter(low).length;
    root.innerHTML = `<div class="app"><nav><div class="logo">📦 StockMax</div>
    ${NAV.map(([id, l]) => `<a href="#/${id}" class="${id == k ? 'on' : ''}">${l}${id == 'dashboard' && n ? `<span class="b rd">${n}</span>` : ''}</a>`).join('')}
    <div class="u"><span>${esc(user.name)}<br><small>${user.role}</small></span><button class="g" data-a="logout">Sair</button></div></nav>
    <main>${views[k]()}</main>${ui.modal ? modal() : ''}</div>`;
  }

  const toast = msg => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); };

  // ---------- Eventos ----------
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const [a, id] = b.dataset.a.split(':');
    if (a === 'logout') { user = null; try { sessionStorage.removeItem('sm_uid'); } catch (x) {} location.hash = ''; }
    else if (a === 'new-prod') ui.modal = { t: 'prod' };
    else if (a === 'edit-prod') ui.modal = { t: 'prod', id };
    else if (a === 'new-sup') ui.modal = { t: 'sup' };
    else if (a === 'close') ui.modal = null;
    else if (a === 'toggle' && isAdmin()) { const p = db.products.find(x => x.id == id); p.active = !p.active; toast(p.active ? 'Produto reativado' : 'Produto inativado (soft delete)'); }
    render();
  });

  document.addEventListener('input', e => {
    if (e.target.id !== 'q') return;
    const q = e.target.value.toLowerCase();
    root.querySelectorAll('tbody tr').forEach(tr => { tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none'; });
  });

  document.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target.dataset.f, d = Object.fromEntries(new FormData(e.target));
    if (f === 'login') {
      const u = db.users.find(x => x.email === d.email.trim().toLowerCase() && x.pass === d.pass);
      if (!u) { ui.err = 'E-mail ou senha inválidos.'; return render(); }
      user = u; ui.err = ''; try { sessionStorage.setItem('sm_uid', u.id); } catch (x) {}
      location.hash = '#/dashboard';
    } else if (f === 'prod' && isAdmin()) {
      const v = { sku: d.sku, name: d.name, cat: d.cat, unit: d.unit, cost: +d.cost, price: +d.price, min: +d.min, sup: +d.sup };
      if (ui.modal.id) Object.assign(db.products.find(x => x.id == ui.modal.id), v);
      else { const p = { id: nid(db.products), ...v, qty: 0, active: true }; db.products.push(p); if (+d.qty > 0) move(p, 'ENTRADA', +d.qty, 'Estoque inicial'); }
      ui.modal = null; toast('Produto salvo');
    } else if (f === 'sup' && isAdmin()) {
      db.suppliers.push({ id: nid(db.suppliers), name: d.name, doc: d.doc, contact: d.contact, addr: d.addr }); ui.modal = null; toast('Fornecedor salvo');
    } else if (f === 'mov') {
      const p = db.products.find(x => x.id == d.pid), q = +d.qty;
      if (d.type === 'SAÍDA' && q > p.qty) return toast('Saldo insuficiente para esta saída');
      if (q <= 0 && d.type !== 'AJUSTE') return toast('Informe uma quantidade maior que zero');
      move(p, d.type, q, d.reason); toast(low(p) ? '⚠ Estoque mínimo atingido: ' + p.name : 'Movimentação registrada');
    }
    render();
  });

  window.addEventListener('hashchange', () => { ui.modal = null; render(); });

  // ---------- Inicialização ----------
  document.title = 'StockMax';
  if (!document.querySelector('meta[name=viewport]')) { const m = document.createElement('meta'); m.name = 'viewport'; m.content = 'width=device-width,initial-scale=1'; document.head.appendChild(m); }
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  document.body.appendChild(root);
  render();
})();
