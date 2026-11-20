/* 미러쏙 홈페이지 스크립트 · 모바일 메뉴, 다운로드 정보(version.json), 문의 폼 */
(function () {
  'use strict';
  // 모바일 메뉴
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.menu-btn');
    if (b) { var m = document.getElementById('mnav'), o = m.classList.toggle('open'); b.setAttribute('aria-expanded', o); }
  });
  var ko = document.documentElement.lang === 'ko';
  var q = new URLSearchParams(location.search);

  // 다운로드 정보: ../version.json {version, size_bytes|size, sha256, url|download_url}
  // HTML에는 생성할 때 값이 이미 들어 있어요(JS가 꺼져도 보임). 여기서는 최신 값으로 갱신만 해요.
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

  // 문의 폼: FormSubmit AJAX (JSON). 상태: 보내는 중 → 성공 / 실패
  var f = document.getElementById('cform');
  if (!f) return;
  var msg = document.getElementById('fmsg'), done = document.getElementById('fdone'), err = document.getElementById('ferr');
  var btn = f.querySelector('button[type=submit]');
  if (q.get('topic')) { var o = f.querySelector('option[value="' + q.get('topic') + '"]'); if (o) o.selected = true; }
  function show(state) {
    f.classList.toggle('sending', state === 'sending'); btn.disabled = state === 'sending'; btn.setAttribute('aria-busy', state === 'sending');
    msg.textContent = state === 'sending' ? f.dataset.msgSending : '';
    f.hidden = state === 'success'; done.hidden = state !== 'success'; err.hidden = state !== 'error';
    if (state === 'success') done.focus(); if (state === 'error') err.focus();
  }
  function invalid() {
    var bad = [];
    f.querySelectorAll('input[required],textarea[required]').forEach(function (el) {
      var ok = el.checkValidity(); el.setAttribute('aria-invalid', !ok); if (!ok) bad.push(el);
    });
    if (bad.length) { msg.textContent = f.dataset.msgInvalid; bad[0].focus(); }
    return bad.length;
  }
  function send() {
    if (invalid()) return;
    var d = {}; new FormData(f).forEach(function (v, k) { d[k] = v; }); d.consent = f.consent.checked ? 'yes' : '';
    show('sending');
    // 서버 없이 FormSubmit의 AJAX 주소로 보내요(받는 메일은 임의 문자열 주소로 가려져 있어요).
    fetch(f.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { if (!x.ok || String(x.j.success) !== 'true') throw x; show('success'); f.reset(); })
      .catch(function () { show('error'); });
  }
  f.addEventListener('submit', function (e) { e.preventDefault(); send(); });
  err.querySelector('[data-retry]').addEventListener('click', send);
  done.querySelector('[data-again]').addEventListener('click', function () { show('idle'); f.querySelector('input[name=name]').focus(); });
  // 시안 확인용: contact.html?state=sending|success|error
  var st = q.get('state'); if (st === 'sending' || st === 'success' || st === 'error') show(st);
})();
