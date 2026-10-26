/* =====================================================================
   BURLINGTON ARCADE — hamburger menu + the lists on the Yael and
   Cassandra pages. The words and files live in portal-data.js.
   ===================================================================== */
(function(){
  var me = document.currentScript || document.querySelector('script[src*="portal.js"]');
  var BASE = me.src.replace(/portal\.js.*$/, '');

  function el(tag, cls, text){
    var n = document.createElement(tag);
    if(cls) n.className = cls;
    if(text) n.textContent = text;
    return n;
  }

  /* ---------- hamburger ---------- */
  function buildMenu(){
    var btn = el('button', 'pmenu-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.appendChild(el('span')); btn.appendChild(el('span')); btn.appendChild(el('span'));

    var shade = el('div', 'pmenu-shade');
    var nav = el('nav', 'pmenu');
    nav.setAttribute('aria-label', 'Menu');
    nav.appendChild(el('p', 'pmenu-label', 'Menu'));
    [['Home', '', 'home'], ['Yael', 'yael/', ''], ['Cassandra', 'cassandra/', '']].forEach(function(r){
      var a = el('a', r[2], r[0]);
      a.href = BASE + r[1];
      nav.appendChild(a);
    });

    function set(open){
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('on', open);
      shade.classList.toggle('on', open);
    }
    btn.addEventListener('click', function(){ set(btn.getAttribute('aria-expanded') !== 'true'); });
    shade.addEventListener('click', function(){ set(false); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') set(false); });

    document.body.appendChild(shade);
    document.body.appendChild(nav);
    document.body.appendChild(btn);
  }

  /* ---------- lists ---------- */
  function fileRow(f, label){
    if(!f.file){
      var off = el('div', 'file empty', label + ': coming soon');
      return off;
    }
    var a = el('a', 'file', label);
    a.href = BASE + f.file;
    a.target = '_blank'; a.rel = 'noopener';
    if(f.date) a.appendChild(el('small', '', f.date));
    return a;
  }

  function fillFiles(box, files, emptyText){
    if(!files.length){ box.appendChild(el('div', 'file empty', emptyText)); return; }
    files.forEach(function(f){ box.appendChild(fileRow(f, f.title)); });
  }

  function lists(){
    var P = window.PORTAL;
    if(!P) return;

    var box = document.querySelector('[data-list="clients"]');
    if(box){
      P.clients.forEach(function(c){
        var a = el('a', 'big');
        a.href = BASE + 'yael/client/#' + c.slug;
        a.appendChild(el('span', 'big-t', c.name));
        a.appendChild(el('span', 'big-s', c.files.length
          ? c.files.length + (c.files.length === 1 ? ' file' : ' files')
          : 'No files yet'));
        box.appendChild(a);
      });
    }

    box = document.querySelector('[data-list="exports"]');
    if(box) fillFiles(box, P.exports, 'No exports yet.');

    box = document.querySelector('[data-list="latest"]');
    if(box) P.latest.forEach(function(f){ box.appendChild(fileRow(f, f.label)); });

    box = document.querySelector('[data-list="client"]');
    if(box){
      var slug = location.hash.replace('#', '');
      var c = P.clients.filter(function(x){ return x.slug === slug; })[0];
      if(!c){
        document.getElementById('cName').textContent = 'Client not found';
        box.appendChild(el('div', 'file empty', 'Go back to the client list and pick one.'));
        return;
      }
      document.title = c.name + ' · Burlington Arcade · Fairfax & Sammons';
      document.getElementById('cName').textContent = c.name;
      var sent = document.querySelector('[data-list="client-sent"]');
      c.sent.forEach(function(s){ sent.appendChild(el('li', '', s)); });
      fillFiles(box, c.files, 'No PDFs here yet.');
    }
  }

  function init(){ buildMenu(); lists(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
