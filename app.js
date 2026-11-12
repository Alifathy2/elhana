(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var K = { acc: 'elhana.accounts', cur: 'elhana.cur', snd: 'elhana.sound', cats: 'elhana.cats', pos: 'aliiptv.pos', seen: 'elhana.seen', fav: 'elhana.fav', tf: 'elhana.tf', col: 'elhana.speedcol', toff: 'elhana.toff' };
  var cfg = null, info = null;
  var state = { type: 'live', catId: null, list: [], shown: 0, mode: 'rows', view: 'items', seriesName: '', eps: [] };
  var cache = { cats: {}, streams: {}, m3u: null };
  var PAGE = 120;
  var lastFocus = null;
  var loginMode = 'xtream';
  var timeFmt = store(K.tf) === '12' ? '12' : '24', speedCol = store(K.col) || '#ffffff', splashOn = true;
  var timeOffset = +(store(K.toff) || 0);
  var dd = { open: false, opener: null, items: [] };
  var detail = { tok: 0, item: null, type: 'live', idx: 0, list: null, opener: null, eps: {}, seasons: [], season: null, curEps: [], favChanged: false };
  var tokN = 0;
  var play = { live: false, noRetry: false, list: null, index: 0, url: '', master: '', title: '', triedTs: false };

  function store(k, v) {
    try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; }
  }
  function nowMs() { return Date.now() + timeOffset; }
  function nowDate() { return new Date(nowMs()); }
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
      exitQ: 'هل تريد الخروج من التطبيق؟', yes: 'نعم', no: 'لا', offline: 'لا يوجد اتصال بالإنترنت', online: 'عاد الاتصال بالإنترنت', back: 'رجوع', settings: 'الإعدادات', fav: 'المفضلة', noFav: 'المفضلة فاضية. افتح أي عنصر واضغط زر القلب لإضافته', favAdd: 'إضافة للمفضلة', favRem: 'إزالة من المفضلة', favAdded: 'تمت الإضافة للمفضلة', favRemoved: 'تمت الإزالة من المفضلة', play: 'تشغيل', setLang: 'اللغة', setTime: 'الوقت وصيغة العرض', tf24: '24 ساعة', tf12: '12 ساعة', timeSync: 'ضبط الوقت تلقائياً', timeReset: 'وقت التلفزيون', timeSyncing: 'جاري مزامنة الوقت مع الإنترنت…', timeSynced: 'تم ضبط الوقت الحالي بنجاح', timeSyncFail: 'تعذر ضبط الوقت، تأكد من اتصال الإنترنت', timeCur: 'الوقت الحالي: ', am: 'ص', pm: 'م', setColor: 'لون شريط السرعة', c_white: 'أبيض', c_black: 'أسود', c_yellow: 'أصفر', c_green: 'أخضر', c_red: 'أحمر', c_blue: 'أزرق', c_orange: 'برتقالي', setSound: 'صوت التنقل', setTest: 'اختبار السرعة', startTest: 'ابدأ الاختبار', testing: 'جاري الاختبار…', testFail: 'تعذر إجراء الاختبار، تأكد من الإنترنت', ping: 'التأخير', download: 'التحميل', upload: 'الرفع', cast: 'الأبطال', director: 'المخرج', nowOn: 'الآن', nextOn: 'التالي', setUpd: 'التحديث', version: 'الإصدار', updCheck: 'تحقق من التحديث', updUrl: 'رابط التحديث', updReset: 'العودة للنسخة الأصلية', save: 'حفظ', updNoUrl: 'اكتب رابط التحديث الأول', updChecking: 'جاري البحث عن تحديث…', updLatest: 'أنت على آخر إصدار', updDone: 'تم تنزيل التحديث… جاري إعادة التشغيل', updReady: 'تحديث جديد جاهز، أعد فتح التطبيق لتفعيله', updFail: 'تعذر التحديث، راجع الرابط والإنترنت', updResetDone: 'تم الرجوع للنسخة الأصلية… جاري إعادة التشغيل', updUrlSaved: 'تم حفظ الرابط', updOff: 'التحديث عن بُعد غير مفعّل في هذه النسخة'
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
      exitQ: 'Do you want to exit the app?', yes: 'Yes', no: 'No', offline: 'No internet connection', online: 'Internet connection restored', back: 'Back', settings: 'Settings', fav: 'Favorites', noFav: 'No favorites yet. Open any item and press the heart to add it', favAdd: 'Add to favorites', favRem: 'Remove from favorites', favAdded: 'Added to favorites', favRemoved: 'Removed from favorites', play: 'Play', setLang: 'Language', setTime: 'Time & format', tf24: '24-hour', tf12: '12-hour', timeSync: 'Sync time automatically', timeReset: 'Use TV time', timeSyncing: 'Syncing time with internet…', timeSynced: 'Current time synced successfully', timeSyncFail: 'Time sync failed, check internet connection', timeCur: 'Current time: ', am: 'AM', pm: 'PM', setColor: 'Speed bar colour', c_white: 'White', c_black: 'Black', c_yellow: 'Yellow', c_green: 'Green', c_red: 'Red', c_blue: 'Blue', c_orange: 'Orange', setSound: 'Navigation sound', setTest: 'Speed test', startTest: 'Start test', testing: 'Testing…', testFail: 'Test failed, check your internet connection', ping: 'Latency', download: 'Download', upload: 'Upload', cast: 'Cast', director: 'Director', nowOn: 'Now', nextOn: 'Next', setUpd: 'Updates', version: 'Version', updCheck: 'Check for updates', updUrl: 'Update URL', updReset: 'Back to packaged version', save: 'Save', updNoUrl: 'Enter the update URL first', updChecking: 'Checking for updates…', updLatest: 'You are on the latest version', updDone: 'Update downloaded… restarting', updReady: 'Update ready, reopen the app to apply it', updFail: 'Update failed, check the URL and your connection', updResetDone: 'Reverted to the packaged version… restarting', updUrlSaved: 'URL saved', updOff: 'Remote updates are disabled in this build'
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

  /* ---------- مزامنة الوقت ---------- */
  function updTimeInfo(prefix) {
    var el = $('timeSyncMsg');
    if (!el) return;
    var d = nowDate();
    var dt = d.getFullYear() + '/' + two(d.getMonth() + 1) + '/' + two(d.getDate()) + '  ' + fmtClock(d);
    el.textContent = (prefix ? prefix + '  —  ' : '') + tr('timeCur') + dt;
  }
  function syncTime(manual) {
    if (manual && $('timeSyncMsg')) $('timeSyncMsg').textContent = tr('timeSyncing');
    var urls = ['https://speed.cloudflare.com/__down?bytes=0&t=' + Date.now(), 'https://api.github.com/zen?t=' + Date.now()];
    var i = 0;
    function tryNext() {
      if (i >= urls.length) {
        if (manual) updTimeInfo(tr('timeSyncFail'));
        return;
      }
      var u = urls[i++], x = new XMLHttpRequest(), t0 = Date.now();
      x.open('GET', u, true);
      x.timeout = 8000;
      x.onload = function () {
        var hdr = x.getResponseHeader('Date');
        if (hdr) {
          var srv = Date.parse(hdr);
          if (!isNaN(srv)) {
            var rtt = Date.now() - t0;
            timeOffset = (srv + Math.round(rtt / 2)) - Date.now();
            store(K.toff, timeOffset);
            updSpeed();
            if (manual) updTimeInfo(tr('timeSynced'));
            return;
          }
        }
        tryNext();
      };
      x.onerror = x.ontimeout = tryNext;
      x.send();
    }
    tryNext();
  }
  function resetTimeOffset() {
    timeOffset = 0;
    store(K.toff, 0);
    updSpeed();
    updTimeInfo();
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
    var key = K.seen + '.' + cfg.host + '|' + cfg.user, last = store(key), now = Math.floor(nowMs() / 1000);
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
    var end = Math.min(state.shown + PAGE, state.list.length), h = '', weekAgo = nowMs() / 1000 - 7 * 86400, fset = favSet();
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
    updTimeInfo();
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
        x