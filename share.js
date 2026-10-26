/* =====================================================================
   BURLINGTON ARCADE: SHARE LINK
   The "Share link" buttons call FS.copy("yael/views/#view=8"): it copies
   the full link to that exact view and shows a small "Link copied" note.
   portal.js loads this file on every page.
   ===================================================================== */
(function(){
  if(window.FS) return;
  var me = document.currentScript || document.querySelector('script[src*="share.js"]');
  var BASE = me.src.replace(/share\.js.*$/, '');
  var FS = window.FS = {};

  FS.url = function(rel){ return BASE + rel; };

  var note = null, timer = null;
  FS.toast = function(msg){
    if(!note){
      note = document.createElement('div');
      note.setAttribute('role', 'status');
      note.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483000;background:#161310;color:#F4EFE4;' +
        'padding:11px 16px;font:500 13px/1.4 Inter,system-ui,sans-serif;max-width:90vw;opacity:0;pointer-events:none;transition:opacity .2s ease;text-align:center;word-break:break-all';
      document.body.appendChild(note);
    }
    note.textContent = msg; note.style.opacity = '1';
    clearTimeout(timer); timer = setTimeout(function(){ note.style.opacity = '0'; }, 2800);
  };

  FS.copy = function(rel, msg){
    var u = FS.url(rel);
    function ok(){ FS.toast(msg || 'Link copied. Paste it anywhere to send this exact view.'); }
    function fallback(){
      var t = document.createElement('textarea');
      t.value = u; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;left:-999px;top:0;opacity:0';
      document.body.appendChild(t); t.select();
      var done = false; try{ done = document.execCommand('copy'); }catch(e){}
      t.remove();
      if(done) ok(); else FS.toast(u);   // could not copy: show the link so it can be copied by hand
    }
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok, fallback);
    else fallback();
    return u;
  };
})();
