/* ============================================================
   像素工坊 PixelForge · 结构演示站 — 交互脚本（零依赖）
   连接真实后端：/api/resources · /api/auth/code · /api/auth/login
   （接口不可用时自动回退到静态数据 / 演示提示，保证任何环境可跑）
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Toast（演示提示） ---------- */
  var toastEl;
  window.pfToast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  };
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-demo]') : null;
    if (t) {
      e.preventDefault();
      window.pfToast(t.getAttribute('data-demo') || '演示站：此操作未接入后端');
    }
  });

  /* ---------- 顶部导航：下拉 + 移动端 ---------- */
  var isDesktop = function () { return window.matchMedia('(min-width: 861px)').matches; };
  $$('.nav-item').forEach(function (item) {
    var link = $('.nav-link', item);
    if (!link) return;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var wasOpen = item.classList.contains('open');
      $$('.nav-item.open').forEach(function (i) { i.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
    if (isDesktop()) {
      item.addEventListener('mouseenter', function () { item.classList.add('open'); });
      item.addEventListener('mouseleave', function () { item.classList.remove('open'); });
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.nav-item')) {
      $$('.nav-item.open').forEach(function (i) { i.classList.remove('open'); });
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') $$('.nav-item.open').forEach(function (i) { i.classList.remove('open'); });
  });
  var burger = $('[data-burger]');
  if (burger) {
    burger.addEventListener('click', function () {
      var m = $('#navMenu');
      if (m) m.classList.toggle('open');
    });
  }

  /* ---------- 公告条关闭 ---------- */
  var ac = $('[data-close-announce]');
  if (ac) {
    ac.addEventListener('click', function () {
      var a = $('#announce');
      if (a) a.remove();
    });
  }

  /* ---------- FAQ 手风琴 ---------- */
  $$('.faq-item').forEach(function (item) {
    var q = $('.faq-q', item);
    if (q) {
      q.addEventListener('click', function () { item.classList.toggle('open'); });
    }
  });

  /* ---------- 定价：月付/年付切换 ---------- */
  var btns = $$('.billing-toggle button');
  if (btns.length) {
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        var mode = b.getAttribute('data-mode');
        $$('[data-price-month]').forEach(function (el) {
          var v = mode === 'year' ? el.getAttribute('data-price-year') : el.getAttribute('data-price-month');
          if (v) el.textContent = v;
        });
        $$('[data-unit]').forEach(function (el) {
          el.textContent = mode === 'year' ? '/月 · 年付' : '/月';
        });
      });
    });
  }

  /* ---------- 验证码：优先走真实接口 /api/auth/code ---------- */
  $$('[data-code-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      var phoneEl = document.getElementById('phone');
      var phone = phoneEl ? phoneEl.value.trim() : '';
      var notify = function (msg) { window.pfToast(msg); };

      if (/^1\d{10}$/.test(phone)) {
        fetch('/api/auth/code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phone })
        })
          .then(function (r) { return r.json(); })
          .then(function (j) { notify((j && j.msg) || '验证码已发送'); })
          .catch(function () { notify('验证码已发送（演示环境，不会真的发送）'); });
      } else {
        notify('验证码已发送（演示环境，不会真的发送）');
      }

      var left = 60;
      var raw = btn.textContent;
      btn.disabled = true;
      btn.textContent = left + 's 后重发';
      var t = setInterval(function () {
        left -= 1;
        btn.textContent = left + 's 后重发';
        if (left <= 0) {
          clearInterval(t);
          btn.disabled = false;
          btn.textContent = raw;
        }
      }, 1000);
    });
  });

  /* ---------- 社区：接口优先 → 静态回退 + 筛选 + 搜索 + 加载更多 ---------- */
  var grid = $('#cardGrid');
  if (grid) {
    var FALLBACK = [
      { title: '极简后台管理系统模板', author: '阿Design', likes: 428, cat: '模板', cover: 'c1' },
      { title: '数据可视化图表组件库', author: 'ByteUI', likes: 366, cat: '组件', cover: 'c2' },
      { title: '玻璃拟态 UI 套件', author: '栗子酱', likes: 312, cat: '模板', cover: 'c3' },
      { title: '线性风格图标 1200+', author: 'IconLab', likes: 289, cat: '图标', cover: 'c4' },
      { title: '设计规范一键生成插件', author: '工具人小李', likes: 256, cat: '插件', cover: 'c5' },
      { title: 'AI 生成配色助手', author: 'ColorMind', likes: 233, cat: '插件', cover: 'c6' }
    ];

    var state = { all: [], cat: '全部', q: '', limit: 12 };

    var esc = function (s) {
      return String(s).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
      });
    };

    var render = function () {
      var list = state.all.filter(function (it) {
        var okCat = state.cat === '全部' || it.cat === state.cat;
        var okQ = !state.q || it.title.toLowerCase().indexOf(state.q) > -1;
        return okCat && okQ;
      });
      var shown = list.slice(0, state.limit);
      if (!shown.length) {
        grid.innerHTML = '<div class="empty">没有找到匹配的内容，换个关键词试试 🐴</div>';
      } else {
        grid.innerHTML = shown.map(function (it) {
          return '<article class="ccard" data-cat="' + esc(it.cat) + '">' +
            '<div class="cover ' + esc(it.cover) + '"></div>' +
            '<div class="info"><b>' + esc(it.title) + '</b>' +
            '<span>' + esc(it.author) + ' · ♥ ' + esc(it.likes) + ' · ' + esc(it.cat) + '</span></div></article>';
        }).join('');
      }
      var more = $('[data-load-more]');
      if (more) {
        var rest = list.length - state.limit;
        more.textContent = rest > 0 ? '加载更多（还有 ' + rest + ' 个）' : '已经到底啦 🎉';
        more.disabled = rest <= 0;
      }
    };

    var apply = function (items) {
      state.all = (items && items.length) ? items : FALLBACK;
      render();
    };

    fetch('/api/resources')
      .then(function (r) { if (!r.ok) throw new Error('api down'); return r.json(); })
      .then(function (j) { return Array.isArray(j) ? j : (j.data || []); })
      .then(apply)
      .catch(function () {
        fetch('assets/data/resources.json')
          .then(function (r) { return r.json(); })
          .then(apply)
          .catch(function () { apply(FALLBACK); });
      });

    $$('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('.tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        state.cat = tab.getAttribute('data-cat') || '全部';
        state.limit = 12;
        render();
      });
    });

    var search = $('#commSearch');
    if (search) {
      search.addEventListener('input', function () {
        state.q = search.value.trim().toLowerCase();
        state.limit = 12;
        render();
      });
    }

    var moreBtn = $('[data-load-more]');
    if (moreBtn) {
      moreBtn.addEventListener('click', function () {
        state.limit += 8;
        render();
      });
    }
  }

  /* ---------- 回到顶部 ---------- */
  var tt = $('.to-top');
  if (tt) {
    window.addEventListener('scroll', function () {
      tt.classList.toggle('show', window.scrollY > 600);
    });
    tt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 页脚年份 ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
