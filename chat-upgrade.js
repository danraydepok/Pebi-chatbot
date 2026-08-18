/* PEBI CHAT UPGRADE v2 */
(function () {
  'use strict';
  if (typeof sendChatMessage !== 'function' || typeof chatState === 'undefined') return;

  var css = document.createElement('style');
  css.textContent = '.pk-card{background:#0d0d0d;border:1px solid rgba(212,175,55,.25);border-radius:12px;overflow:hidden;margin-top:8px}.pk-item{display:flex;gap:10px;padding:10px;border-bottom:1px solid rgba(255,255,255,.05);align-items:center}.pk-item:last-child{border-bottom:none}.pk-n{color:#fff;font-size:12px;font-weight:700}.pk-p{color:#d4af37;font-size:11px;font-weight:600}.pk-add{margin-left:auto;background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.3);color:#d4af37;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer}.pk-add:hover{background:#d4af37;color:#000}.pk-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.pk-chip{background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.3);color:#d4af37;border-radius:20px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;text-decoration:none}.pk-chip:hover{background:#d4af37;color:#000}.pk-sum{background:#0d0d0d;border:1px dashed rgba(212,175,55,.4);border-radius:10px;padding:10px;margin-top:8px;font-size:12px;color:#e5e7eb}';
  document.head.appendChild(css);

  function cleanMarkdown(t) {
    return String(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1').replace(/_(.+?)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1').replace(/^#{1,6}\s*/gm, '');
  }

  var unread = 0;
  var badge = document.createElement('span');
  badge.style.cssText = 'position:fixed;right:14px;bottom:120px;background:#ef4444;color:#fff;border-radius:9999px;min-width:20px;height:20px;font-size:11px;font-weight:800;display:none;align-items:center;justify-content:center;padding:0 5px;z-index:70;box-shadow:0 0 0 3px rgba(10,10,10,.9);';
  document.body.appendChild(badge);
  function updateBadge() {
    if (unread > 0 && !chatState.isOpen) {
      badge.textContent = unread > 9 ? '9+' : String(unread);
      badge.style.display = 'flex';
    } else badge.style.display = 'none';
  }

  var _addChatMessage = addChatMessage;
  addChatMessage = function (text, sender, extraHTML) {
    if (sender === 'bot') text = cleanMarkdown(text);
    var r = _addChatMessage(text, sender, extraHTML);
    if (sender === 'bot' && !chatState.isOpen) { unread++; updateBadge(); }
    return r;
  };

  var _toggle = toggleChatWidget;
  toggleChatWidget = function () {
    _toggle();
    if (chatState.isOpen) unread = 0;
    updateBadge();
    if (chatState.isOpen) maybeAskName();
  };

  var NAME_KEY = 'pebi_customer_name';
  var awaitingName = false;
  function savedName() { try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; } }
  function cap(s) { s = s.trim().replace(/\s+/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); }
  function maybeAskName() {
    if (savedName() || awaitingName) return;
    awaitingName = true;
    setTimeout(function () { addBotMessage('Ngomong-ngomong, boleh tahu nama Kakak? 😊', '', true); }, 1200);
  }
  (function () {
    var n = savedName();
    if (n && chatState.context.length === 0) {
      chatState.context.push({ role: 'user', text: 'Nama saya ' + n });
      chatState.context.push({ role: 'assistant', text: 'Baik, Kak ' + n + '! 😊 Ada yang bisa saya bantu?' });
    }
  })();

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
      '<button type="button" class="pk-chip" onclick="quickReply(\'ongkir\')">🚚 Info Ongkir</button></div>';
  }

  var _addBot = addBotMessage;
  addBotMessage = function (text, extra, noChips) {
    text = cleanMarkdown(text);
    if (!extra && !noChips) extra = defaultChips();
    return _addBot(text, extra);
  };

  var pendingDimsumQty = 0;
  function parseOrder(t) {
    if (!/\b(pesan|order|beli|mau|ambil|mintak)\b/.test(t)) return null;
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
  function confirmDimsum(s) {
    if (pendingDimsumQty > 0) { ubahQtyVarian('dimsum_' + s, pendingDimsumQty); pendingDimsumQty = 0; }
    addBotMessage('Siap! Dimsum ' + s + ' pcs sudah masuk racikan. 😊', cartSummaryHTML() + orderButtons(), true);
  }
  window.confirmDimsum = confirmDimsum;

  var _send = sendChatMessage;
  sendChatMessage = function () {
    var input = document.getElementById('chat-input');
    var text = input ? input.value.trim() : '';
    var lower = text.toLowerCase();

    if (awaitingName && text && text.length <= 40 && !parseOrder(lower) && !/(menu|harga|ongkir|dp|jam|pesan|order|beli|halo)/.test(lower)) {
      awaitingName = false;
      var nm = cap(text.replace(/[^a-zA-Z\s'.-]/g, '').trim()) || 'Kak';
      try { localStorage.setItem(NAME_KEY, nm); } catch (e) {}
      chatState.context.push({ role: 'user', text: 'Nama saya ' + nm });
      chatState.context.push({ role: 'assistant', text: 'Baik, Kak ' + nm + '! 😊' });
      addUserMessage(text);
      if (input) { input.value = ''; onChatInput(); }
      addBotMessage('Senang bertemu Anda, Kak ' + nm + '! 🥰 Ketik "menu", "ongkir", atau contoh "pesan 2 dimsum 8" ya.', '', true);
      return;
    }

    if (/(lihat menu|daftar menu|^menu$|menu dong|daftar harga|berapa harga|harga)/.test(lower)) {
      addUserMessage(text);
      if (input) { input.value = ''; onChatInput(); }
      showTyping();
      setTimeout(function () { hideTyping(); showMenuCard(); }, 500);
      return;
    }

    var adds = parseOrder(lower);
    if (adds) {
      addUserMessage(text);
      if (input) { input.value = ''; onChatInput(); }
      showTyping();
      setTimeout(function () {
        hideTyping();
        applyOrder(adds);
        if (pendingDimsumQty > 0) {
          addBotMessage('Dicatat! Dimsumnya mau ukuran berapa pcs? Pilih ya: 👇', sizeChips(), true);
        } else {
          var nm2 = savedName();
          addBotMessage('Siap' + (nm2 ? ', Kak ' + nm2 : '') + '! Pesanan sudah saya catat. 😊', cartSummaryHTML() + orderButtons(), true);
        }
      }, 600);
      return;
    }

    return _send();
  };
})();
