var UPGRADE_CODE = String.raw`
(function () {
  'use strict';
  if (typeof window.sendChatMessage !== 'function' || typeof window.chatState === 'undefined') return;
  window.__pebiUpgrade = 'v4';

  var css = document.createElement('style');
  css.textContent = '.pk-card{background:#0d0d0d;border:1px solid rgba(212,175,55,.25);border-radius:12px;overflow:hidden;margin-top:8px}.pk-item{display:flex;gap:10px;padding:10px;border-bottom:1px solid rgba(255,255,255,.05);align-items:center}.pk-item:last-child{border-bottom:none}.pk-n{color:#fff;font-size:12px;font-weight:700}.pk-p{color:#d4af37;font-size:11px;font-weight:600}.pk-add{margin-left:auto;background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.3);color:#d4af37;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer}.pk-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.pk-chip{background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.3);color:#d4af37;border-radius:20px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;text-decoration:none}.pk-sum{background:#0d0d0d;border:1px dashed rgba(212,175,55,.4);border-radius:10px;padding:10px;margin-top:8px;font-size:12px;color:#e5e7eb}';
  document.head.appendChild(css);

  function cleanMarkdown(t) {
    return String(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1').replace(/_(.+?)_/g, '$1').replace(/^#{1,6}\s*/gm, '');
  }

  var unread = 0;
  function updateBadge() {
    var b = document.getElementById('chat-badge');
    if (!b) return;
    if (unread > 0 && !chatState.isOpen) { b.textContent = unread > 9 ? '9+' : String(unread); b.classList.remove('hidden'); }
    else b.classList.add('hidden');
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
    var html = '<div class="pk-sum">📍 Area: <b>' + area + '</b><br>🚚 Jarak dari dapur: <b>' + jarak.toFixed(1) + ' km</b> (garis lurus)<br>💸 Ongkir Kurir Toko: <b>' + o.label + '</b>';
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
})();
`;

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

    const assetRes = await env.ASSETS.fetch(request);
    const ctype = assetRes.headers.get("content-type") || "";
    if (ctype.includes("text/html")) {
      let html = await assetRes.text();
      if (html.indexOf("pebi-upgrade-v4") === -1 && html.indexOf("</body>") !== -1) {
        html = html.replace("</body>", "<script>/*pebi-upgrade-v4*/\n" + UPGRADE_CODE + "\n</script>\n</body>");
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
      
