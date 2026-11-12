(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var K = { acc: 'elhana.accounts', cur: 'elhana.cur', snd: 'elhana.sound', cats: 'elhana.cats', pos: 'aliiptv.pos', seen: 'elhana.seen', fav: 'elhana.fav', tf: 'elhana.tf', col: 'elhana.speedcol' };
  var cfg = null, info = null;
  var state = { type: 'live', catId: null, list: [], shown: 0, mode: 'rows', view: 'items', seriesName: '', eps: [] };
  var cache = { cats: {}, streams: {}, m3u: null };
  var PAGE = 120;
  var lastFocus = null;
  var loginMode = 'xtream';
  var timeFmt = store(K.tf) === '12' ? '12' : '24', speedCol = store(K.col) || '#ffffff', splashOn = true;
  var dd = { open: false, opener: null, items: [] };
  var detail = { tok: 0, item: null, type: 'live', idx: 0, list: null, opener: null, eps: {}, seasons: [], season: null, curEps: [], favChanged: false };
  var tokN = 0;
  var play = { live: false, noRetry: false, list: null, index: 0, url: '', master: '', title: '', triedTs: false };

  function store(k, v) {
    try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; }
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function busy(on) { $('loading').classList.toggle('hidden', !on); }
  function two(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------- اللغة / Language ---------- */
  var T = {
    ar: {
      name_ph: 'اسم الحساب  (مثال: حساب البيت)', host_ph: 'رابط السيرفر  أو رابط get.php كامل', user_ph: 'اسم المستخدم', pass_ph: 'كلمة المرور',
      login: 'دخول',
      disc: 'El Hana IPTV مجرد مشغّل وسائط. لا يتضمن التطبيق ولا يوفّر ولا يبيع أي قنوات أو أفلام أو محتوى. لاستخدامه أدخل بيانات اشتراك Xtream Codes أو رابط قائمة M3U الخاص بك من مزوّد الخدمة.',
      need: 'اكمل رابط السيرفر واسم المستخدم وكلمة المرور', modeX: 'Xtream', modeM: 'رابط M3U', m3u_ph: 'رابط قائمة M3U  (http://…)', needM3u: 'اكتب رابط قائمة M3U', m3uEmpty: 'القائمة لا تحتوي على قنوات صالحة', noGroup: 'بدون تصنيف', verifying: 'جاري التحقق…', badauth: 'بيانات الدخول غير صحيحة', inactive: 'الاشتراك غير فعال: ', myacct: 'حسابي',
      badjson: 'رد غير صالح من السيرفر', srvErr: 'خطأ من السيرفر (', connErr: 'تعذر الاتصال بالسيرفر', timeout: 'انتهت مهلة الاتصال',
      expires: 'ينتهي الاشتراك: ', live: 'البث المباشر', movies: 'الأفلام', series: 'المسلسلات', switchAcct: 'تغيير الحساب', soundOn: 'الصوت: شغال', soundOff: 'الصوت: متوقف',
      home: 'الرئيسية', search_ph: 'بحث داخل القسم', hideCats: 'إخفاء الأقسام', showCats: 'إظهار الأقسام', noCats: 'لا توجد أقسام', noContent: 'لا يوجد محتوى',
      searchRes: 'نتائج البحث: ', more: 'عرض المزيد', newb: 'جديد', season: 'الموسم', episode: 'الحلقة', backSeries: 'رجوع إلى المسلسلات', noEps: 'لا توجد حلقات', loading: 'جاري التحميل…',
      newOnSrv: 'جديد على السيرفر: ', movie1: 'فيلم', movieN: 'فيلم', series1: 'مسلسل', seriesN: 'مسلسل', and: 'و',
      resume: 'استكمال من ', buffering: 'جاري التحميل…', cantPlay: 'تعذر تشغيل هذا المحتوى', liveLbl: 'بث مباشر',
      qualOnly: 'تغيير الجودة متاح للقنوات المباشرة متعددة الجودة فقط', qualRead: 'جاري قراءة الجودات المتاحة…', qualOne: 'هذه القناة متاحة بجودة واحدة فقط',
      qualAuto: 'تلقائي (الأعلى)', qLow: '— الأقل', qHigh: '— الأعلى', qTitle: 'الجودة (من الأقل إلى الأعلى)', qDone: 'تم تغيير الجودة', qFail: 'تعذر قراءة الجودات من السيرفر',
      noAudio: 'لا توجد مسارات صوتية أخرى في هذا البث', track: 'مسار', audioDone: 'تم تغيير المسار الصوتي', audioTitle: 'المسار الصوتي / المعلق',
      btnQuality: 'الجودة', btnAudio: 'الصوت / المعلق', rew: 'رجوع 10 ثوان', fwd: 'تقديم 30 ثانية', stop: 'إيقاف',
      exitQ: 'هل تريد الخروج من التطبيق؟', yes: 'نعم', no: 'لا', offline: 'لا يوجد اتصال بالإنترنت', online: 'عاد الاتصال بالإنترنت', back: 'رجوع', settings: 'الإعدادات', fav: 'المفضلة', noFav: 'المفضلة فاضية. افتح أي عنصر واضغط زر القلب لإضافته', favAdd: 'إضافة للمفضلة', favRem: 'إزالة من المفضلة', favAdded: 'تمت الإضافة للمفضلة', favRemoved: 'تمت الإزالة من المفضلة', play: 'تشغيل', setLang: 'اللغة', setTime: 'صيغة الوقت', tf24: '24 ساعة', tf12: '12 ساعة', am: 'ص', pm: 'م', setColor: 'لون شريط السرعة', c_white: 'أبيض', c_black: 'أسود', c_yellow: 'أصفر', c_green: 'أخضر', c_red: 'أحمر', c_blue: 'أزرق', c_orange: 'برتقالي', setSound: 'صوت التنقل', setTest: 'اختبار السرعة', startTest: 'ابدأ الاختبار', testing: 'جاري الاختبار…', testFail: 'تعذر إجراء الاختبار، تأكد من الإنترنت', ping: 'التأخير', download: 'التحميل', upload: 'الرفع', cast: 'الأبطال', director: 'المخرج', nowOn: 'الآن', nextOn: 'التالي', setUpd: 'التحديث', version: 'الإصدار', updCheck: 'تحقق من التحديث', updUrl: 'رابط التحديث', updReset: 'العودة للنسخة الأصلية', save: 'حفظ', updNoUrl: 'اكتب رابط التحديث الأول', updChecking: 'جاري البحث عن تحديث…', updLatest: 'أنت على آخر إصدار', updDone: 'تم تنزيل التحديث… جاري إعادة التشغيل', updReady: 'تحديث جديد جاهز، أعد فتح التطبيق لتفعيله', updFail: 'تعذر التحديث، راجع الرابط والإنترنت', updResetDone: 'تم الرجوع للنسخة الأصلية… جاري إعادة التشغيل', updUrlSaved: 'تم حفظ الرابط', updOff: 'التحديث عن بُعد غير مفعّل في هذه النسخة'
    },
    en: {
      name_ph: 'Account name (e.g. Home)', host_ph: 'Server URL or full get.php link', user_ph: 'Username', pass_ph: 'Password',
      login: 'Sign in',
      disc: 'El Hana IPTV is a media player only. It does not include, provide or sell any channels, movies or other content. To use it, enter your own Xtream Codes subscription details or M3U playlist URL from your service provider.',
      need: 'Please enter the server URL, username and password', modeX: 'Xtream', modeM: 'M3U URL', m3u_ph: 'M3U playlist URL  (http://…)', needM3u: 'Please enter the M3U playlist URL', m3uEmpty: 'The playlist has no valid entries', noGroup: 'Uncategorized', verifying: 'Verifying…', badauth: 'Invalid login details', inactive: 'Subscription is not active: ', myacct: 'My account',
      badjson: 'Invalid response from the server', srvErr: 'Server error (', connErr: 'Cannot connect to the server', timeout: 'Connection timed out',
      expires: 'Expires: ', live: 'Live TV', movies: 'Movies', series: 'Series', switchAcct: 'Switch account', soundOn: 'Sound: On', soundOff: 'Sound: Off',
      home: 'Home', search_ph: 'Search in this section', hideCats: 'Hide categories', showCats: 'Show categories', noCats: 'No categories', noContent: 'No content',
      searchRes: 'Search results: ', more: 'Show more', newb: 'NEW', season: 'Season', episode: 'Episode', backSeries: 'Back to series list', noEps: 'No episodes', loading: 'Loading…',
      newOnSrv: 'New on your server: ', movie1: 'movie', movieN: 'movies', series1: 'series', seriesN: 'series', and: 'and',
      resume: 'Resuming from ', buffering: 'Loading…', cantPlay: 'Unable to play this content', liveLbl: 'LIVE',
      qualOnly: 'Quality switching is only available for live channels with several qualities', qualRead: 'Reading available qualities…', qualOne: 'This channel has only one quality',
      qualAuto: 'Auto (highest)', qLow: '— Lowest', qHigh: '— Highest', qTitle: 'Quality (lowest to highest)', qDone: 'Quality changed', qFail: 'Could not read qualities from the server',
      noAudio: 'No other audio tracks in this stream', track: 'Track', audioDone: 'Audio track changed', audioTitle: 'Audio track / commentary',
      btnQuality: 'Quality', btnAudio: 'Audio / Commentary', rew: 'Back 10 seconds', fwd: 'Forward 30 seconds', stop: 'Stop',
      exitQ: 'Do you want to exit the app?', yes: 'Yes', no: 'No', offline: 'No internet connection', online: 'Internet connection restored', back: 'Back', settings: 'Settings', fav: 'Favorites', noFav: 'No favorites yet. Open any item and press the heart to add it', favAdd: 'Add to favorites', favRem: 'Remove from favorites', favAdded: 'Added to favorites', favRemoved: 'Removed from favorites', play: 'Play', setLang: 'Language', setTime: 'Time format', tf24: '24-hour', tf12: '12-hour', am: 'AM', pm: 'PM', setColor: 'Speed bar colour', c_white: 'White', c_black: 'Black', c_yellow: 'Yellow', c_green: 'Green', c_red: 'Red', c_blue: 'Blue', c_orange: 'Orange', setSound: 'Navigation sound', setTest: 'Speed test', startTest: 'Start test', testing: 'Testing…', testFail: 'Test failed, check your internet connection', ping: 'Latency', download: 'Download', upload: 'Upload', cast: 'Cast', director: 'Director', nowOn: 'Now', nextOn: 'Next', setUpd: 'Updates', version: 'Version', updCheck: 'Check for updates', updUrl: 'Update URL', updReset: 'Back to packaged version', save: 'Save', updNoUrl: 'Enter the update URL first', updChecking: 'Checking for updates…', updLatest: 'You are on the latest version', updDone: 'Update downloaded… restarting', updReady: 'Update ready, reopen the app to apply it', updFail: 'Update failed, check the URL and your connection', updResetDone: 'Reverted to the packaged version… restarting', updUrlSaved: 'URL saved', updOff: 'Remote updates are disabled in this build'
    }
  };
  var LANG = store('elhana.lang') || (/^ar/i.test(navigator.language || '') ? 'ar' : 'en');
  function tr(k) { return (T[LANG] && T[LANG][k]) || T.en[k] || k; }
  function applyLang() {
    var d = document.documentElement; d.lang = LANG; d.dir = LANG === 'ar' ? 'rtl' : 'ltr';
    var n = document.querySelectorAll('[data-i18n]'), i;
    for (i = 0; i < n.length; i++) n[i].textContent = tr(n[i].getAttribute('data-i18n'));
    n = document.querySelectorAll('[data-i18n-ph]');
    for (i = 0; i < n.length; i++) n[i].placeholder = tr(n[i].getAttribute('data-i18n-ph'));
    n = document.querySelectorAll('[data-i18n-title]');
    for (i = 0; i < n.length; i++) n[i].title = tr(n[i].getAttribute('data-i18n-title'));
    n = document.querySelectorAll('.langbtn');
    for (i = 0; i < n.length; i++) n[i].textContent = LANG === 'ar' ? 'English' : 'العربية';
    updSoundBtn(); setLoginMode(loginMode); if (!$('settings').classList.contains('hidden')) updSettings(); if (!$('detail').classList.contains('hidden')) updDetFav();
    toggleCats($('main').classList.contains('nocats'));
  }

  /* ---------- شبكة ---------- */
  function xhr(url, timeout, asText) {
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      x.open('GET', url, true);
      x.timeout = timeout || 45000;
      x.onload = function () {
        if (x.status >= 200 && x.status < 300) {
          if (asText) { resolve({ text: x.responseText, url: x.responseURL || url }); return; }
          try { resolve(JSON.parse(x.responseText)); } catch (e) { reject(new Error(tr('badjson'))); }
        } else reject(new Error(tr('srvErr') + x.status + ')'));
      };
      x.onerror = function () { reject(new Error(tr('connErr'))); };
      x.ontimeout = function () { reject(new Error(tr('timeout'))); };
      x.send();
    });
  }
  function api(action, extra, timeout) {
    return xhr(cfg.host + '/player_api.php?username=' + encodeURIComponent(cfg.user) + '&password=' + encodeURIComponent(cfg.pass) +
      (action ? '&action=' + action : '') + (extra || ''), timeout);
  }

  /* ---------- صوت خفيف عند التنقل ---------- */
  var soundOn = store(K.snd) !== false, ac = null, lastTick = 0;
  function tick() {
    if (!soundOn) return;
    var now = Date.now(); if (now - lastTick < 45) return; lastTick = now;
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      if (!ac) ac = new AC();
      var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = 'sine'; o.frequency.value = 1500;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.06);
    } catch (e) {}
  }
  function updSoundBtn() { $('btnSound').textContent = tr(soundOn ? 'soundOn' : 'soundOff'); }


  /* ---------- M3U ---------- */
  function isM3u() { return !!(cfg && cfg.type === 'm3u'); }
  function setLoginMode(m) {
    loginMode = m; var x = m === 'xtream';
    ['inHost', 'inUser', 'inPass'].forEach(function (id) { $(id).classList.toggle('hidden', !x); });
    $('inM3u').classList.toggle('hidden', x);
    $('btnModeX').classList.toggle('on', x); $('btnModeM').classList.toggle('on', !x);
    $('loginMsg').textContent = '';
  }
  function classify(url) {
    if (/\/movie\//i.test(url)) return 'movies';
    if (/\/series\//i.test(url)) return 'series';
    if (/\.(mp4|mkv|avi|mov|wmv|flv)(\?|#|$)/i.test(url)) return 'movies';
    return 'live';
  }
  function parseM3u(text) {
    var lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
    var out = { live: { cats: [], by: {}, all: [] }, movies: { cats: [], by: {}, all: [] }, series: { cats: [], by: {}, all: [] } };
    var pend = null, grp = '', n = 0;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].trim();
      if (!l) continue;
      if (l.indexOf('#EXTINF') === 0) {
        var attrs = {}, re = /([A-Za-z0-9_-]+)="([^"]*)"/g, m;
        while ((m = re.exec(l))) attrs[m[1].toLowerCase()] = m[2];
        var q = false, ci = -1;
        for (var k = 0; k < l.length; k++) { var ch = l.charAt(k); if (ch === '"') q = !q; else if (ch === ',' && !q) { ci = k; break; } }
        var name = ci >= 0 ? l.substring(ci + 1).trim() : '';
        pend = { name: name || attrs['tvg-name'] || '', icon: attrs['tvg-logo'] || '', group: attrs['group-title'] || grp };
      } else if (l.indexOf('#EXTGRP:') === 0) {
        grp = l.substring(8).trim(); if (pend && !pend.group) pend.group = grp;
      } else if (l.charAt(0) === '#') {
        continue;
      } else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(l)) {
        var e = pend || { name: '', icon: '', group: grp };
        pend = null; n++;
        var t = classify(l), bucket = out[t], g = e.group || tr('noGroup');
        if (!bucket.by[g]) { bucket.by[g] = { id: String(bucket.cats.length), list: [] }; bucket.cats.push({ category_id: bucket.by[g].id, category_name: g }); }
        var item = { name: e.name || l.replace(/^.*\//, ''), stream_icon: e.icon, category_id: bucket.by[g].id, _url: l };
        bucket.by[g].list.push(item); bucket.all.push(item);
      }
    }
    out.count = n;
    return out;
  }
  function m3uList(t, catId) {
    var b = cache.m3u[t];
    if (!catId) return b.all;
    for (var g in b.by) if (Object.prototype.hasOwnProperty.call(b.by, g) && b.by[g].id === catId) return b.by[g].list;
    return [];
  }
  function streamUrl(s) { return s._url || liveUrl(s, 'm3u8'); }
  function attemptM3u(c, remember) {
    var prev = cfg, prevInfo = info;
    cfg = c; $('loginMsg').textContent = tr('verifying');
    xhr(c.url, 120000, true).then(function (r) {
      var d = parseM3u(r.text);
      if (!d.count) throw new Error(tr('m3uEmpty'));
      info = null;
      if (remember) {
        var a = accounts(), idx = -1;
        for (var i = 0; i < a.length; i++) if (a[i].type === 'm3u' && a[i].url === c.url) idx = i;
        if (idx < 0) { a.push(c); idx = a.length - 1; } else a[idx] = c;
        store(K.acc, a); store(K.cur, idx);
      }
      $('loginMsg').textContent = '';
      cache = { cats: {}, streams: {}, m3u: d };
      startMain();
    }).catch(function (e) { cfg = prev; info = prevInfo; $('loginMsg').textContent = e.message; });
  }

  /* ---------- حسابات ---------- */
  function accounts() { var a = store(K.acc); return Array.isArray(a) ? a : []; }
  function parseServer(raw) {
    raw = (raw || '').trim(); if (!raw) return null;
    if (!/^https?:\/\//i.test(raw)) raw = 'http://' + raw;
    var m = raw.match(/^(https?:\/\/[^\/?#]+)/i);
    var out = { host: m ? m[1] : raw.replace(/\/+$/, '') };
    var u = raw.match(/[?&]username=([^&#]+)/i), p = raw.match(/[?&]password=([^&#]+)/i);
    if (u) out.user = decodeURIComponent(u[1]);
    if (p) out.pass = decodeURIComponent(p[1]);
    return out;
  }
  function renderSaved() {
    var a = accounts(), h = '';
    for (var i = 0; i < a.length; i++)
      h += '<div class="chip"><button class="f acct-btn" data-a="' + i + '">' + esc(a[i].name) + '</button><button class="f x" data-del="' + i + '">✕</button></div>';
    $('saved').innerHTML = h;
  }
  function attempt(c, remember) {
    if (c.type === 'm3u') { attemptM3u(c, remember); return; }
    var prev = cfg, prevInfo = info;
    cfg = c; $('loginMsg').textContent = tr('verifying');
    api('').then(function (r) {
      var ui = r && r.user_info;
      if (!ui || String(ui.auth) !== '1') throw new Error(tr('badauth'));
      if (ui.status && ui.status !== 'Active') throw new Error(tr('inactive') + ui.status);
      info = ui;
      if (remember) {
        var a = accounts(), idx = -1;
        for (var i = 0; i < a.length; i++) if (a[i].host === c.host && a[i].user === c.user) idx = i;
        if (idx < 0) { a.push(c); idx = a.length - 1; } else a[idx] = c;
        store(K.acc, a); store(K.cur, idx);
      }
      $('loginMsg').textContent = '';
      cache = { cats: {}, streams: {}, m3u: null };
      startMain();
    }).catch(function (e) { cfg = prev; info = prevInfo; $('loginMsg').textContent = e.message; });
  }
  function doLogin() {
    if (loginMode === 'm3u') {
      var mu = $('inM3u').value.trim();
      if (!mu) { $('loginMsg').textContent = tr('needM3u'); return; }
      if (!/^https?:\/\//i.test(mu)) mu = 'http://' + mu;
      var mn = $('inName').value.trim() || mu.replace(/^https?:\/\//i, '').split('/')[0];
      attempt({ type: 'm3u', name: mn, url: mu }, true); return;
    }
    var s = parseServer($('inHost').value);
    var user = $('inUser').value.trim(), pass = $('inPass').value.trim();
    if (s && s.user && !user) user = s.user;
    if (s && s.pass && !pass) pass = s.pass;
    if (!s || !user || !pass) { $('loginMsg').textContent = tr('need'); return; }
    var name = $('inName').value.trim() || s.host.replace(/^https?:\/\//, '');
    attempt({ name: name, host: s.host, user: user, pass: pass }, true);
  }
  function openAccounts() {
    $('main').classList.add('hidden'); $('home').classList.add('hidden'); $('detail').classList.add('hidden'); $('settings').classList.add('hidden');
    $('login').classList.remove('hidden');
    $('btnLoginBack').classList.toggle('hidden', !cfg);
    $('inPass').value = ''; $('loginMsg').textContent = ''; renderSaved();
    var f = $('saved').querySelector('.f') || $('inName'); f.focus();
  }

  /* ---------- الرئيسية ---------- */
  function startMain() { showHome(); setTimeout(checkNew, 4000); }

  function showHome() {
    $('login').classList.add('hidden'); $('main').classList.add('hidden'); $('detail').classList.add('hidden'); $('settings').classList.add('hidden'); $('home').classList.remove('hidden');
    $('acctName').textContent = cfg ? cfg.name : '';
    if (info && info.exp_date) {
      var d = new Date(+info.exp_date * 1000);
      $('expiry').textContent = tr('expires') + d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
    } else $('expiry').textContent = '';
    var tiles = document.querySelectorAll('.tile'), want = null;
    for (var i = 0; i < tiles.length; i++) {
      var ty = tiles[i].getAttribute('data-type'), empty = isM3u() && ty !== 'fav' && cache.m3u && !cache.m3u[ty].all.length;
      tiles[i].classList.toggle('hidden', !!empty);
      if (!empty) { if (!want) want = tiles[i]; if (ty === state.type) want = tiles[i]; }
    }
    if (want) want.focus();
  }
  function enterSection(t) {
    $('home').classList.add('hidden'); $('main').classList.remove('hidden');
    setType(t, true);
  }

  /* ---------- إشعار الجديد ---------- */
  function toast(t, ms) {
    var e = $('toast'); e.textContent = t; e.classList.remove('hidden');
    clearTimeout(toast.tm); toast.tm = setTimeout(function () { e.classList.add('hidden'); }, ms || 9000);
  }
  function scanNew(list, since, out) {
    if (!Array.isArray(list)) return;
    var top = [];
    for (var i = 0; i < list.length; i++) {
      var ad = +(list[i].added || list[i].last_modified);
      if (ad > since) { out.n++; top.push({ a: ad, n: list[i].name }); }
    }
    top.sort(function (a, b) { return b.a - a.a; });
    for (var j = 0; j < top.length && out.names.length < 3; j++) out.names.push(top[j].n);
  }
  function checkNew() {
    if (!cfg || isM3u()) return;
    var key = K.seen + '.' + cfg.host + '|' + cfg.user, last = store(key), now = Math.floor(Date.now() / 1000);
    if (!last) { store(key, now); return; }
    if (now - last < 6 * 3600) return;
    var mv = { n: 0, names: [] }, sr = { n: 0, names: [] }, c = cfg;
    api('get_vod_streams', '', 120000).then(function (v) {
      scanNew(v, last, mv);
      return api('get_series', '', 120000);
    }).then(function (s) {
      scanNew(s, last, sr);
      if (cfg !== c) return;
      store(key, now);
      if (mv.n + sr.n > 0) {
        var parts = [];
        if (mv.n) parts.push(mv.n + ' ' + tr(mv.n === 1 ? 'movie1' : 'movieN'));
        if (sr.n) parts.push(sr.n + ' ' + tr(sr.n === 1 ? 'series1' : 'seriesN'));
        var nm = mv.names.concat(sr.names).slice(0, 3).join(' · ');
        toast(tr('newOnSrv') + parts.join(' ' + tr('and') + ' ') + (nm ? '  —  ' + nm : ''), 12000);
      }
    }).catch(function () {});
  }

  /* ---------- التصفح ---------- */
  var ACT = {
    live: { cats: 'get_live_categories', list: 'get_live_streams' },
    movies: { cats: 'get_vod_categories', list: 'get_vod_streams' },
    series: { cats: 'get_series_categories', list: 'get_series' }
  };

  function setType(t, focus) {
    state.type = t; state.catId = null; state.view = 'items';
    $('search').value = '';
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('on', tabs[i].getAttribute('data-type') === t);
    $('grid').innerHTML = ''; $('crumb').textContent = ''; $('cats').innerHTML = '';
    loadCats(t).then(function (cats) {
      if (state.type !== t) return;
      var h = '';
      for (var i = 0; i < cats.length; i++)
        h += '<button class="f cat" data-id="' + esc(cats[i].category_id) + '">' + esc(cats[i].category_name) + '</button>';
      $('cats').innerHTML = h || '<div class="empty">' + tr('noCats') + '</div>';
      if (cats.length) openCat(String(cats[0].category_id), focus);
    }).catch(function (e) { busy(false); $('cats').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  function loadCats(t) {
    if (t === 'fav') return Promise.resolve([{ category_id: 'live', category_name: tr('live') }, { category_id: 'movies', category_name: tr('movies') }, { category_id: 'series', category_name: tr('series') }]);
    if (isM3u()) return Promise.resolve(cache.m3u[t].cats);
    if (cache.cats[t]) return Promise.resolve(cache.cats[t]);
    busy(true);
    return api(ACT[t].cats).then(function (r) { busy(false); cache.cats[t] = Array.isArray(r) ? r : []; return cache.cats[t]; });
  }
  function loadStreams(t, catId) {
    if (t === 'fav') { var fl = favList(); return Promise.resolve(catId ? fl.filter(function (x) { return x._t === catId; }) : fl); }
    if (isM3u()) return Promise.resolve(m3uList(t, catId));
    var k = t + ':' + (catId || 'all');
    if (cache.streams[k]) return Promise.resolve(cache.streams[k]);
    busy(true);
    return api(ACT[t].list, catId ? '&category_id=' + encodeURIComponent(catId) : '').then(function (r) {
      busy(false); cache.streams[k] = Array.isArray(r) ? r : []; return cache.streams[k];
    });
  }
  function openCat(id, focus) {
    var t = state.type; state.catId = id; state.view = 'items';
    var btns = document.querySelectorAll('.cat'), name = '';
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-id') === id;
      btns[i].classList.toggle('on', on); if (on) name = btns[i].textContent;
    }
    $('crumb').textContent = name;
    loadStreams(t, id).then(function (list) {
      if (state.type !== t || state.catId !== id) return;
      showList(list);
      if (focus) { var f = $('grid').querySelector('.f') || $('cats').querySelector('.cat.on'); if (f) f.focus(); }
    }).catch(function (e) { busy(false); $('grid').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  function showList(list) {
    state.list = list; state.shown = 0; state.mode = curType() === 'live' ? 'rows' : 'posters';
    $('grid').className = state.mode; $('grid').innerHTML = '';
    if (!list.length) { $('grid').innerHTML = '<div class="empty">' + tr(state.type === 'fav' ? 'noFav' : 'noContent') + '</div>'; return; }
    renderMore(); $('content').scrollTop = 0;
  }
  function renderMore() {
    var old = $('grid').querySelector('.more'); if (old) old.parentNode.removeChild(old);
    var end = Math.min(state.shown + PAGE, state.list.length), h = '', weekAgo = Date.now() / 1000 - 7 * 86400, fset = favSet();
    for (var i = state.shown; i < end; i++) {
      var s = state.list[i], img = s.stream_icon || s.cover || '', nm = String(s.name || '');
      var letter = esc(nm.replace(/^[^A-Za-z0-9\u0600-\u06FF]+/, '').charAt(0) || '•');
      var ty = itemType(s), hrt = fset[favId(s, ty)] ? '<span class="heart">&#9829;</span>' : '', badge = '', nw = '';
      if (ty !== 'live' && s.rating && +s.rating > 0) badge = '<span class="badge">&#9733; ' + (+s.rating).toFixed(1) + '</span>';
      if (+(s.added || s.last_modified) > weekAgo) nw = '<span class="newb">' + tr('newb') + '</span>';
      h += '<button class="f item" data-i="' + i + '"><div class="img"><span class="ph">' + letter + '</span>' +
        (img ? '<img src="' + esc(img) + '" onerror="this.style.display=\'none\'">' : '') + badge + nw + hrt +
        '</div><div class="t">' + esc(nm) + '</div></button>';
    }
    state.shown = end;
    if (end < state.list.length) h += '<button class="f btn more">' + tr('more') + ' (' + (state.list.length - end) + ')</button>';
    $('grid').insertAdjacentHTML('beforeend', h);
  }
  function doSearch() {
    var q = $('search').value.trim().toLowerCase(), t = state.type;
    if (!q) { if (state.catId) openCat(state.catId, false); return; }
    state.view = 'items'; $('crumb').textContent = tr('searchRes') + q;
    loadStreams(t, null).then(function (all) {
      if (state.type !== t) return;
      showList(all.filter(function (s) { return String(s.name).toLowerCase().indexOf(q) !== -1; }));
    }).catch(function (e) { busy(false); $('grid').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
  function toggleCats(force) {
    var m = $('main'), hide = force === undefined ? !m.classList.contains('nocats') : force;
    m.classList.toggle('nocats', hide); store(K.cats, hide);
    $('btnCats').innerHTML = hide ? '&#9776; ' + tr('showCats') : '&#9776; ' + tr('hideCats');
  }

  function liveUrl(s, ext) { return cfg.host + '/live/' + cfg.user + '/' + cfg.pass + '/' + s.stream_id + '.' + ext; }
  function onItem(i) {
    var s = state.list[i]; if (!s) return;
    openDetail(s, itemType(s), i);
  }

  /* ---------- المفضلة ---------- */
  function acctKey() { return cfg ? (cfg.type === 'm3u' ? 'm3u|' + cfg.url : cfg.host + '|' + cfg.user) : ''; }
  function favAll() { var o = store(K.fav); return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {}; }
  function favList() { var a = favAll()[acctKey()]; return Array.isArray(a) ? a : []; }
  function favSet() { var a = favList(), o = {}; for (var i = 0; i < a.length; i++) o[a[i]._id] = 1; return o; }
  function itemType(s) { return s._t || state.type; }
  function curType() { return state.type === 'fav' ? (state.catId || 'live') : state.type; }
  function favId(s, t) { return t + ':' + (s._url || s.stream_id || s.series_id || s.name); }
  function toggleFav(s, t) {
    var all = favAll(), k = acctKey(), a = Array.isArray(all[k]) ? all[k] : [], id = favId(s, t), idx = -1, i;
    for (i = 0; i < a.length; i++) if (a[i]._id === id) idx = i;
    if (idx >= 0) a.splice(idx, 1);
    else a.push({ _id: id, _t: t, name: s.name, stream_icon: s.stream_icon || '', cover: s.cover || '', stream_id: s.stream_id, series_id: s.series_id, container_extension: s.container_extension, rating: s.rating, _url: s._url, category_id: s.category_id });
    all[k] = a; store(K.fav, all);
    return idx < 0;
  }
  function syncHeart(el, on) {
    if (!el || !el.querySelector) return;
    var h = el.querySelector('.heart');
    if (on && !h) el.insertAdjacentHTML('beforeend', '<span class="heart">&#9829;</span>');
    else if (!on && h) h.parentNode.removeChild(h);
  }
  function quickFav() {
    var el = document.activeElement;
    if (!el || !el.classList || !el.classList.contains('item') || !el.hasAttribute('data-i') || $('main').classList.contains('hidden')) return;
    var s = state.list[+el.getAttribute('data-i')]; if (!s) return;
    var on = toggleFav(s, itemType(s)); syncHeart(el, on); toast(tr(on ? 'favAdded' : 'favRemoved'), 1800);
    if (state.type === 'fav' && !on) openCat(state.catId, true);
  }

  /* ---------- صفحة التفاصيل ---------- */
  function pick(o) {
    for (var i = 1; i < arguments.length; i++) { var v = o && o[arguments[i]]; if (v !== undefined && v !== null && String(v).trim() !== '' && String(v) !== '0') return String(v).trim(); }
    return '';
  }
  function b64(x) { try { return decodeURIComponent(escape(atob(x))); } catch (e) { return x || ''; } }
  function detailOpen() { return !$('detail').classList.contains('hidden'); }
  function updDetFav() {
    var on = !!detail.item && !!favSet()[favId(detail.item, detail.type)];
    $('btnDFav').innerHTML = (on ? '&#9829; ' : '&#9825; ') + esc(tr(on ? 'favRem' : 'favAdd'));
    $('btnDFav').classList.toggle('on', on);
  }
  function setPoster(src, name) {
    var im = $('dImg');
    $('dPh').textContent = String(name || '').replace(/^[^A-Za-z0-9\u0600-\u06FF]+/, '').charAt(0) || '\u2022';
    im.style.display = 'none'; im.onload = function () { im.style.display = ''; }; im.onerror = function () { im.style.display = 'none'; };
    im.removeAttribute('src'); if (src) im.src = src;
  }
  function openDetail(s, t, i) {
    var tok = ++tokN;
    detail.tok = tok; detail.item = s; detail.type = t; detail.idx = i; detail.list = state.list; detail.opener = document.activeElement;
    detail.seasons = []; detail.eps = {}; detail.curEps = []; detail.season = null; detail.favChanged = false;
    var series = t === 'series' && !s._url;
    $('dTitle').textContent = s.name || '';
    $('dMeta').textContent = ''; $('dPlot').textContent = ''; $('dExtra').innerHTML = '';
    $('dPoster').classList.toggle('live', t === 'live');
    setPoster(s.cover || s.stream_icon || '', s.name);
    $('btnDPlay').classList.toggle('hidden', series);
    $('btnDSeason').classList.add('hidden'); $('dEps').classList.add('hidden'); $('dEps').innerHTML = '';
    updDetFav();
    $('detail').classList.remove('hidden');
    (series ? $('btnDFav') : $('btnDPlay')).focus();
    if (s._url) return;
    if (t === 'movies') api('get_vod_info', '&vod_id=' + encodeURIComponent(s.stream_id)).then(function (r) { if (tok === detail.tok) fillInfo(r && r.info); }).catch(function () {});
    else if (t === 'series') loadSeries(s, tok);
    else api('get_short_epg', '&stream_id=' + encodeURIComponent(s.stream_id) + '&limit=3').then(function (r) { if (tok === detail.tok) fillEpg(r); }).catch(function () {});
  }
  function fillInfo(inf) {
    inf = inf || {};
    var meta = [], y = pick(inf, 'releasedate', 'release_date', 'releaseDate', 'year'), g = pick(inf, 'genre'), d = pick(inf, 'duration', 'episode_run_time'), rt = pick(inf, 'rating', 'rating_5based');
    var ym = y.match(/\d{4}/); if (ym) y = ym[0];
    if (y) meta.push(y); if (g) meta.push(g); if (d) meta.push(d); if (rt) meta.push('\u2605 ' + rt);
    $('dMeta').textContent = meta.join('  \u00B7  ');
    $('dPlot').textContent = pick(inf, 'plot', 'description');
    var ex = '', c = pick(inf, 'cast', 'actors'), dr = pick(inf, 'director');
    if (c) ex += '<div>' + tr('cast') + ': ' + esc(c) + '</div>';
    if (dr) ex += '<div>' + tr('director') + ': ' + esc(dr) + '</div>';
    $('dExtra').innerHTML = ex;
    var im = pick(inf, 'movie_image', 'cover_big', 'cover');
    if (im && !detail.item.stream_icon && !detail.item.cover) setPoster(im, detail.item.name);
  }
  function fillEpg(r) {
    var l = r && r.epg_listings; if (!Array.isArray(l) || !l.length) return;
    var h = '', i;
    for (i = 0; i < l.length && i < 2; i++) {
      var ts = +l[i].start_timestamp, tm = ts ? fmtClock(new Date(ts * 1000)) : '';
      h += '<div>' + tr(i ? 'nextOn' : 'nowOn') + ': ' + esc(b64(l[i].title)) + (tm ? '  (' + tm + ')' : '') + '</div>';
    }
    $('dExtra').innerHTML = h; $('dPlot').textContent = b64(l[0].description);
  }
  function loadSeries(s, tok) {
    api('get_series_info', '&series_id=' + encodeURIComponent(s.series_id)).then(function (r) {
      if (tok !== detail.tok) return;
      fillInfo(r && r.info);
      var eps = (r && r.episodes) || {}, keys = Object.keys(eps), seasons = [];
      keys.sort(function (a, b) { return (+a) - (+b); });
      keys.forEach(function (k) {
        var arr = Array.isArray(eps[k]) ? eps[k].slice() : [];
        arr.sort(function (a, b) { return (+a.episode_num) - (+b.episode_num); });
        if (arr.length) { detail.eps[k] = arr; seasons.push(k); }
      });
      detail.seasons = seasons;
      if (!seasons.length) { $('dEps').classList.remove('hidden'); $('dEps').innerHTML = '<div class="empty">' + tr('noEps') + '</div>'; return; }
      $('btnDSeason').classList.remove('hidden');
      pickSeason(seasons[0], false);
      $('btnDSeason').focus();
    }).catch(function (e) { if (tok === detail.tok) { $('dEps').classList.remove('hidden'); $('dEps').innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; } });
  }
  function pickSeason(sn, focus) {
    detail.season = sn; detail.curEps = detail.eps[sn] || [];
    $('btnDSeason').innerHTML = esc(tr('season') + ' ' + sn) + ' &#9662;';
    var h = '';
    for (var i = 0; i < detail.curEps.length; i++) {
      var e = detail.curEps[i], du = pick(e.info || {}, 'duration');
      h += '<button class="f ep" data-ep="' + i + '"><span class="ep-t">' + esc(tr('episode') + ' ' + (e.episode_num || (i + 1)) + (e.title ? '  ' + e.title : '')) + '</span>' + (du ? '<span class="ep-d">' + esc(du) + '</span>' : '') + '</button>';
    }
    $('dEps').innerHTML = h; $('dEps').classList.remove('hidden'); $('dEps').scrollTop = 0;
    if (focus) { var f = $('dEps').querySelector('.f'); if (f) f.focus(); }
  }
  function openSeasonMenu() {
    var items = [];
    detail.seasons.forEach(function (sn) {
      items.push({ label: tr('season') + ' ' + sn + '  (' + detail.eps[sn].length + ')', on: sn === detail.season, run: function () { pickSeason(sn, true); } });
    });
    openDd(items, $('btnDSeason'));
  }
  function openDd(items, opener) {
    dd.open = true; dd.items = items; dd.opener = opener;
    var h = '';
    for (var i = 0; i < items.length; i++) h += '<button class="f ddi' + (items[i].on ? ' on' : '') + '" data-d="' + i + '">' + esc(items[i].label) + '</button>';
    var m = $('ddmenu'), r = opener.getBoundingClientRect();
    m.innerHTML = h; m.classList.remove('hidden');
    m.style.top = Math.max(10, r.bottom - 30 + 8) + 'px'; m.style.left = Math.max(10, r.left) + 'px';
    var f = m.querySelector('.ddi.on') || m.querySelector('.ddi'); if (f) f.focus();
  }
  function closeDd(noFocus) {
    if (!dd.open) return;
    dd.open = false; $('ddmenu').classList.add('hidden');
    if (!noFocus && dd.opener) dd.opener.focus();
  }
  function playDetail() {
    var s = detail.item, t = detail.type; if (!s) return;
    if (s._url) { startPlay(s._url, s.name, t === 'live', t === 'live' ? detail.list : null, detail.idx); return; }
    if (t === 'live') startPlay(liveUrl(s, 'm3u8'), s.name, true, detail.list, detail.idx);
    else if (t === 'movies') startPlay(cfg.host + '/movie/' + cfg.user + '/' + cfg.pass + '/' + s.stream_id + '.' + (s.container_extension || 'mp4'), s.name, false);
  }
  function epUrl(e) { return cfg.host + '/series/' + cfg.user + '/' + cfg.pass + '/' + e.id + '.' + (e.container_extension || 'mp4'); }
  function epTitle(i) { var e = detail.curEps[i]; return detail.item.name + ' - ' + tr('season') + ' ' + detail.season + ' ' + tr('episode') + ' ' + (e.episode_num || (i + 1)); }
  function playEp(i) {
    var e = detail.curEps[i]; if (!e) return;
    startPlay(epUrl(e), epTitle(i), false); play.epI = i;
  }
  function closeDetail() {
    closeDd(true);
    $('detail').classList.add('hidden'); detail.tok = ++tokN;
    var op = detail.opener;
    if (state.type === 'fav' && detail.favChanged) { openCat(state.catId, true); return; }
    if (op && document.body.contains(op) && op.focus) op.focus();
    else { var f = $('grid').querySelector('.f'); if (f) f.focus(); }
  }
  function toggleDetailFav() {
    if (!detail.item) return;
    var on = toggleFav(detail.item, detail.type);
    detail.favChanged = true; syncHeart(detail.opener, on); updDetFav();
  }

  /* ---------- الإعدادات ---------- */
  function fmtClock(d) {
    var h = d.getHours(), m = two(d.getMinutes());
    if (timeFmt === '12') { var ap = tr(h < 12 ? 'am' : 'pm'); h = h % 12 || 12; return h + ':' + m + ' ' + ap; }
    return two(h) + ':' + m;
  }
  function applyBarColor() {
    var tb = $('topbar'); tb.style.color = speedCol;
    tb.style.textShadow = speedCol === '#000000' ? '0 0 4px rgba(255,255,255,.75)' : '0 0 4px rgba(0,0,0,.85)';
  }
  function updSettings() {
    var n = document.querySelectorAll('#settings .opt'), i, on;
    for (i = 0; i < n.length; i++) {
      var o = n[i];
      if (o.hasAttribute('data-lang')) on = o.getAttribute('data-lang') === LANG;
      else if (o.hasAttribute('data-tf')) on = o.getAttribute('data-tf') === timeFmt;
      else if (o.hasAttribute('data-col')) on = o.getAttribute('data-col') === speedCol;
      else continue;
      o.classList.toggle('on', on);
    }
    updSoundBtn();
  }
  function showSettings() {
    $('home').classList.add('hidden'); $('settings').classList.remove('hidden');
    updSettings(); updInfo(); updMsg(''); $('btnSetBack').focus();
  }
  function closeSettings() { $('settings').classList.add('hidden'); showHome(); }

  var testing = false;
  var ST_DOWN = ['https://speed.cloudflare.com/__down?bytes=25000000', 'https://proof.ovh.net/files/10Mb.dat'];
  function stPing() {
    return new Promise(function (resolve) {
      var best = null, n = 0;
      (function one() {
        if (n++ >= 3) { resolve(best); return; }
        var x = new XMLHttpRequest(), t0 = Date.now();
        x.open('GET', 'https://speed.cloudflare.com/__down?bytes=0&r=' + t0 + '_' + n, true); x.timeout = 6000;
        x.onload = function () { var d = Date.now() - t0; if (best == null || d < best) best = d; one(); };
        x.onerror = x.ontimeout = function () { resolve(best); };
        x.send();
      })();
    });
  }
  function stDown(cb) {
    return new Promise(function (resolve) {
      var i = 0;
      (function next() {
        if (i >= ST_DOWN.length) { resolve(null); return; }
        var base = ST_DOWN[i++], url = base + (base.indexOf('?') < 0 ? '?' : '&') + 'r=' + Date.now();
        var x = new XMLHttpRequest(), t0 = Date.now(), last = 0, got = 0, done = false;
        function rate() { var dt = (Date.now() - t0) / 1000; return dt > 0.05 ? got * 8 / 1e6 / dt : null; }
        function fin(ok) { if (done) return; done = true; if (ok || got > 0) resolve(rate()); else next(); }
        x.open('GET', url, true); x.responseType = 'arraybuffer'; x.timeout = 20000;
        x.onprogress = function (e) {
          got = e.loaded; var now = Date.now();
          if (now - last > 300) { last = now; var r = rate(); if (r != null) cb(r); }
          if (now - t0 > 8000) { fin(true); try { x.abort(); } catch (er) {} }
        };
        x.onload = function () { if (x.response && x.response.byteLength) got = x.response.byteLength; fin(true); };
        x.onerror = x.ontimeout = function () { fin(false); };
        x.send();
      })();
    });
  }
  function stUp() {
    return new Promise(function (resolve) {
      try {
        var size = 4 * 1024 * 1024, buf = new Uint8Array(size), x = new XMLHttpRequest(), t0 = Date.now(), fin = false;
        x.open('POST', 'https://speed.cloudflare.com/__up?r=' + t0, true); x.timeout = 20000;
        x.setRequestHeader('Content-Type', 'text/plain');
        x.upload.onload = function () { if (fin) return; fin = true; var dt = (Date.now() - t0) / 1000; resolve(dt > 0.02 ? size * 8 / 1e6 / dt : null); };
        x.onerror = x.ontimeout = function () { if (!fin) { fin = true; resolve(null); } };
        x.send(buf);
      } catch (e) { resolve(null); }
    });
  }
  function runSpeedTest() {
    if (testing) return; testing = true;
    var btn = $('btnTest'), res = $('testRes'), out = { ping: null, down: null, up: null };
    btn.textContent = tr('testing');
    function show() {
      res.innerHTML = '<span>' + tr('ping') + ': <b>' + (out.ping == null ? '—' : Math.round(out.ping) + ' ms') + '</b></span>' +
        '<span>&#9660; ' + tr('download') + ': <b>' + (out.down == null ? '—' : out.down.toFixed(1) + ' Mbps') + '</b></span>' +
        '<span>&#9650; ' + tr('upload') + ': <b>' + (out.up == null ? '—' : out.up.toFixed(1) + ' Mbps') + '</b></span>';
    }
    show();
    stPing().then(function (p) { out.ping = p; show(); return stDown(function (v) { out.down = v; show(); }); })
      .then(function (v) { out.down = v; show(); return stUp(); })
      .then(function (v) { out.up = v; show(); })
      .then(function () {
        testing = false; btn.textContent = tr('startTest');
        if (out.ping == null && out.down == null && out.up == null) res.textContent = tr('testFail');
      });
  }

  /* ---------- التحديث من بعيد ---------- */
  function cmpVer(a, b) {
    var x = String(a).split('.'), y = String(b).split('.'), n = Math.max(x.length, y.length);
    for (var i = 0; i < n; i++) { var p = +x[i] || 0, q = +y[i] || 0; if (p !== q) return p > q ? 1 : -1; }
    return 0;
  }
  function otaBase() { return String(store('elhana.otabase') || window.EH_BASE || '').trim().replace(/\/+$/, ''); }
  function updMsg(t) { $('updMsg').textContent = t || ''; }
  function updInfo() {
    $('updVer').textContent = tr('version') + ': ' + (window.EH_VER || '?') + (window.EH_OTA ? '  (OTA)' : '');
    var b = otaBase(); $('updBase').textContent = b || '—';
  }
  function checkUpdate(manual) {
    if (window.EH_ENABLED === false) { if (manual) updMsg(tr('updOff')); return Promise.resolve(); }
    var base = otaBase();
    if (!base) { if (manual) updMsg(tr('updNoUrl')); return Promise.resolve(); }
    if (manual) updMsg(tr('updChecking'));
    var ver = null, files = {};
    return xhr(base + '/version.json?t=' + Date.now(), 15000).then(function (r) {
      ver = r && r.version;
      if (!ver) throw new Error('v');
      if (cmpVer(ver, window.EH_VER) <= 0) { if (manual) updMsg(tr('updLatest')); return null; }
      var names = ['index.html', 'style.css', 'app.js'], chain = Promise.resolve();
      names.forEach(function (n) {
        chain = chain.then(function () { return xhr(base + '/' + n + '?t=' + Date.now(), 60000, true).then(function (x) { files[n] = x.text; }); });
      });
      return chain.then(function () {
        if (!files['app.js'] || files['app.js'].length < 5000 || !files['style.css'] || files['style.css'].length < 500 || !/<body/i.test(files['index.html'] || '')) throw new Error('bad');
        store('elhana.ota', { version: ver, index: files['index.html'], css: files['style.css'], js: files['app.js'] });
        if (manual) { updMsg(tr('updDone')); setTimeout(function () { location.reload(); }, 1200); }
        else toast(tr('updReady'), 8000);
      });
    }).catch(function () { if (manual) updMsg(tr('updFail')); });
  }
  function autoUpdate() { if (!playerOpen()) checkUpdate(false); }
  function resetUpdate() {
    try { localStorage.removeItem('elhana.ota'); localStorage.removeItem('elhana.otaTry'); } catch (e) {}
    updMsg(tr('updResetDone')); setTimeout(function () { location.reload(); }, 1200);
  }

  /* ---------- شاشة الترحيب ---------- */
  function startSplash() {
    var sp = $('splash');
    setTimeout(function () {
      sp.classList.add('out'); splashOn = false;
      setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 500);
    }, 2500);
  }

  /* ---------- المشغل ---------- */
  var ICO_PLAY = '<svg viewBox="0 0 24 24" width="46" height="46" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  var ICO_PAUSE = '<svg viewBox="0 0 24 24" width="46" height="46" fill="#fff"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  var osdTimer = null, msgTimer = null, menu = { open: false, items: [], opener: null };

  function fmt(t) { t = Math.max(0, Math.floor(t || 0)); var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return (h ? h + ':' + two(m) : m) + ':' + two(s); }
  function say(t) { var m = $('playerMsg'); m.textContent = t; m.classList.remove('hidden'); clearTimeout(msgTimer); msgTimer = setTimeout(function () { m.classList.add('hidden'); }, 3500); }
  function playerOpen() { return !$('player').classList.contains('hidden'); }
  function pbFocused() { var a = document.activeElement; return !!(a && a.classList && (a.classList.contains('pb') || a.classList.contains('pm'))); }
  function updPlayBtn() { $('pbPlay').innerHTML = $('video').paused ? ICO_PLAY : ICO_PAUSE; }

  function showOsd(focusPlay) {
    $('osd').classList.remove('hidden'); updPlayBtn();
    clearTimeout(osdTimer);
    osdTimer = setTimeout(function () { if (!menu.open) hideOsd(); }, 6000);
    if (focusPlay) $('pbPlay').focus();
  }
  function hideOsd() {
    closeMenu(true); $('osd').classList.add('hidden');
    if (pbFocused()) document.activeElement.blur();
  }

  function startPlay(url, title, live, list, index) {
    lastFocus = document.activeElement;
    play.live = live; play.list = list || null; play.index = index || 0; play.epI = null;
    $('player').classList.remove('hidden');
    load(url, title);
  }
  function load(url, title) {
    var v = $('video');
    play.url = url; play.master = url; play.triedTs = false; play.noRetry = isM3u(); play.title = title;
    $('osd').classList.toggle('live', play.live);
    $('osdTitle').textContent = title; $('osdFill').style.width = '0';
    $('osdTime').textContent = play.live ? tr('liveLbl') : '';
    showOsd(false);
    v.src = url; v.play();
  }
  function closePlayer() {
    if (!playerOpen()) return;
    var v = $('video');
    savePos(); hideOsd(); play.epI = null;
    v.pause(); v.removeAttribute('src'); v.load();
    $('player').classList.add('hidden');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function savePos() {
    var v = $('video');
    if (!play.live && v.duration && v.currentTime > 30 && v.currentTime < v.duration - 60) {
      var p = store(K.pos) || {}; p[play.url] = v.currentTime;
      var ks = Object.keys(p); if (ks.length > 200) delete p[ks[0]];
      store(K.pos, p);
    }
  }
  function zap(d) {
    if (!play.live || !play.list) return;
    var n = play.index + d; if (n < 0 || n >= play.list.length) return;
    play.index = n; load(streamUrl(play.list[n]), play.list[n].name);
  }
  function seek(d) { var v = $('video'); if (!play.live) { v.currentTime = Math.max(0, v.currentTime + d); showOsd(false); } }
  function togglePlay() { var v = $('video'); if (v.paused) v.play(); else v.pause(); }

  function initVideo() {
    var v = $('video');
    v.addEventListener('timeupdate', function () {
      if (!play.live && v.duration) {
        $('osdFill').style.width = (v.currentTime / v.duration * 100) + '%';
        $('osdTime').textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration);
      }
    });
    v.addEventListener('loadedmetadata', function () {
      if (play.live) return;
      var p = store(K.pos), tm = p && p[play.url];
      if (tm) { v.currentTime = tm; say(tr('resume') + fmt(tm)); }
    });
    v.addEventListener('play', updPlayBtn); v.addEventListener('pause', updPlayBtn);
    v.addEventListener('waiting', function () { say(tr('buffering')); });
    v.addEventListener('playing', function () { $('playerMsg').classList.add('hidden'); });
    v.addEventListener('ended', function () {
      if (play.live) return;
      var n = play.epI;
      if (n != null && detail.curEps && n + 1 < detail.curEps.length) { play.epI = n + 1; load(epUrl(detail.curEps[n + 1]), epTitle(n + 1)); }
      else closePlayer();
    });
    v.addEventListener('error', function () {
      if (play.live && !play.noRetry && !play.triedTs && /\.m3u8$/.test(play.url)) {
        play.triedTs = true; play.url = play.url.replace(/\.m3u8$/, '.ts'); play.master = play.url; v.src = play.url; v.play(); return;
      }
      say(tr('cantPlay'));
    });
  }

  /* قوائم الجودة والصوت */
  function openMenu(title, items, opener) {
    menu.open = true; menu.items = items; menu.opener = opener;
    var h = '<div class="pm-title">' + esc(title) + '</div>';
    for (var i = 0; i < items.length; i++) h += '<button class="f pm' + (items[i].on ? ' on' : '') + '" data-i="' + i + '">' + esc(items[i].label) + '</button>';
    var m = $('pmenu'); m.innerHTML = h; m.classList.remove('hidden');
    clearTimeout(osdTimer);
    var f = m.querySelector('.pm.on') || m.querySelector('.pm'); if (f) f.focus();
  }
  function closeMenu(noFocus) {
    if (!menu.open) return;
    menu.open = false; $('pmenu').classList.add('hidden');
    if (!noFocus && menu.opener) menu.opener.focus();
    showOsd(false);
  }
  function parseMaster(text, base) {
    var lines = text.split(/\r?\n/), out = [], origin = (base.match(/^https?:\/\/[^\/]+/) || [''])[0], dir = base.replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('#EXT-X-STREAM-INF') !== 0) continue;
      var bw = (lines[i].match(/BANDWIDTH=(\d+)/) || [0, 0])[1], rs = lines[i].match(/RESOLUTION=(\d+)x(\d+)/), uri = '';
      for (var j = i + 1; j < lines.length; j++) { if (lines[j] && lines[j].charAt(0) !== '#') { uri = lines[j].trim(); break; } }
      if (!uri) continue;
      var abs = /^https?:/i.test(uri) ? uri : (uri.charAt(0) === '/' ? origin + uri : dir + uri);
      out.push({ bw: +bw, h: rs ? +rs[2] : 0, url: abs });
    }
    out.sort(function (a, b) { return a.bw - b.bw; });
    return out;
  }
  function openQuality(btn) {
    if (!play.live || !/\.m3u8/.test(play.master)) { say(tr('qualOnly')); return; }
    say(tr('qualRead'));
    xhr(play.master, 15000, true).then(function (r) {
      var vs = parseMaster(r.text, r.url);
      if (vs.length < 2) { say(tr('qualOne')); return; }
      var v = $('video'), items = [{ label: tr('qualAuto'), url: play.master, on: play.url === play.master }];
      for (var i = 0; i < vs.length; i++) {
        var lb = (vs[i].h ? vs[i].h + 'p' : Math.round(vs[i].bw / 1000) + ' kbps') + (vs[i].bw ? '  (' + (vs[i].bw / 1e6).toFixed(1) + ' Mbps)' : '');
        if (i === 0) lb += '  ' + tr('qLow'); if (i === vs.length - 1) lb += '  ' + tr('qHigh');
        items.push({ label: lb, url: vs[i].url, on: play.url === vs[i].url });
      }
      items.forEach(function (it) { it.run = function () { play.url = it.url; v.src = it.url; v.play(); say(tr('qDone')); }; });
      openMenu(tr('qTitle'), items, btn);
    }).catch(function () { say(tr('qFail')); });
  }
  function openAudio(btn) {
    var at = $('video').audioTracks;
    if (!at || at.length < 2) { say(tr('noAudio')); return; }
    var items = [];
    for (var i = 0; i < at.length; i++) (function (i) {
      var t = at[i], lb = t.label || t.language || (tr('track') + ' ' + (i + 1));
      if (t.label && t.language) lb += '  (' + t.language + ')';
      items.push({ label: lb, on: !!t.enabled, run: function () { for (var j = 0; j < at.length; j++) at[j].enabled = (j === i); say(tr('audioDone')); } });
    })(i);
    openMenu(tr('audioTitle'), items, btn);
  }
  function pbAction(act, btn) {
    if (act === 'rew') seek(-10);
    else if (act === 'fwd') seek(30);
    else if (act === 'play') { togglePlay(); showOsd(false); }
    else if (act === 'stop' || act === 'back') closePlayer();
    else if (act === 'quality') openQuality(btn);
    else if (act === 'audio') openAudio(btn);
  }

  function playerKey(k, e) {
    var v = $('video');
    if (menu.open || pbFocused()) {
      if (k === 37) { e.preventDefault(); showOsd(false); if (!menu.open) move('left'); }
      else if (k === 39) { e.preventDefault(); showOsd(false); if (!menu.open) move('right'); }
      else if (k === 38) { e.preventDefault(); move('up'); }
      else if (k === 40) { e.preventDefault(); move('down'); }
      else if (k === 415) { e.preventDefault(); v.play(); }
      else if (k === 19) { e.preventDefault(); v.pause(); }
      else if (k === 413) { e.preventDefault(); closePlayer(); }
      return; // Enter يعمل كضغطة على الزر
    }
    e.preventDefault();
    if (k === 13) showOsd(true);
    else if (k === 415 || k === 179) { togglePlay(); showOsd(false); }
    else if (k === 19) { v.pause(); showOsd(false); }
    else if (k === 413) closePlayer();
    else if (k === 39 || k === 417) seek(30);
    else if (k === 37 || k === 412) seek(-10);
    else if (k === 38 || k === 427) { if (play.live) zap(-1); else showOsd(true); }
    else if (k === 40 || k === 428) { if (play.live) zap(1); else showOsd(true); }
  }

  /* ---------- شريط السرعة ---------- */
  var sp = { b: 0, t: 0, down: null, up: null, probing: false, upT: 0 };
  function updSpeed() {
    var d = new Date(); $('tbClock').textContent = fmtClock(d);
    var v = $('video'), txt = '—';
    if (playerOpen() && !v.paused && !v.ended) {
      var b = (v.webkitVideoDecodedByteCount || 0) + (v.webkitAudioDecodedByteCount || 0), now = Date.now();
      if (b > 0 && sp.t && b >= sp.b) { sp.down = (b - sp.b) * 8 / 1e6 / ((now - sp.t) / 1000); }
      else if (b === 0 && navigator.connection && navigator.connection.downlink) { sp.down = navigator.connection.downlink; }
      sp.b = b; sp.t = now;
      if (sp.down != null) txt = sp.down.toFixed(1) + ' Mbps';
    } else { sp.t = 0; sp.b = 0; }
    $('spDown').innerHTML = '&#9660; ' + txt;
    $('spUp').innerHTML = '&#9650; ' + (sp.up != null ? sp.up.toFixed(1) + ' Mbps' : '—');
    if (cfg && !isM3u() && !sp.probing && Date.now() - sp.upT > 30000) probeUp();
  }
  function probeUp() {
    sp.probing = true; sp.upT = Date.now();
    try {
      var size = 262144, buf = new Uint8Array(size), x = new XMLHttpRequest(), t0 = Date.now();
      x.open('POST', cfg.host + '/', true); x.timeout = 15000;
      x.setRequestHeader('Content-Type', 'application/octet-stream');
      x.upload.onload = function () { var dt = (Date.now() - t0) / 1000; if (dt > 0.02) sp.up = size * 8 / 1e6 / dt; };
      x.onloadend = function () { sp.probing = false; };
      x.send(buf);
    } catch (e) { sp.probing = false; }
  }

  /* ---------- التنقل بالريموت ---------- */
  function focusables() {
    var root;
    if (exitOpen()) root = $('exitdlg');
    else if (playerOpen()) root = menu.open ? $('pmenu') : $('osd');
    else if (dd.open) root = $('ddmenu');
    else if (detailOpen()) root = $('detail');
    else if (!$('settings').classList.contains('hidden')) root = $('settings');
    else if (!$('main').classList.contains('hidden')) root = $('main');
    else if (!$('home').classList.contains('hidden')) root = $('home');
    else root = $('login');
    var all = root.querySelectorAll('.f'), out = [];
    for (var i = 0; i < all.length; i++) if (all[i].offsetWidth > 0) out.push(all[i]);
    return out;
  }
  function move(dir) {
    var cur = document.activeElement, list = focusables();
    if (!cur || !cur.classList || !cur.classList.contains('f')) { if (list[0]) { list[0].focus(); tick(); } return; }
    var r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, best = null, bs = 1e9;
    for (var i = 0; i < list.length; i++) {
      var el = list[i]; if (el === cur) continue;
      var b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2, dx = x - cx, dy = y - cy, main, cross;
      if (dir === 'left') { if (dx >= -2 || b.right > r.left + 4) continue; main = -dx; cross = Math.abs(dy); }
      else if (dir === 'right') { if (dx <= 2 || b.left < r.right - 4) continue; main = dx; cross = Math.abs(dy); }
      else if (dir === 'up') { if (dy >= -2) continue; main = -dy; cross = Math.abs(dx); }
      else { if (dy <= 2) continue; main = dy; cross = Math.abs(dx); }
      var sc = main + cross * 2.5;
      if (sc < bs) { bs = sc; best = el; }
    }
    if (best) { best.focus(); if (best.scrollIntoView) best.scrollIntoView({ block: 'nearest' }); tick(); }
  }

  /* الرجوع */
  var lastBack = 0;
  function goBack() {
    lastBack = Date.now();
    if (exitOpen()) { hideExit(); return; }
    var ae = document.activeElement;
    if (playerOpen()) {
      if (menu.open) closeMenu(false);
      else if (pbFocused()) hideOsd();
      else closePlayer();
      return;
    }
    if (dd.open) { closeDd(false); return; }
    if (detailOpen()) { closeDetail(); return; }
    if (!$('settings').classList.contains('hidden')) { closeSettings(); return; }
    if (!$('login').classList.contains('hidden')) {
      if (ae && ae.tagName === 'INPUT') { $('btnLogin').focus(); return; }
      if (cfg) { showHome(); return; }
      showExit(); return;
    }
    if (!$('main').classList.contains('hidden')) { showHome(); return; }
    showExit();
  }
  function exitOpen() { return $('exitdlg').classList.contains('show'); }
  var exitFocus = null;
  function showExit() {
    if (exitOpen()) return;
    exitFocus = document.activeElement;
    $('exitdlg').classList.add('show'); $('btnExitNo').focus();
    setTimeout(function () { if (exitOpen()) $('btnExitNo').focus(); }, 60);
  }
  function hideExit() {
    $('exitdlg').classList.remove('show');
    if (exitFocus && exitFocus.focus) exitFocus.focus();
  }
  function exitApp() {
    // custom exit dialog is shown by the app, so close directly (LG: use window.close(), not platformBack, with a custom popup)
    window.close();
  }
  document.addEventListener('keydown', function (e) {
    var k = e.keyCode;
    if (splashOn) { e.preventDefault(); return; }
    if (exitOpen()) {
      if (k === 461 || k === 27) { e.preventDefault(); hideExit(); }
      else if (k === 37) { e.preventDefault(); move('left'); }
      else if (k === 39) { e.preventDefault(); move('right'); }
      return;
    }
    if (k === 461 || k === 27) {
      e.preventDefault(); goBack(); return;
    }
    if (playerOpen()) { playerKey(k, e); return; }
    if (k === 37) { e.preventDefault(); move('left'); }
    else if (k === 39) { e.preventDefault(); move('right'); }
    else if (k === 38) { e.preventDefault(); move('up'); }
    else if (k === 40) { e.preventDefault(); move('down'); }
    else if (k === 403) quickFav();
    else if (k === 13 && document.activeElement && document.activeElement.id === 'search') doSearch();
  });

  document.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== document && !(t.classList && t.classList.contains('f'))) t = t.parentNode;
    if (!t || t === document) return;
    var c = t.classList;
    if (c.contains('pb')) pbAction(t.getAttribute('data-act'), t);
    else if (c.contains('pm')) { var it = menu.items[+t.getAttribute('data-i')]; closeMenu(false); if (it && it.run) it.run(); }
    else if (c.contains('cat')) { $('search').value = ''; openCat(t.getAttribute('data-id'), true); }
    else if (c.contains('tab')) setType(t.getAttribute('data-type'), false);
    else if (c.contains('tile')) enterSection(t.getAttribute('data-type'));
    else if (c.contains('more')) renderMore();
    else if (c.contains('ddi')) { var di = dd.items[+t.getAttribute('data-d')]; closeDd(true); if (di && di.run) di.run(); }
    else if (t.hasAttribute('data-i')) onItem(+t.getAttribute('data-i'));
    else if (t.hasAttribute('data-ep')) playEp(+t.getAttribute('data-ep'));
    else if (t.hasAttribute('data-lang')) { LANG = t.getAttribute('data-lang'); store('elhana.lang', LANG); applyLang(); updSettings(); }
    else if (t.hasAttribute('data-tf')) { timeFmt = t.getAttribute('data-tf'); store(K.tf, timeFmt); updSpeed(); updSettings(); }
    else if (t.hasAttribute('data-col')) { speedCol = t.getAttribute('data-col'); store(K.col, speedCol); applyBarColor(); updSettings(); }
    else if (t.id === 'btnTest') runSpeedTest();
    else if (t.id === 'btnUpd') checkUpdate(true);
    else if (t.id === 'btnUpdUrl') { $('inUpdUrl').value = otaBase(); $('inUpdUrl').classList.remove('hidden'); $('btnUpdSave').classList.remove('hidden'); $('inUpdUrl').focus(); }
    else if (t.id === 'btnUpdSave') { var uv = $('inUpdUrl').value.trim(); if (uv && !/^https?:\/\//i.test(uv)) uv = 'https://' + uv; store('elhana.otabase', uv); $('inUpdUrl').classList.add('hidden'); $('btnUpdSave').classList.add('hidden'); updInfo(); updMsg(tr('updUrlSaved')); $('btnUpdUrl').focus(); }
    else if (t.id === 'btnUpdReset') resetUpdate();
    else if (t.id === 'btnSettings') showSettings();
    else if (t.id === 'btnSetBack') closeSettings();
    else if (t.id === 'btnLoginBack') showHome();
    else if (t.id === 'btnDBack') closeDetail();
    else if (t.id === 'btnDPlay') playDetail();
    else if (t.id === 'btnDFav') toggleDetailFav();
    else if (t.id === 'btnDSeason') openSeasonMenu();
    else if (t.hasAttribute('data-a')) { var a = accounts()[+t.getAttribute('data-a')]; if (a) attempt(a, true); }
    else if (t.hasAttribute('data-del')) {
      var arr = accounts(); arr.splice(+t.getAttribute('data-del'), 1); store(K.acc, arr); renderSaved();
      var nf = $('saved').querySelector('.f') || $('inName'); nf.focus();
    }
    else if (t.id === 'btnModeX') setLoginMode('xtream');
    else if (t.id === 'btnModeM') setLoginMode('m3u');
    else if (t.id === 'btnLogin') doLogin();
    else if (t.id === 'btnExitYes') exitApp();
    else if (t.id === 'btnExitNo') hideExit();
    else if (c.contains('langbtn')) { LANG = LANG === 'ar' ? 'en' : 'ar'; store('elhana.lang', LANG); applyLang(); if (!$('home').classList.contains('hidden')) showHome(); }
    else if (t.id === 'btnLogout2') openAccounts();
    else if (t.id === 'btnHome') showHome();
    else if (t.id === 'btnCats') { toggleCats(); var g = $('grid').querySelector('.f'); if (g && $('main').classList.contains('nocats')) g.focus(); }
    else if (t.id === 'btnSound') { soundOn = !soundOn; store(K.snd, soundOn); updSoundBtn(); if (soundOn) tick(); }
  });

  /* Magic Remote pointer: hovering focuses the control under the pointer */
  document.addEventListener('mouseover', function (e) {
    var x = e.target;
    while (x && x !== document && !(x.classList && x.classList.contains('f'))) x = x.parentNode;
    if (x && x !== document && x.tagName !== 'INPUT' && document.activeElement !== x) x.focus();
  });
  window.addEventListener('offline', function () { toast(tr('offline'), 6000); });
  window.addEventListener('online', function () { toast(tr('online'), 4000); });

  /* ---------- بدء ---------- */
  initVideo(); toggleCats(store(K.cats) === true); applyLang(); applyBarColor(); startSplash(); setTimeout(autoUpdate, 8000);
  setInterval(updSpeed, 1000); updSpeed();
  (function () {
    var old = store('aliiptv.cfg');
    if (old && old.host && !accounts().length) { store(K.acc, [{ name: tr('myacct'), host: old.host, user: old.user, pass: old.pass }]); store(K.cur, 0); }
    var a = accounts(), cur = store(K.cur);
    if (typeof cur === 'number' && cur >= 0 && a[cur]) { attempt(a[cur], false); }
    else { renderSaved(); (($('saved').querySelector('.f')) || $('inName')).focus(); }
  })();
  try { localStorage.removeItem('elhana.otaTry'); } catch (e) {}
  window.EH_OK = true;
})();
