var UPGRADE_CODE = String.raw`
(function () {
  'use strict';
  if (typeof window.sendChatMessage !== 'function' || typeof window.chatState === 'undefined') return;
  window.__pebiUpgrade = 'v5';

  var css = document.createElement('style');
  css.textContent = '.pk-card{background:#0d0d0d;border:1px solid rgba(212,175,55,.25);border-radius:12px;overflow:hidden;margin-top:8px}.pk-item{display:flex;gap:10px;padding:10px;border-bottom:1px solid rgba(255,255,255,.05);align-items:center}.pk-item:last-child{border-bottom:none}.pk-n{color:#fff;font-size:12px;font-weight:700}.pk-p{color:#d4af37;font-size:11px;font-weight:600}.pk-add{margin-left:auto;background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.3);color:#d4af37;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer}.pk-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.pk-chip{background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.3);color:#d4af37;border-radius:20px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;text-decoration:none}.pk-sum{background:#0d0d0d;border:1px dashed rgba(212,175,55,.4);border-radius:10px;padding:10px;margin-top:8px;font-size:12px;color:#e5e7eb}.pk-in{width:100%;box-sizing:border-box;background:#0d0d0d;border:1px solid rgba(212,175,55,.3);color:#fff;border-radius:10px;padding:10px;margin:5px 0;font-size:14px;font-family:inherit}.pk-in:focus{outline:none;border-color:#d4af37}';
  document.head.appendChild(css);

  function cleanMarkdown(t) {
    return String(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1').replace(/_(.+?)_/g, '$1').replace(/^#{1,6}\s*/gm, '');
  }
  function pkEsc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  var unread = 0;
  var badge = document.getElementById('chat-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'chat-badge';
    badge.style.cssText = 'position:fixed;right:14px;bottom:120px;background:#ef4444;color:#fff;border-radius:9999px;min-width:20px;height:20px;font-size:11px;font-weight:800;display:none;align-items:center;justify-content:center;padding:0 5px;z-index:70;box-shadow:0 0 0 3px rgba(10,10,10,.9);';
    document.body.appendChild(badge);
  }
  function updateBadge() {
    if (unread > 0 && !chatState.isOpen) { badge.textContent = unread > 9 ? '9+' : String(unread); badge.style.display = 'flex'; }
    else badge.style.display = 'none';
  }

  var _addChatMessage = addChatMessage;
  addChatMessage = function (text, sender, extraHTML) {
    if (sender === 'bot') text = cleanMarkdown(text);
    var r = _addChatMessage(text, sender, extraHTML);
    if (sender === 'bot' && !chatState.isOpen) { unread++; updateBadge(); }
    return r;
  };

  var NAME_KEY = 'pebi_customer_name';
  var awaitingName = false;
  function savedName() { try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; } }
  function cap(s) { s = s.trim().replace(/\s+/g, ' '); if (!s) return ''; return s.charAt(0).toUpperCase() + s.slice(1); }
  function saveName(nm) {
    nm = cap(nm.replace(/[^a-zA-Z\s'.-]/g, ' '));
    if (!nm) return '';
    try { localStorage.setItem(NAME_KEY, nm); } catch (e) {}
    chatState.context.push({ role: 'user', text: 'Nama saya ' + nm + '. Panggil aku Kak ' + nm + '.' });
    chatState.context.push({ role: 'assistant', text: 'Baik, Kak ' + nm + '!' });
    return nm;
  }
  function maybeAskName() {
    if (savedName() || awaitingName) return;
    awaitingName = true;
    setTimeout(function () {
      if (!savedName()) addBotMessage('Ngomong-ngomong, boleh tahu nama Kakak? 😊', '', true);
    }, 1500);
  }
  (function () {
    var n = savedName();
    if (n && chatState.context.length === 0) {
      chatState.context.push({ role: 'user', text: 'Nama saya ' + n + '. Panggil aku Kak ' + n + '.' });
      chatState.context.push({ role: 'assistant', text: 'Baik, Kak ' + n + '!' });
    }
  })();

  var _toggle = toggleChatWidget;
  toggleChatWidget = function () {
    _toggle();
    if (chatState.isOpen) { unread = 0; updateBadge(); maybeAskName(); }
  };

  function item(emo, n, p, oc) {
    return '<div class="pk-item"><div style="width:44px;height:44px;border-radius:10px;background:rgba(212,175,55,.12);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">' + emo + '</div><div><div class="pk-n">' + n + '</div><div class="pk-p">' + p + '</div></div><button type="button" class="pk-add" onclick="' + oc + '">+ Pilih</button></div>';
  }
  function menuCardHTML() {
    return '<div class="pk-card">' +
      item('🥟', 'Dimsum Mentai', 'Rp 18.000 – 70.000', "ubahQtyVarian('dimsum_8',1);showToast('✅ Dimsum 8 pcs ditambahkan!','success')") +
      item('🌶️', 'Ceker Mercon + Baso', 'Rp 15.000 / porsi', "ubahLevelPedas(2,1);showToast('✅ Ceker Level 2 ditambahkan!','success')") +
      item('⭐', 'Combo Laris (Hemat 10rb)', 'Rp 59.000', "pilihCombo()") +
      '</div>';
  }
  function showMenuCard() {
    addBotMessage('Ini menu Pebi\'s Kitchen! 👇 Klik "+ Pilih" untuk langsung masuk racikan:', menuCardHTML(), true);
  }
  window.showMenuCard = showMenuCard;

  function defaultChips() {
    return '<div class="pk-chips">' +
      '<button type="button" class="pk-chip" onclick="quickReply(\'pesan\')">🛒 Pesan Sekarang</button>' +
      '<button type="button" class="pk-chip" onclick="showMenuCard()">🥟 Lihat Menu</button>' +
      '<button type="button" class="pk-chip" onclick="quickReply(\'ongkir\')">🚚 Cek Ongkir Lokasi Saya</button></div>';
  }

  var _addBot = addBotMessage;
  addBotMessage = function (text, extra, noChips) {
    text = cleanMarkdown(text);
    if (!extra && !noChips) extra = defaultChips();
    return _addBot(text, extra);
  };

  var AREAS = [
    ['Sawangan / Bojongsari', 3],
    ['Cinere / Limo / Pancoran Mas', 8],
    ['Ciputat / Pondok Aren / Tangsel', 12],
    ['Cimanggis / Tapos', 14],
    ['Jakarta Selatan', 18],
    ['Jakarta Barat / Pusat / Timur', 25]
  ];
  function hitungOngkirChat(jarak) {
    var sub = hitungSubtotal();
    if (jarak <= 5) return { amount: 0, label: 'GRATIS 🎉' };
    if (jarak <= 10) {
      if (sub >= 80000) return { amount: 0, label: 'GRATIS 🎉 (belanja ≥ Rp 80.000)' };
      return { amount: 10000, label: formatRupiah(10000) };
    }
    var k = Math.ceil((jarak - 10) / 10) * 10000;
    return { amount: k, label: formatRupiah(k) };
  }
  function setDistanceInput(j) {
    var el = document.getElementById('customer-distance');
    if (el) { el.value = j.toFixed(1); if (window.clearFieldError) clearFieldError('customer-distance'); updateAllCalculations(); }
  }
  function showOngkirChat(jarak, area) {
    var o = hitungOngkirChat(jarak);
    var html = '<div class="pk-sum">📍 Area: <b>' + pkEsc(area) + '</b><br>🚚 Jarak dari dapur: <b>' + jarak.toFixed(1) + ' km</b> (garis lurus)<br>💸 Ongkir Kurir Toko: <b>' + o.label + '</b>';
    if (jarak > 5 && jarak <= 10) html += '<br><i>💡 6–10 km GRATIS jika belanja ≥ Rp 80.000</i>';
    if (jarak > 20) html += '<br><i>💡 Jarak jauh? Bisa pilih GrabExpress / GoSend di form.</i>';
    html += '</div><div class="pk-chips"><a class="pk-chip" href="#order" onclick="toggleChatWidget()">✅ Lanjut Racik Pesanan</a><button type="button" class="pk-chip" onclick="fallbackAreaChat()">🔁 Pilih area manual</button></div>';
    addBotMessage(o.amount === 0 ? 'Asyik, lokasi Anda dapat GRATIS ongkir! 🎉' : 'Ongkir ke lokasi Anda sudah dihitung! 😊', html, true);
  }
  window.fallbackAreaChat = function () {
    var h = '<div class="pk-chips">';
    AREAS.forEach(function (a, i) { h += '<button type="button" class="pk-chip" onclick="pilihAreaChat(' + i + ')">' + a[0] + '</button>'; });
    h += '</div>';
    addBotMessage('Baik, pilih perkiraan area Anda ya: 👇', h, true);
  };
  window.pilihAreaChat = function (i) {
    var a = AREAS[i];
    setDistanceInput(a[1]);
    showOngkirChat(a[1], a[0]);
  };
  function detectLokasiChat() {
    if (!navigator.geolocation) { fallbackAreaChat(); return; }
    addBotMessage('📡 Mendeteksi lokasi Anda... Ketuk "Izinkan" pada permintaan lokasi ya 👆', '', true);
    navigator.geolocation.getCurrentPosition(function (pos) {
      var jarak = haversine(CONFIG.SHOP_LAT, CONFIG.SHOP_LON, pos.coords.latitude, pos.coords.longitude);
      setDistanceInput(jarak);
      fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + pos.coords.latitude + '&longitude=' + pos.coords.longitude + '&localityLanguage=id')
        .then(function (r) { return r.json(); })
        .then(function (j) { showOngkirChat(jarak, j.city || j.locality || j.principalSubdivision || 'Lokasi Anda'); })
        .catch(function () { showOngkirChat(jarak, 'Lokasi Anda'); });
    }, function () { fallbackAreaChat(); }, { timeout: 10000, maximumAge: 300000 });
  }

  var pendingDimsumQty = 0;
  function parseOrder(t) {
    if (!/\b(pesan|order|beli|ambil|mintak)\b/.test(t)) return null;
    var adds = []; var m;
    if (/combo/.test(t)) return [{ type: 'combo' }];
    m = t.match(/(\d+)\s*(?:x|porsi|buah)?\s*(?:dimsum|mentai)(?:[^0-9]{0,12}(4|6|8|10|12|16)\b)?/);
    if (m) adds.push({ type: 'dimsum', qty: parseInt(m[1], 10), size: m[2] ? parseInt(m[2], 10) : 0 });
    else if (/(dimsum|mentai)/.test(t)) adds.push({ type: 'dimsum', qty: 1, size: 0 });
    m = t.match(/(\d+)\s*(?:x|porsi|buah)?\s*(?:ceker|mercon)(?:\s*level\s*([123]))?/);
    if (m) adds.push({ type: 'ceker', qty: parseInt(m[1], 10), level: m[2] ? parseInt(m[2], 10) : 2 });
    else if (/(ceker|mercon)/.test(t)) adds.push({ type: 'ceker', qty: 1, level: 2 });
    return adds.length ? adds : null;
  }
  function applyOrder(adds) {
    adds.forEach(function (a) {
      if (a.type === 'combo') pilihCombo();
      else if (a.type === 'dimsum') { if (a.size) ubahQtyVarian('dimsum_' + a.size, a.qty); else pendingDimsumQty = a.qty; }
      else if (a.type === 'ceker') { for (var i = 0; i < a.qty; i++) ubahLevelPedas(a.level, 1); }
    });
  }
  function cartSummaryHTML() {
    var lines = [];
    Object.keys(state.qty).forEach(function (k) {
      if (state.qty[k] > 0) lines.push('• ' + CONFIG.MENU_NAMES[k] + ' x' + state.qty[k]);
    });
    if (!lines.length) return '';
    return '<div class="pk-sum">🛒 <b>Racikan Anda:</b><br>' + lines.join('<br>') + '<br>💰 Total: <b>' + formatRupiah(hitungSubtotal()) + '</b></div>';
  }
  function orderButtons() {
    return '<div class="pk-chips"><a class="pk-chip" href="#order" onclick="toggleChatWidget()">✅ Lengkapi Data & Checkout</a></div>';
  }
  function sizeChips() {
    var h = '<div class="pk-chips">';
    [4, 6, 8, 10, 12, 16].forEach(function (s) { h += '<button type="button" class="pk-chip" onclick="confirmDimsum(' + s + ')">' + s + ' pcs</button>'; });
    return h + '</div>';
  }
  window.confirmDimsum = function (s) {
    if (pendingDimsumQty > 0) { ubahQtyVarian('dimsum_' + s, pendingDimsumQty); pendingDimsumQty = 0; }
    addBotMessage('Siap! Dimsum ' + s + ' pcs sudah masuk racikan. 😊', cartSummaryHTML() + orderButtons(), true);
  };

  var _send = sendChatMessage;
  sendChatMessage = function () {
    var input = document.getElementById('chat-input');
    var text = input ? input.value.trim() : '';
    var lower = text.toLowerCase();

    if (awaitingName && text && text.length <= 40 && !parseOrder(lower) && !/(menu|harga|ongkir|ongkos|dp|jam|pesan|order|beli|halo|kirim)/.test(lower)) {
      awaitingName = false;
      var nm = saveName(text) || 'Kak';
      addUserMessage(text);
      if (input) { input.value = ''; onChatInput(); }
      addBotMessage('Senang bertemu Anda, Kak ' + nm + '! 🥰 Ketik "menu", "ongkir", atau contoh "pesan 2 dimsum 8" ya.', '', true);
      return;
    }

    var nameHit = lower.match(/(?:namaku|nama saya|panggil aku|panggil saya)\s+([a-z][a-z'.-]*(?:\s[a-z][a-z'.-]*)?)/);
    if (nameHit && !savedName()) {
      var nm2 = saveName(nameHit[1]);
      if (nm2) {
        addUserMessage(text);
        if (input) { input.value = ''; onChatInput(); }
        addBotMessage('Halo Kak ' + nm2 + '! 😊 Ada yang bisa saya bantu? Ketik "menu" untuk lihat menu ya.', '', true);
        return;
      }
    }

    if (/(lihat menu|daftar menu|^menu$|menu dong|daftar harga|berapa harga|harga)/.test(lower)) {
      awaitingName = false;
      addUserMessage(text);
      if (input) { input.value = ''; onChatInput(); }
      showTyping();
      setTimeout(function () { hideTyping(); showMenuCard(); }, 500);
      return;
    }

    var adds = parseOrder(lower);
    if (adds) {
      awaitingName = false;
      addUserMessage(text);
      if (input) { input.value = ''; onChatInput(); }
      showTyping();
      setTimeout(function () {
        hideTyping();
        applyOrder(adds);
        if (pendingDimsumQty > 0) {
          addBotMessage('Dicatat! Dimsumnya mau ukuran berapa pcs? Pilih ya: 👇', sizeChips(), true);
        } else {
          var nm3 = savedName();
          addBotMessage('Siap' + (nm3 ? ', Kak ' + nm3 : '') + '! Pesanan sudah saya catat. 😊', cartSummaryHTML() + orderButtons(), true);
        }
      }, 600);
      return;
    }

    if (/(ongkir|ongkos|biaya kirim|kirim berapa|berapa kirim)/.test(lower)) {
      awaitingName = false;
      addUserMessage(text);
      if (input) { input.value = ''; onChatInput(); }
      showTyping();
      setTimeout(function () { hideTyping(); detectLokasiChat(); }, 400);
      return;
    }

    return _send();
  };
  /* ===== LANJUT KE BAGIAN 2 ===== */
  
  /* ===== SECTION KOMENTAR PEMBELI ===== */
  var tstRating = 5;
  var sec = document.createElement('section');
  sec.id = 'testimoni';
  sec.style.cssText = 'max-width:900px;margin:48px auto;padding:0 16px;';
  sec.innerHTML =
    '<h2 style="color:#d4af37;font-size:22px;margin-bottom:4px;">💬 Kata Pelanggan</h2>' +
    '<p style="color:#9ca3af;font-size:13px;margin-bottom:16px;">Cerita asli dari pembeli Pebi\'s Kitchen</p>' +
    '<div id="tst-list" style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;"></div>' +
    '<div style="background:#111;border:1px solid rgba(212,175,55,.25);border-radius:14px;padding:16px;">' +
    '<h3 style="color:#fff;font-size:15px;margin-bottom:10px;">✍️ Tulis Komentar</h3>' +
    '<input id="tst-name" class="pk-in" maxlength="60" placeholder="Nama Anda">' +
    '<input id="tst-addr" class="pk-in" maxlength="120" placeholder="Alamat / daerah (contoh: Sawangan, Depok)">' +
    '<div id="tst-stars" style="margin:6px 0;"></div>' +
    '<textarea id="tst-text" class="pk-in" maxlength="500" rows="3" placeholder="Tulis pengalaman Anda setelah memesan..."></textarea>' +
    '<button id="tst-send" style="width:100%;background:#d4af37;color:#000;border:none;border-radius:10px;padding:12px;font-weight:800;font-size:14px;cursor:pointer;margin-top:6px;">Kirim Komentar ⭐</button>' +
    '</div>';
  var footer = document.querySelector('footer') || document.getElementById('footer');
  if (footer) document.body.insertBefore(sec, footer); else document.body.appendChild(sec);

  function starsHTML() {
    var h = '<span style="color:#9ca3af;font-size:12px;margin-right:6px;">Rating:</span>';
    for (var i = 1; i <= 5; i++) h += '<span data-i="' + i + '" style="font-size:24px;cursor:pointer;color:' + (i <= tstRating ? '#d4af37' : '#4b5563') + '">★</span>';
    return h;
  }
  function renderStars() { document.getElementById('tst-stars').innerHTML = starsHTML(); }
  renderStars();
  document.getElementById('tst-stars').addEventListener('click', function (e) {
    var i = e.target && e.target.getAttribute ? e.target.getAttribute('data-i') : null;
    if (i) { tstRating = parseInt(i, 10); renderStars(); }
  });

  function loadTestimonials() {
    fetch('/api/comments').then(function (r) { return r.json(); }).then(function (d) {
      var box = document.getElementById('tst-list');
      if (!box) return;
      if (!d.success || !d.comments || !d.comments.length) {
        box.innerHTML = '<p style="color:#9ca3af;font-size:13px;">Jadilah yang pertama menulis komentar! 😊</p>';
        return;
      }
      box.innerHTML = d.comments.slice(0, 20).map(function (c) {
        var st = '';
        for (var i = 1; i <= 5; i++) st += i <= (c.stars || 5) ? '★' : '☆';
        return '<div style="background:#111;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:12px;">' +
          '<div style="display:flex;justify-content:space-between;gap:8px;"><b style="color:#fff;font-size:13px;">' + pkEsc(c.name) + '</b><span style="color:#d4af37;font-size:12px;white-space:nowrap;">' + st + '</span></div>' +
          (c.address ? '<div style="color:#9ca3af;font-size:11px;">📍 ' + pkEsc(c.address) + '</div>' : '') +
          '<p style="color:#e5e7eb;font-size:13px;margin:6px 0 0;">' + pkEsc(c.text) + '</p>' +
          '<div style="color:#6b7280;font-size:10px;margin-top:6px;">' + new Date(c.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + '</div></div>';
      }).join('');
    }).catch(function () {});
  }
  loadTestimonials();

  document.getElementById('tst-send').addEventListener('click', function () {
    var name = document.getElementById('tst-name').value.trim();
    var addr = document.getElementById('tst-addr').value.trim();
    var text = document.getElementById('tst-text').value.trim();
    if (!name || !text) { showToast('Nama dan komentar wajib diisi', 'error'); return; }
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, address: addr, text: text, stars: tstRating })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.success) {
        showToast('Terima kasih! Komentar Anda sudah tayang 🎉', 'success');
        document.getElementById('tst-name').value = '';
        document.getElementById('tst-addr').value = '';
        document.getElementById('tst-text').value = '';
        tstRating = 5; renderStars();
        loadTestimonials();
      } else showToast(d.error || 'Gagal mengirim komentar', 'error');
    }).catch(function () { showToast('Gagal terhubung ke server', 'error'); });
  });
})();
`;

var ADMIN_HTML = String.raw`<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Pebi's Kitchen</title>
<style>body{background:#0a0a0a;color:#e5e7eb;font-family:system-ui,sans-serif;margin:0;padding:16px}.card{max-width:640px;margin:30px auto;background:#111;border:1px solid rgba(212,175,55,.3);border-radius:16px;padding:20px}h1{color:#d4af37;font-size:20px}input{width:100%;box-sizing:border-box;background:#0d0d0d;border:1px solid rgba(212,175,55,.3);color:#fff;border-radius:10px;padding:12px;margin:6px 0;font-size:14px}button{background:#d4af37;color:#000;border:none;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer}.del{background:#ef4444;color:#fff;padding:6px 10px;border-radius:8px;border:none;font-size:11px}.item{border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px;margin:10px 0}.muted{color:#9ca3af;font-size:12px}</style></head>
<body><div class="card" id="app"></div>
<script>
var token = localStorage.getItem('pebi_admin_token') || '';
var app = document.getElementById('app');
function esc(s){ var d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
function loginUI(){ app.innerHTML = '<h1>🔐 Login Admin</h1><p class="muted">Area khusus pemilik Pebi\'s Kitchen</p><input id="pw" type="password" placeholder="Password admin"><button onclick="doLogin()">Masuk 👑</button>'; }
function doLogin(){ fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.getElementById('pw').value})}).then(function(r){return r.json()}).then(function(d){ if(d.success){ localStorage.setItem('pebi_admin_token', d.token); token=d.token; dash(); } else alert('Password salah!'); }); }
function dash(){ fetch('/api/comments').then(function(r){return r.json()}).then(function(d){ var list=d.comments||[]; app.innerHTML='<h1>👑 Admin Pebi\'s Kitchen</h1><p class="muted">Total komentar masuk: '+list.length+'</p><button onclick="dash()">🔄 Refresh</button> <button onclick="logout()" style="background:#ef4444;color:#fff">🚪 Keluar</button><div id="lst"></div>'; document.getElementById('lst').innerHTML = list.length ? list.map(function(c){ var st=''; for(var i=1;i<=5;i++) st+= i<=(c.stars||5)?'★':'☆'; return '<div class="item"><b>'+esc(c.name)+'</b> <span style="color:#d4af37">'+st+'</span><br><span class="muted">📍 '+esc(c.address||'-')+' • '+new Date(c.time).toLocaleDateString('id-ID')+'</span><p>'+esc(c.text)+'</p><button class="del" onclick="delComment(\''+c.id+'\')">🗑 Hapus</button></div>'; }).join('') : '<p class="muted">Belum ada komentar masuk.</p>'; }); }
function delComment(id){ if(!confirm('Hapus komentar ini?')) return; fetch('/api/comments',{method:'DELETE',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({id:id})}).then(function(r){return r.json()}).then(function(d){ if(d.success) dash(); else { alert(d.error||'Gagal'); if(d.error==='Unauthorized') logout(); } }); }
function logout(){ localStorage.removeItem('pebi_admin_token'); token=''; loginUI(); }
if(token) dash(); else loginUI();
</script></body></html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (url.pathname === "/api/health") {
      const result = { groqKey: Boolean(env.GROQ_KEY), geminiKey: Boolean(env.GEMINI_KEY), groq: null, gemini: null };
      if (env.GROQ_KEY) { try { await callGroq("Halo", [], env.GROQ_KEY); result.groq = "OK"; } catch (e) { result.groq = "GAGAL: " + e.message; } }
      if (env.GEMINI_KEY) { try { await callGemini("Halo", env.GEMINI_KEY); result.gemini = "OK"; } catch (e) { result.gemini = "GAGAL: " + e.message; } }
      return jsonResponse(result);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const message = body.message || "";
        const history = body.history || [];
        if (!message.trim()) return jsonResponse({ success: false, error: "Pesan kosong" }, 400);

        const errors = [];
        let reply = null;
        if (env.GROQ_KEY) { try { reply = await callGroq(message, history, env.GROQ_KEY); } catch (e) { errors.push("Groq: " + e.message); } }
        else errors.push("Groq: key tidak ada");
        if (!reply && env.GEMINI_KEY) { try { reply = await callGemini(message, env.GEMINI_KEY); } catch (e) { errors.push("Gemini: " + e.message); } }
        else if (!reply) errors.push("Gemini: key tidak ada");

        if (!reply) return jsonResponse({ success: false, error: errors.join(" | ") }, 500);
        return jsonResponse({ success: true, reply: reply });
      } catch (err) {
        return jsonResponse({ success: false, error: "Error: " + err.message }, 500);
      }
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      if (!env.KV) return jsonResponse({ success: false, error: "KV belum dipasang di wrangler.jsonc" }, 500);
      try {
        const body = await request.json();
        const pass = env.ADMIN_PASSWORD || "pebi2026";
        if (body.password === pass) {
          const token = crypto.randomUUID();
          await env.KV.put("token:" + token, "1", { expirationTtl: 60 * 60 * 24 * 7 });
          return jsonResponse({ success: true, token: token });
        }
        return jsonResponse({ success: false, error: "Password salah" }, 401);
      } catch (err) {
        return jsonResponse({ success: false, error: "Error: " + err.message }, 500);
      }
    }

    if (url.pathname === "/api/comments") {
      if (!env.KV) return jsonResponse({ success: false, error: "KV belum dipasang di wrangler.jsonc" }, 500);

      if (request.method === "GET") {
        const list = (await env.KV.get("comments", "json")) || [];
        return jsonResponse({ success: true, comments: list });
      }

      if (request.method === "POST") {
        try {
          const body = await request.json();
          const name = String(body.name || "").trim().slice(0, 60);
          const address = String(body.address || "").trim().slice(0, 120);
          const text = String(body.text || "").trim().slice(0, 500);
          let stars = parseInt(body.stars, 10);
          if (!stars || stars < 1 || stars > 5) stars = 5;
          if (!name || !text) return jsonResponse({ success: false, error: "Nama dan komentar wajib diisi" }, 400);
          const list = (await env.KV.get("comments", "json")) || [];
          list.unshift({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), name: name, address: address, text: text, stars: stars, time: Date.now() });
          await env.KV.put("comments", JSON.stringify(list.slice(0, 200)));
          return jsonResponse({ success: true });
        } catch (err) {
          return jsonResponse({ success: false, error: "Error: " + err.message }, 500);
        }
      }

      if (request.method === "DELETE") {
        const auth = request.headers.get("Authorization") || "";
        const token = auth.replace("Bearer ", "");
        if (!token || (await env.KV.get("token:" + token)) === null) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        try {
          const body = await request.json();
          const list = (await env.KV.get("comments", "json")) || [];
          await env.KV.put("comments", JSON.stringify(list.filter(c => c.id !== body.id)));
          return jsonResponse({ success: true });
        } catch (err) {
          return jsonResponse({ success: false, error: "Error: " + err.message }, 500);
        }
      }
    }

    if (url.pathname === "/admin" || url.pathname === "/admin/") {
      return new Response(ADMIN_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    const assetRes = await env.ASSETS.fetch(request);
    const ctype = assetRes.headers.get("content-type") || "";
    if (ctype.includes("text/html")) {
      let html = await assetRes.text();
      if (html.indexOf("pebi-upgrade-v5") === -1 && html.indexOf("</body>") !== -1) {
        html = html.replace("</body>", "<script>/*pebi-upgrade-v5*/\n" + UPGRADE_CODE + "\n</script>\n</body>");
      }
      const headers = new Headers(assetRes.headers);
      headers.delete("content-length");
      return new Response(html, { status: assetRes.status, headers: headers });
    }
    return assetRes;
  }
};

var SYSTEM_PROMPT = "Kamu adalah asisten virtual Pebi's Kitchen, bisnis kuliner di Sawangan, Depok yang menjual Dimsum Mentai dan Ceker Mercon. Jawab dalam Bahasa Indonesia dengan ramah, maksimal 3 kalimat. Jangan gunakan simbol markdown seperti ** atau # dalam jawaban. Jika riwayat percakapan berisi nama pelanggan, selalu sapa dengan namanya. Info: Dimsum Mentai Rp 18.000-Rp 70.000, Ceker Mercon Rp 15.000/porsi, Combo Laris Rp 59.000, ongkir kurir toko gratis sampai 5 KM, 6-10 KM gratis jika belanja minimal Rp 80.000, lebih dari 10 KM Rp 10.000 per kelipatan 10 KM, DP 50%, jam operasional Senin-Jumat 11.00-15.00 WIB. Ajak pelanggan memesan lewat tombol Racik Pesanan atau WhatsApp.";

var GROQ_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
var GEMINI_MODELS = ["gemini-2.5-flash", "gemini-3.5-flash"];

async function callGroq(message, history, apiKey) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];
  if (history && history.length) {
    history.slice(-6).forEach(function (h) {
      const content = h.text || h.content || "";
      if (content) messages.push({ role: h.role === "assistant" ? "assistant" : "user", content: String(content) });
    });
  }
  messages.push({ role: "user", content: message });

  let lastError = new Error("Groq tidak tersedia");
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
        body: JSON.stringify({ model: model, messages: messages, max_tokens: 300, temperature: 0.7 })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (content) return content.trim();
        lastError = new Error("Respon Groq kosong");
      } else lastError = new Error("HTTP " + res.status + " (model " + model + ")");
    } catch (e) { lastError = e; }
  }
  throw lastError;
}

async function callGemini(message, apiKey) {
  let lastError = new Error("Gemini tidak tersedia");
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates && data.candidates[0] && data.candidates[0].content &&
          data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
        if (text) return text.trim();
        lastError = new Error("Respon Gemini kosong");
      } else lastError = new Error("HTTP " + res.status + " (model " + model + ")");
    } catch (e) { lastError = e; }
  }
  throw lastError;
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
  }
    
