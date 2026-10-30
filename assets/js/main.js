/* 絵画・造形教室アイビーオープン
   メニュー・動き・固定ボタン・申込みフォーム。外部ライブラリなし */
(function () {
  'use strict';

  window.ivyReady = true;
  var root = document.documentElement;

  /* ---------- メニュー（スマホ） ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  var scrim = document.querySelector('.scrim');
  var closeBtn = document.querySelector('.nav__close');

  function setMenu(open) {
    if (!nav || !burger) return;
    nav.classList.toggle('is-open', open);
    scrim.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', String(open));
    if (open) closeBtn.focus();
  }

  if (burger && nav) {
    burger.addEventListener('click', function () { setMenu(true); });
    closeBtn.addEventListener('click', function () { setMenu(false); burger.focus(); });
    scrim.addEventListener('click', function () { setMenu(false); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
  }

  /* ---------- 開いたときの動きのスキップ ---------- */
  function finishIntro() {
    root.classList.add('intro-done');
    ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(function (t) {
      window.removeEventListener(t, finishIntro);
    });
  }
  if (root.classList.contains('js-motion') && !root.classList.contains('intro-done')) {
    ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach(function (t) {
      window.addEventListener(t, finishIntro, { passive: true });
    });
    window.setTimeout(function () {
      finishIntro();
      try { sessionStorage.setItem('ivy-intro', '1'); } catch (e) { /* 保存できなくても動く */ }
    }, 1400);
  }

  /* ---------- スクロールで出る動き ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showAll() { reveals.forEach(function (el) { el.classList.add('is-in'); }); }

  if (!root.classList.contains('js-motion') || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });

    reveals.forEach(function (el) {
      /* 今の画面幅で表示していない要素（PC専用・スマホ専用）は待たない */
      if (el.getClientRects().length === 0) el.classList.add('is-in');
      else io.observe(el);
    });
  }

  /* ---------- スマホ固定ボタン：フォームが見えたら隠す ---------- */
  var fixbar = document.querySelector('.fixbar');
  var formArea = document.getElementById('apply');
  if (fixbar && formArea && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      fixbar.classList.toggle('is-hidden', entries[0].isIntersecting);
    }).observe(formArea);
  }

  /* ---------- 申込みフォーム ----------
     確認用のページなので、入力内容はどこにも送らない。
     検証が通ったら thanks ページへ移動するだけ */
  var form = document.getElementById('apply-form');
  if (!form) return;

  var submit = form.querySelector('[type="submit"]');
  var gradeField = document.getElementById('field-grade');
  var grade = document.getElementById('grade');

  submit.disabled = false;

  function chosenClass() {
    var r = form.querySelector('input[name="class"]:checked');
    return r ? r.value : '';
  }

  function syncGrade() {
    if (!gradeField) return;
    var page = form.getAttribute('data-page');
    var v = chosenClass();
    /* TOPで未選択のときは見せておき、大人を選んだら隠す */
    var show = v === 'kids' || (v === '' && page === 'top');
    gradeField.hidden = !show;
    if (!show) showError('grade', '');
  }

  function showError(id, msg) {
    var box = document.getElementById('err-' + id);
    var el = document.getElementById(id);
    if (box) { box.textContent = msg; box.hidden = !msg; }
    if (el && el.classList.contains('input')) {
      if (msg) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    }
  }

  var rules = [
    ['class', function () { return chosenClass() ? '' : '参加するクラスを1つ選んでください。'; }],
    ['name', function () { return document.getElementById('name').value.trim() ? '' : 'お名前を入力してください。'; }],
    ['grade', function () {
      return !gradeField || gradeField.hidden || chosenClass() !== 'kids' || grade.value ? '' : 'お子さんの学年を選んでください。';
    }],
    ['email', function () {
      var v = document.getElementById('email').value.trim();
      if (!v) return 'メールアドレスを入力してください。';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'メールアドレスの形を確認してください（例：name@example.com）。';
    }],
    ['agree', function () { return document.getElementById('agree').checked ? '' : '個人情報の取り扱いへの同意にチェックを入れてください。'; }]
  ];

  form.addEventListener('change', function (e) {
    if (e.target.name === 'class') { syncGrade(); showError('class', ''); }
  });
  form.addEventListener('input', function (e) {
    if (e.target.id) showError(e.target.id, '');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    rules.forEach(function (rule) {
      var msg = rule[1]();
      showError(rule[0], msg);
      if (msg && !first) first = rule[0];
    });
    if (first) {
      var target = document.getElementById(first) || form.querySelector('input[name="class"]');
      target.focus();
      return;
    }
    window.location.href = form.getAttribute('data-thanks');
  });

  syncGrade();
})();
