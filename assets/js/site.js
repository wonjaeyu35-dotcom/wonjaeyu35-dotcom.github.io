/* 미러쏙 홈페이지 스크립트 · 모바일 메뉴, 다운로드 정보(version.json), 문의·베타·의견 폼 */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.menu-btn');
    if (b) { var m = document.getElementById('mnav'), o = m.classList.toggle('open'); b.setAttribute('aria-expanded', o); }
  });
  var ko = document.documentElement.lang === 'ko';
  var q = new URLSearchParams(location.search);

  var card = document.querySelector('[data-ver-card]');
  if (card && window.fetch) {
    fetch('../version.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw r; return r.json(); }).then(function (v) {
      var bytes = v.size_bytes || v.size || 0;
      var mb = (Math.round(bytes / 1048576 * 10) / 10).toFixed(1);
      var set = function (k, t) { document.querySelectorAll('[data-ver="' + k + '"]').forEach(function (el) { el.textContent = t; }); };
      set('version', v.version); set('sha256', v.sha256); set('size', ko ? '약 ' + mb + 'MB' : 'About ' + mb + ' MB');
      var act = card.querySelector('.dlact'), a = act.querySelector('[data-dl]'), note = act.querySelector('[data-dl-note]');
      var label = a.lastChild;
      var href = v.url || v.download_url;
      if (href) {
        a.href = href; a.setAttribute('download', ''); a.firstChild.textContent = 'download'; label.textContent = act.dataset.lOn;
        if (note) note.hidden = true;
      } else {
        a.href = 'contact.html?topic=download'; a.removeAttribute('download'); a.firstChild.textContent = 'mail'; label.textContent = act.dataset.lOff;
        if (note) note.hidden = false;
      }
      card.dataset.loaded = '1';
    }).catch(function () { /* 읽지 못하면 생성 때 넣은 값을 그대로 보여 줘요 */ });
  }

  // 문의·베타·의견 폼: FormSubmit AJAX. 파일이 있으면 FormData, 없으면 JSON.
  var f = document.querySelector('form.form');
  if (!f) return;
  var msg = document.getElementById('fmsg'), done = document.getElementById('fdone'), err = document.getElementById('ferr');
  var btn = f.querySelector('button[type=submit]');
  var MAX_FILE = 10 * 1048576;
  function fillFromQuery() {
    ['topic', 'type', 'version', 'purpose'].forEach(function (k) {
      var v = q.get(k); if (!v) return;
      var el = f.querySelector('[name="' + k + '"]'); if (!el) return;
      if (el.tagName === 'SELECT') {
        var o = el.querySelector('option[value="' + v.replace(/"/g, '') + '"]');
        if (o) el.value = v;
      } else {
        el.value = v;
      }
    });
  }
  fillFromQuery();
  function show(state) {
    f.classList.toggle('sending', state === 'sending'); btn.disabled = state === 'sending'; btn.setAttribute('aria-busy', state === 'sending');
    msg.textContent = state === 'sending' ? f.dataset.msgSending : '';
    f.hidden = state === 'success'; done.hidden = state !== 'success'; err.hidden = state !== 'error';
    if (state === 'success') done.focus(); if (state === 'error') err.focus();
  }
  function invalid() {
    var bad = [];
    f.querySelectorAll('input[required],textarea[required],select[required]').forEach(function (el) {
      var ok = el.checkValidity(); el.setAttribute('aria-invalid', !ok); if (!ok) bad.push(el);
    });
    var file = f.querySelector('input[type=file]');
    if (file && file.files && file.files[0] && file.files[0].size > MAX_FILE) {
      file.setAttribute('aria-invalid', 'true'); bad.push(file); msg.textContent = f.dataset.msgFile || f.dataset.msgInvalid;
    }
    if (bad.length) { if (!msg.textContent) msg.textContent = f.dataset.msgInvalid; bad[0].focus(); }
    return bad.length;
  }
  function payload() {
    var file = f.querySelector('input[type=file]');
    var hasFile = file && file.files && file.files[0];
    if (hasFile) {
      var fd = new FormData(f);
      if (f.consent) fd.set('consent', f.consent.checked ? 'yes' : '');
      return { body: fd, headers: { 'Accept': 'application/json' } };
    }
    var d = {}; new FormData(f).forEach(function (v, k) { if (k === 'attachment') return; d[k] = v; });
    if (f.consent) d.consent = f.consent.checked ? 'yes' : '';
    return { body: JSON.stringify(d), headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
  }
  function send() {
    if (invalid()) return;
    var p = payload();
    show('sending');
    fetch(f.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), { method: 'POST', headers: p.headers, body: p.body })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { if (!x.ok || String(x.j.success) !== 'true') throw x; show('success'); f.reset(); fillFromQuery(); })
      .catch(function () { show('error'); });
  }
  f.addEventListener('submit', function (e) { e.preventDefault(); send(); });
  if (err) err.querySelector('[data-retry]').addEventListener('click', send);
  if (done) done.querySelector('[data-again]').addEventListener('click', function () {
    show('idle');
    var first = f.querySelector('input:not([type=hidden]):not([type=checkbox]),select,textarea');
    if (first) first.focus();
  });
  var st = q.get('state'); if (st === 'sending' || st === 'success' || st === 'error') show(st);
})();
