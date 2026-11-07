// CBT Madrasah Kotaanyar — logika frontend (vanilla JS).
const $ = (s, e = document) => e.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let ME = null, tm = null;
function toast(m, t) { const d = document.createElement('div'); d.className = 'toast ' + (t || ''); d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), 3500); }
function stat(c, n, l) { return `<div class="stat ${c}"><b>${n}</b>${l}</div>`; }
function ask(t) {
  return new Promise(r => {
    const d = document.createElement('dialog');
    d.innerHTML = `<form method="dialog"><h3>${esc(t)}</h3><input id="v" class="tok" maxlength="8" autocomplete="off"><div class="row"><button type="button" class="btn ghost" onclick="this.closest('dialog').close()">Batal</button><button value="ok" class="btn">Mulai</button></div></form>`;
    document.body.appendChild(d); d.showModal();
    d.onclose = () => { const v = d.returnValue === 'ok' ? $('#v', d).value.trim().toUpperCase() : null; d.remove(); r(v); };
  });
}
async function boot() {
  if (/GANTI|XXXX/.test(APP_CONFIG.GAS_URL)) return $('#app').innerHTML = '<div class="card" style="max-width:440px;margin:60px auto">Konfigurasi belum lengkap: isi <b>GAS_URL</b> di <code>js/config.js</code>.</div>';
  if (Sesi.t) { const r = await api('auth.me'); if (r.success) { ME = r.data; return home(); } Sesi.t = ''; }
  login();
}
function login() {
  $('#app').innerHTML = `<div class="login"><form class="card" id="f"><div class="logo">CBT</div><h2>CBT Madrasah Kotaanyar</h2><input id="u" placeholder="Username / Nomor Peserta" autocomplete="username" required><input id="p" type="password" placeholder="Kata sandi" autocomplete="current-password" required><button class="btn">Masuk</button></form></div>`;
  $('#f').onsubmit = async e => {
    e.preventDefault(); const b = $('#f button'); b.disabled = true;
    const r = await api('auth.login', { username: $('#u').value, password: $('#p').value }); b.disabled = false;
    if (!r.success) return toast(r.message, 'err'); Sesi.t = r.data.token; ME = r.data.me; home();
  };
}
function home() { ME.role === 'siswa' ? siswaHome() : staff(); }
function keluar() { Sesi.t = ''; location.reload(); }

// ================= SISWA =================
async function siswaHome() {
  const r = await api('siswa.ujian'); if (!r.success) return toast(r.message, 'err');
  const { siswa: s, ujian: U } = r.data, st = { aktif: ['ok', 'Siap Dikerjakan'], berjalan: ['', 'Sedang Berlangsung'], selesai: ['ok', 'Selesai'], belum: ['wr', 'Belum Mulai'], lewat: ['er', 'Terlewat'] };
  $('#app').innerHTML = `<div class="top"><b>CBT Madrasah Kotaanyar</b><span>${esc(s.nama)} · <a href="#" id="out" style="color:#fff">Keluar</a></span></div><div class="wrap">
  <div class="hero"><h2>${esc(s.nama)}</h2><div>${esc(s.lembaga)} · Kelas ${esc(s.kelas)} · Ruang ${esc(s.ruang)} · No. Peserta ${esc(s.username)}</div></div>
  <div class="stats">${stat('bl', U.filter(x => x.status === 'aktif' || x.status === 'berjalan').length, 'Ujian Aktif')}${stat('gr', U.filter(x => x.status === 'selesai').length, 'Ujian Selesai')}${stat('pu', U.filter(x => x.status === 'belum').length, 'Terjadwal')}</div>
  <h3>Daftar Ujian</h3>${U.map(u => `<div class="card ex"><div><b>${esc(u.mapel)}</b><div>${esc(u.tanggal)} · ${esc(u.mulai)}–${esc(u.selesai)} WIB · ${esc(u.durasi)} menit</div><span class="pill ${st[u.status][0]}">${st[u.status][1]}</span>${u.nilai !== null && u.nilai !== '' ? ` <span class="pill ok">Nilai ${esc(u.nilai)}</span>` : ''}</div>
  <button class="btn" data-id="${esc(u.id)}" ${u.status === 'aktif' || u.status === 'berjalan' ? '' : 'disabled'}>${u.status === 'berjalan' ? 'Lanjutkan' : 'Masuk Ujian'}</button></div>`).join('') || '<div class="card empty">Belum ada jadwal ujian untuk kelas Anda.</div>'}
  <div class="card"><h3>Tata Tertib</h3>Ujian berjalan dalam <b>layar penuh</b>. Berpindah tab/jendela dihitung <b>pelanggaran</b>; pada pelanggaran ke-3 jawaban dikirim otomatis. Jawaban tersimpan otomatis.</div></div>`;
  $('#out').onclick = e => { e.preventDefault(); keluar(); };
  document.querySelectorAll('button[data-id]').forEach(b => b.onclick = () => ujian(U.find(x => x.id === b.dataset.id)));
}
function qHtml(q, a) {
  const o = q.opsi; let h = '';
  if (q.tipe === 'pg' || q.tipe === 'pgk') { const m = q.tipe === 'pgk'; h = o.map(x => { const on = m ? (a || []).includes(x.k) : a === x.k; return `<label class="opt ${on ? 'on' : ''}"><input type="${m ? 'checkbox' : 'radio'}" name="q" value="${esc(x.k)}" ${on ? 'checked' : ''}><b>${esc(x.k)}</b><span>${esc(x.t)}${x.g ? `<img src="${esc(x.g)}" alt="">` : ''}</span></label>`; }).join(''); }
  else if (q.tipe === 'bs') h = o.map((t, n) => `<div class="opt"><span>${esc(t)}</span><span class="seg" data-n="${n}"><button type="button" class="${a && a[n] === true ? 'on' : ''}" data-v="1">Benar</button><button type="button" class="${a && a[n] === false ? 'on' : ''}" data-v="0">Salah</button></span></div>`).join('');
  else if (q.tipe === 'jodoh') h = o.kiri.map((t, n) => `<div class="opt"><span>${esc(t)}</span><select data-j="${n}"><option value="">— pilih —</option>${o.kanan.map(k => `<option value="${k.i}" ${a && a[n] === k.i ? 'selected' : ''}>${esc(k.t)}</option>`).join('')}</select></div>`).join('');
  else h = `<textarea id="es" rows="8" placeholder="Tulis jawaban Anda…">${esc(a || '')}</textarea>`;
  return `<div class="q">${esc(q.teks)}${q.gambar ? `<img src="${esc(q.gambar)}" alt="">` : ''}</div>${h}`;
}
async function ujian(j) {
  const tok = await ask('Token — ' + j.mapel); if (!tok) return;
  const r = await api('siswa.mulai', { jadwalId: j.id, token: tok }); if (!r.success) return toast(r.message, 'err');
  const D = r.data, LS = 'cbt_' + D.sesiId; let i = 0, viol = D.pelanggaran, sisa = D.sisaDetik, done = false, dirty = false, lastV = 0, ans = D.jawaban || {}; const ragu = {};
  try { Object.assign(ans, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) {}
  try { await document.documentElement.requestFullscreen(); } catch (e) {}
  const save = () => { localStorage.setItem(LS, JSON.stringify(ans)); dirty = true; };
  const push = async () => { if (!dirty || done) return; dirty = false; const x = await api('siswa.simpan', { sesiId: D.sesiId, jawaban: ans }); if (!x.success) dirty = true; };
  const iv1 = setInterval(push, 20000 + Math.random() * 8000);
  const iv2 = setInterval(() => { sisa--; head(); if (sisa <= 0) fin(true); }, 1000);
  const clean = () => { clearInterval(iv1); clearInterval(iv2); document.removeEventListener('visibilitychange', onVis); document.removeEventListener('fullscreenchange', onFs); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  const end = (d, auto) => { clean(); localStorage.removeItem(LS); $('#app').innerHTML = `<div class="login"><div class="card"><div class="logo">✓</div><h2>${auto ? 'Ujian Dikirim Otomatis' : 'Ujian Selesai'}</h2><p>${auto ? 'Batas waktu atau batas pelanggaran tercapai.' : 'Jawaban Anda telah tersimpan.'}</p>${d && d.nilai !== null && d.nilai !== undefined ? `<h3>Nilai: ${esc(d.nilai)}</h3>` : '<p>Nilai akan diumumkan oleh admin.</p>'}<button class="btn" id="bk">Kembali</button></div></div>`; $('#bk').onclick = siswaHome; };
  const fin = async auto => {
    if (done) return; done = true; const x = await api('siswa.selesai', { sesiId: D.sesiId, jawaban: ans });
    if (!x.success && !auto) { done = false; return toast(x.message, 'err'); } end(x.data, auto);
  };
  const onVis = async () => {
    if (!document.hidden || done || Date.now() - lastV < 2000) return; lastV = Date.now();
    const x = await api('siswa.langgar', { sesiId: D.sesiId, jawaban: ans }); if (!x.success) return;
    if (x.data.status) { done = true; return end(x.data, true); } viol = x.data.pelanggaran; head(); toast('Pelanggaran ' + viol + ' dari ' + D.batasPelanggaran + ' — jangan tinggalkan halaman ujian!', 'err');
  };
  const onFs = () => { const f = $('#fs'); if (f) f.hidden = !!document.fullscreenElement || done; };
  document.addEventListener('visibilitychange', onVis); document.addEventListener('fullscreenchange', onFs);
  const head = () => { const t = $('#tm'), v = $('#vc'); if (!t) return; const s = Math.max(0, sisa); t.textContent = '⏱ ' + String(Math.floor(s / 3600)).padStart(2, '0') + ':' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); t.className = 'pill ' + (s < 300 ? 'er' : 'wr'); v.textContent = 'Pelanggaran ' + viol + '/' + D.batasPelanggaran; v.className = 'pill ' + (viol ? 'er' : 'ok'); };
  const render = () => {
    const q = D.soal[i], lab = { pg: 'Pilihan Ganda', pgk: 'Pilihan Ganda Kompleks', bs: 'Benar–Salah', jodoh: 'Menjodohkan', esai: 'Esai' }[q.tipe], last = i === D.soal.length - 1;
    $('#app').innerHTML = `<div class="eh"><b>${esc(D.mapel)}</b><span id="vc" class="pill"></span><span id="tm" class="pill"></span></div><div class="eg"><div class="card"><div class="qn">Soal ${i + 1} dari ${D.soal.length} · ${lab}</div><div id="qb">${qHtml(q, ans[q.id])}</div>
    <div class="row"><button class="btn ghost" id="pv" ${i ? '' : 'disabled'}>← Sebelumnya</button><button class="btn ghost" id="rg">${ragu[q.id] ? '✓ Ragu-ragu' : 'Ragu-ragu'}</button><button class="btn" id="nx">${last ? 'Selesai Ujian' : 'Selanjutnya →'}</button></div></div>
    <aside class="card" style="height:fit-content;position:static"><div class="nav">${D.soal.map((s, n) => `<button data-n="${n}" class="${n === i ? 'cur' : ''} ${ans[s.id] != null && ans[s.id] !== '' ? 'ok' : ''} ${ragu[s.id] ? 'rg' : ''}">${n + 1}</button>`).join('')}</div><button class="btn" id="fn" style="width:100%">Selesai Ujian</button></aside></div>
    <div id="fs" class="fs" ${document.fullscreenElement ? 'hidden' : ''}><div class="card"><p>Ujian harus dikerjakan dalam layar penuh.</p><button class="btn" id="fsb">Kembali ke Layar Penuh</button></div></div>`;
    head(); wire(q);
  };
  const wire = q => {
    const qb = $('#qb');
    qb.querySelectorAll('input[name=q]').forEach(x => x.onchange = () => { ans[q.id] = q.tipe === 'pgk' ? [...qb.querySelectorAll('input[name=q]:checked')].map(c => c.value) : x.value; save(); qb.innerHTML = qHtml(q, ans[q.id]); wire(q); });
    qb.querySelectorAll('.seg button').forEach(b => b.onclick = () => { const a = ans[q.id] || {}; a[b.parentNode.dataset.n] = b.dataset.v === '1'; ans[q.id] = a; save(); qb.innerHTML = qHtml(q, a); wire(q); });
    qb.querySelectorAll('select[data-j]').forEach(s => s.onchange = () => { const a = ans[q.id] || {}; s.value === '' ? delete a[s.dataset.j] : a[s.dataset.j] = Number(s.value); ans[q.id] = a; save(); });
    const es = $('#es'); if (es) es.oninput = () => { ans[q.id] = es.value; save(); };
    $('#pv').onclick = () => { i--; render(); }; $('#rg').onclick = () => { ragu[q.id] = !ragu[q.id]; render(); };
    $('#nx').onclick = () => i < D.soal.length - 1 ? (i++, render()) : conf();
    document.querySelectorAll('.nav button').forEach(b => b.onclick = () => { i = +b.dataset.n; render(); });
    $('#fn').onclick = conf; $('#fsb').onclick = () => document.documentElement.requestFullscreen().catch(() => {});
  };
  const conf = () => { if (confirm('Yakin menyelesaikan ujian? Jawaban tidak dapat diubah lagi.')) fin(false); };
  render();
}

// ================= STAF =================
const MENU = {
  admin: [['dash', 'Dashboard'], ['Pengguna', 'Pengguna'], ['Mapel', 'Mata Pelajaran'], ['Soal', 'Bank Soal'], ['Jadwal', 'Jadwal & Token'], ['Ujian', 'Monitoring'], ['Kehadiran', 'Kehadiran'], ['Pengaturan', 'Pengaturan'], ['Audit', 'Log Audit']],
  guru: [['dash', 'Dashboard'], ['Soal', 'Bank Soal Saya'], ['esai', 'Koreksi Esai']],
  pengawas_ruang: [['dash', 'Dashboard Ruang'], ['Ujian', 'Monitoring'], ['absen', 'Absensi']],
  pengawas_kec: [['dash', 'Dashboard Wilayah'], ['Ujian', 'Monitoring'], ['Kehadiran', 'Kehadiran']]
};
function staff() {
  const M = MENU[ME.role];
  $('#app').innerHTML = `<div class="shell"><aside><div class="brand"><b>CBT Madrasah</b><small>Kec. Kotaanyar</small></div>${M.map(([k, t]) => `<a data-k="${k}">${t}</a>`).join('')}<a class="out" id="out">Keluar</a></aside><section><header><b id="ttl"></b><span>${esc(ME.nama)} · ${esc(ME.role)}</span></header><main id="main"></main></section></div>`;
  document.querySelectorAll('aside a[data-k]').forEach(a => a.onclick = () => go(a.dataset.k)); $('#out').onclick = keluar; go(M[0][0]);
}
function go(k) {
  clearInterval(tm); document.querySelectorAll('aside a[data-k]').forEach(a => { const on = a.dataset.k === k; a.classList.toggle('on', on); if (on) $('#ttl').textContent = a.textContent; });
  ({ dash, esai, absen }[k] || (() => tbl(k)))();
  if (k === 'dash' || k === 'Ujian') tm = setInterval(() => { if (document.visibilityState === 'visible') go(k); }, 20000);
}
async function dash() {
  const m = $('#main');
  if (ME.role === 'guru') { const [a, b] = await Promise.all([api('crud.list', { sheet: 'Soal' }), api('guru.esai')]); return m.innerHTML = `<div class="stats">${stat('bl', a.data ? a.data.rows.length : 0, 'Total Butir Soal')}${stat('rd', b.data ? b.data.length : 0, 'Esai Menunggu Koreksi')}</div>`; }
  const r = await api('crud.list', { sheet: 'Ujian' }); if (!r.success) return m.innerHTML = `<div class="card">${esc(r.message)}</div>`;
  const R = r.data.rows, c = s => R.filter(x => x.status === s).length, lem = {};
  R.forEach(x => { const l = lem[x.lembaga] = lem[x.lembaga] || { n: 0, s: 0 }; l.n++; if (x.status !== 'berjalan') l.s++; });
  m.innerHTML = `<div class="stats">${stat('bl', R.length, 'Sesi Ujian')}${stat('gr', c('berjalan'), 'Sedang Mengerjakan')}${stat('pu', c('selesai') + c('auto'), 'Selesai')}${stat('rd', R.reduce((a, x) => a + Number(x.pelanggaran || 0), 0), 'Total Pelanggaran')}</div>
  <div class="card"><h3>Progres per Lembaga</h3>${Object.keys(lem).map(k => `<div style="margin:10px 0"><div>${esc(k)} <span class="pill">${lem[k].s}/${lem[k].n}</span></div><div class="bar"><i style="width:${Math.round(lem[k].s / lem[k].n * 100)}%"></i></div></div>`).join('') || '<div class="empty">Belum ada sesi ujian.</div>'}</div>`;
}
const SEL = { role: ['siswa', 'guru', 'pengawas_ruang', 'pengawas_kec'], tipe: ['pg', 'pgk', 'bs', 'jodoh', 'esai'], aktif: ['YA', 'TIDAK'] }, LONG = ['teks', 'opsi', 'kunci', 'soalIds'];
const HINT = { opsi: 'pg/pgk: [{"k":"A","t":"teks","g":"url gambar"}] · bs: ["pernyataan 1",…] · jodoh: {"kiri":[…],"kanan":[…]}', kunci: 'pg: B · pgk: ["A","C"] · bs: {"0":true,"1":false} · jodoh: {"0":2,"1":0}', soalIds: 'id soal dipisah koma' };
async function tbl(S) {
  const r = await api('crud.list', { sheet: S }), m = $('#main'); if (!r.success) return m.innerHTML = `<div class="card">${esc(r.message)}</div>`;
  const { h, rows, rw } = r.data, ed = h.filter(k => S !== 'Pengaturan' || k); let q = '';
  const draw = () => { const f = rows.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q)).slice(0, 200); $('#tb').innerHTML = f.map(x => `<tr data-id="${esc(x.id)}">${h.map(k => `<td>${esc(String(x[k] ?? '').slice(0, 60))}</td>`).join('')}${rw ? `<td class="act">${S === 'Jadwal' ? '<a data-t>Token baru</a>' : ''}<a data-d>Hapus</a></td>` : ''}</tr>`).join('') || '<tr><td colspan="99" class="empty">Belum ada data</td></tr>'; };
  m.innerHTML = `<div class="card"><div class="row" style="margin:0"><input id="cari" placeholder="Cari…">${rw && S === 'Pengguna' ? '<button class="btn ghost" id="imp">Impor CSV</button>' : ''}</div><div class="scroll"><table><thead><tr>${h.map(k => `<th>${k}</th>`).join('')}${rw ? '<th></th>' : ''}</tr></thead><tbody id="tb"></tbody></table></div></div>
  ${rw ? `<div class="card"><h3>Tambah / Ubah ${S}</h3><form id="fm" class="form">${ed.map(k => `<div><label>${k}</label>${SEL[k] ? `<select name="${k}">${SEL[k].map(o => `<option>${o}</option>`).join('')}</select>` : LONG.includes(k) ? `<textarea name="${k}" rows="3" placeholder="${esc(HINT[k] || '')}"></textarea>` : `<input name="${k}" ${k === 'guru' && ME.role === 'guru' ? 'readonly' : ''}>`}</div>`).join('')}${S === 'Pengguna' ? '<div><label>password (kosongkan jika tidak diubah)</label><input name="password" type="password" autocomplete="new-password"></div>' : ''}</form><div class="row"><button class="btn" id="sv">Simpan</button><button class="btn ghost" id="rs">Kosongkan</button></div>${S === 'Pengguna' ? '<div id="im" hidden><h3>Impor Pengguna</h3><textarea id="csv" rows="6" placeholder="role,username,nama,lembaga,kelas,ruang,mapel,password&#10;siswa,0213045089,Ahmad Faiz,MTs Nurul Jadid,IX-A,Lab 02,,sandi123"></textarea><div class="row"><button class="btn" id="go">Impor (per 25 baris)</button></div></div>' : ''}</div>` : ''}`;
  draw(); $('#cari').oninput = e => { q = e.target.value.toLowerCase(); draw(); };
  if (!rw) return; const fm = $('#fm');
  $('#tb').onclick = async e => {
    const tr = e.target.closest('tr'); if (!tr || !tr.dataset.id) return; const x = rows.find(y => String(y.id) === tr.dataset.id);
    if (e.target.matches('[data-d]')) { if (!confirm('Hapus data ini?')) return; const d = await api('crud.hapus', { sheet: S, id: x.id }); toast(d.message, d.success ? '' : 'err'); return d.success && tbl(S); }
    if (e.target.matches('[data-t]')) { const d = await api('token.baru', { jadwalId: x.id }); toast(d.success ? 'Token baru: ' + d.data.token : d.message, d.success ? '' : 'err'); return d.success && tbl(S); }
    ed.forEach(k => { if (fm.elements[k]) fm.elements[k].value = x[k] ?? ''; });
  };
  $('#rs').onclick = () => fm.reset();
  $('#sv').onclick = async () => { const row = {}; [...fm.elements].forEach(el => { if (el.name && el.value !== '') row[el.name] = el.value; }); const d = await api('crud.save', { sheet: S, row }); toast(d.message, d.success ? '' : 'err'); if (d.success) tbl(S); };
  if (S === 'Pengguna') {
    $('#imp').onclick = () => { $('#im').hidden = !$('#im').hidden; };
    $('#go').onclick = async () => {
      const L = $('#csv').value.split('\n').map(x => x.trim()).filter(x => x && !/^role,/i.test(x)).map(x => { const c = x.split(',').map(y => y.trim()); return { role: c[0], username: c[1], nama: c[2], lembaga: c[3], kelas: c[4], ruang: c[5], mapel: c[6], password: c[7] }; });
      let n = 0; for (let i = 0; i < L.length; i += 25) { const d = await api('crud.save', { sheet: S, rows: L.slice(i, i + 25) }); if (!d.success) return toast(d.message + ' (berhenti di baris ' + (i + 1) + ')', 'err'); n += L.slice(i, i + 25).length; toast('Terimpor ' + n + '/' + L.length); }
      tbl(S);
    };
  }
}
async function esai() {
  const r = await api('guru.esai'), m = $('#main'); if (!r.success) return m.innerHTML = `<div class="card">${esc(r.message)}</div>`;
  m.innerHTML = r.data.map(s => `<div class="card" data-s="${esc(s.sesiId)}"><h3>${esc(s.nama)} · ${esc(s.kelas)} · ${esc(s.mapel)}</h3>${s.items.map(it => `<div style="margin:10px 0"><div class="qn">Soal esai (bobot ${it.bobot})</div><div>${esc(it.teks)}</div><div class="opt" style="white-space:pre-wrap">${esc(it.jawaban) || '<i>(kosong)</i>'}</div><input type="number" min="0" max="${it.bobot}" step="0.5" data-i="${esc(it.soalId)}" placeholder="Skor 0–${it.bobot}"></div>`).join('')}<button class="btn" data-k>Simpan Nilai</button></div>`).join('') || '<div class="card empty">Tidak ada esai yang menunggu koreksi 🎉</div>';
  m.querySelectorAll('[data-k]').forEach(b => b.onclick = async () => { const c = b.closest('.card'), skor = {}; c.querySelectorAll('input[data-i]').forEach(x => skor[x.dataset.i] = x.value); const d = await api('guru.koreksi', { sesiId: c.dataset.s, skor }); toast(d.message, d.success ? '' : 'err'); if (d.success) esai(); });
}
async function absen() {
  const [j, p, k] = await Promise.all([api('crud.list', { sheet: 'Jadwal' }), api('crud.list', { sheet: 'Pengguna' }), api('crud.list', { sheet: 'Kehadiran' })]), m = $('#main');
  if (!j.success || !p.success) return m.innerHTML = '<div class="card">Gagal memuat data.</div>';
  const hdr = `<div class="card"><label>Pilih ujian</label><select id="jd">${j.data.rows.map(x => `<option value="${esc(x.id)}">${esc(x.tanggal)} · ${esc(x.mapel)} · ${esc(x.kelas)}</option>`).join('')}</select></div>`;
  const body = () => { const id = $('#jd').value, K = {}; k.data.rows.filter(x => x.jadwalId === id).forEach(x => K[x.target] = x.status); $('#ab').innerHTML = p.data.rows.map(s => `<tr><td>${esc(s.nama)}</td><td>${esc(s.username)}</td><td><span class="seg" data-u="${esc(s.username)}">${['Hadir', 'Tidak Hadir'].map(v => `<button type="button" class="${K[s.username] === v ? 'on' : ''}" data-v="${v}">${v}</button>`).join('')}</span></td></tr>`).join(''); };
  m.innerHTML = hdr + `<div class="card"><table><thead><tr><th>Nama</th><th>No. Peserta</th><th>Kehadiran</th></tr></thead><tbody id="ab"></tbody></table></div>`;
  $('#jd').onchange = body; body();
  $('#ab').onclick = async e => { const b = e.target.closest('button[data-v]'); if (!b) return; const d = await api('crud.save', { sheet: 'Kehadiran', row: { jadwalId: $('#jd').value, target: b.parentNode.dataset.u, status: b.dataset.v } }); if (d.success) { b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); } else toast(d.message, 'err'); };
}
boot();
