// Klien API: POST text/plain (hindari preflight CORS), token sesi di body, dedupe request baca yang kembar.
const Sesi = { get t() { return localStorage.getItem('cbt_t') || ''; }, set t(v) { v ? localStorage.setItem('cbt_t', v) : localStorage.removeItem('cbt_t'); } };
const _fl = {};
async function api(action, data) {
  const baca = /^(crud\.list|siswa\.ujian|guru\.esai)$/.test(action), k = action + JSON.stringify(data || {});
  if (baca && _fl[k]) return _fl[k];
  const p = (async () => {
    try {
      const r = await fetch(APP_CONFIG.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: Sesi.t, data }) });
      const j = await r.json(); if (j.code === 'AUTH') { Sesi.t = ''; location.reload(); } return j;
    } catch (e) { return { success: false, message: 'Koneksi gagal. Periksa internet Anda.' }; }
  })();
  if (baca) { _fl[k] = p; p.finally(() => delete _fl[k]); }
  return p;
}
