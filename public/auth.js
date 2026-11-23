// Login for the web/PWA client. Loaded before app.js.
// - Adds the login token to every /api call
// - Stores it in a cookie so download links and /uploads files also work
// - Shows a login / sign-up screen when no valid login exists
(function () {
  var KEY = 'slidebox_token';
  var token = null;
  try { token = localStorage.getItem(KEY); } catch (e) {}

  function setCookie(t) {
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = 'sb_token=' + (t || '') + '; path=/; SameSite=Lax; max-age=' + (t ? 2592000 : 0) + secure;
  }
  setCookie(token);

  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var isApi = url.indexOf('/api/') === 0 || url.indexOf(location.origin + '/api/') === 0;
    if (isApi && token && !/\/api\/auth\/(login|register)$/.test(url)) {
      init = init || {};
      var h = new Headers(init.headers || (typeof input !== 'string' && input.headers) || {});
      h.set('Authorization', 'Bearer ' + token);
      init.headers = h;
    }
    return realFetch(input, init).then(function (res) {
      if (isApi && res.status === 401 && !/\/api\/auth\//.test(url)) showLogin();
      return res;
    });
  };

  function logout() {
    token = null;
    try { localStorage.removeItem(KEY); } catch (e) {}
    setCookie(null);
    location.reload();
  }
  window.slideboxLogout = logout;

  function showLogin() {
    if (document.getElementById('sb-login')) return;
    var box = document.createElement('div');
    box.id = 'sb-login';
    box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#050505;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,sans-serif';
    box.innerHTML =
      '<form style="width:100%;max-width:340px;background:#111;border:1px solid rgba(212,175,55,.35);border-radius:18px;padding:22px;color:#fff">' +
      '<h2 style="margin:0 0 4px;color:#d4af37;letter-spacing:2px;text-align:center">SLIDEBOX</h2>' +
      '<p id="sb-mode" style="margin:0 0 14px;text-align:center;color:#a3a3a3;font-size:13px">Log in to continue</p>' +
      '<input id="sb-name" placeholder="Full name" style="display:none">' +
      '<input id="sb-email" type="email" placeholder="Email" autocomplete="username">' +
      '<input id="sb-pass" type="password" placeholder="Password (min 6)" autocomplete="current-password">' +
      '<input id="sb-code" placeholder="Instructor code (leave empty if student)" style="display:none">' +
      '<p id="sb-err" style="color:#f87171;font-size:12px;min-height:16px;margin:4px 0"></p>' +
      '<button type="submit" style="width:100%;padding:12px;border:0;border-radius:10px;background:#d4af37;color:#000;font-weight:900;cursor:pointer">Log in</button>' +
      '<p id="sb-toggle" style="text-align:center;color:#d4af37;font-size:12px;cursor:pointer;margin:12px 0 0">No account? Sign up</p>' +
      '</form>';
    var style = document.createElement('style');
    style.textContent = '#sb-login input{width:100%;box-sizing:border-box;margin-bottom:8px;padding:11px;border-radius:10px;border:1px solid #262626;background:#171717;color:#fff;font-size:14px}';
    box.appendChild(style);
    document.body.appendChild(box);

    var register = false;
    var $ = function (id) { return box.querySelector('#' + id); };
    $('sb-toggle').onclick = function () {
      register = !register;
      $('sb-name').style.display = register ? 'block' : 'none';
      $('sb-code').style.display = register ? 'block' : 'none';
      $('sb-mode').textContent = register ? 'Create your account' : 'Log in to continue';
      box.querySelector('button').textContent = register ? 'Create account' : 'Log in';
      $('sb-toggle').textContent = register ? 'Have an account? Log in' : 'No account? Sign up';
    };
    box.querySelector('form').onsubmit = function (ev) {
      ev.preventDefault();
      var body = { email: $('sb-email').value.trim(), password: $('sb-pass').value };
      if (register) { body.name = $('sb-name').value.trim(); body.instructor_code = $('sb-code').value.trim() || undefined; }
      realFetch(register ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok) { $('sb-err').textContent = x.d.error || 'Something went wrong'; return; }
          try { localStorage.setItem(KEY, x.d.token); } catch (e) {}
          setCookie(x.d.token);
          location.reload();
        })
        .catch(function () { $('sb-err').textContent = 'Cannot reach the server'; });
    };
  }

  if (!token) {
    if (document.body) showLogin(); else document.addEventListener('DOMContentLoaded', showLogin);
  }
})();
