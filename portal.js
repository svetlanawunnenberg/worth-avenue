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
    /* [label, path, small line]; a row with no path starts a new section */
    var here = location.href.split('#')[0].split('?')[0].replace(/index\.html$/, '');
    [['Menu'],
     ['Dashboard', '', 'Overview, tools and map'],
     ['Fairfax Team'],
     ['360 Viewer', 'scan/#skip=1', 'Walk the building, every floor'],
     ['Navigation from Floorplan + 360', 'navigation/#floorplan-360', '360 on the plan and on the Worth Avenue elevation'],
     ['Navigation from Floorplan + Renderings', 'navigation/#floorplan-renderings', 'Every rendering placed on the plan'],
     ['Presentations', 'exports/', 'Every presentation we have sent'],
     ['Current Site', 'cassandra/toolkit/', 'The building today, Angle Finder for stills'],
     ['Partners'],
     ['Yael', 'yael/', 'Latest presentation, views, clients'],
     ['Yael · Views', 'yael/views/', 'Every rendering, unbranded'],
     ['Yael · Clients', 'yael/clients/', 'What was delivered for each client'],
     ['Cassandra', 'cassandra/', '360 toolkit, exports, full dashboard']
    ].forEach(function(r, i){
      if(r.length === 1){ nav.appendChild(el('p', 'pmenu-label' + (i ? ' next' : ''), r[0])); return; }
      var a = el('a', BASE + r[1] === here ? 'here' : '', r[0]);
      a.href = BASE + r[1];
      a.appendChild(el('small', '', r[2]));
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

    /* big buttons on Yael's page that open the newest file: <a data-latest="deck">; a missing file stays "coming soon" */
    var btns = document.querySelectorAll('[data-latest]');
    for(var b = 0; b < btns.length; b++){
      var item = P.latest.filter(function(x){ return x.key === btns[b].getAttribute('data-latest'); })[0];
      var sub = btns[b].querySelector('.big-s');
      if(item && item.file){
        btns[b].href = BASE + item.file; btns[b].target = '_blank'; btns[b].rel = 'noopener';
        if(sub && item.date) sub.textContent = (item.note ? item.note + ' · ' : '') + item.date;
      } else {
        btns[b].classList.add('off'); btns[b].removeAttribute('href');
        if(sub) sub.textContent = 'Coming soon';
      }
    }

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

  /* ---------- header: the same on every page, change it here ---------- */
  function buildHeader(){
    var band = document.querySelector('.header-band');
    if(!band) return;
    band.className = 'header-band site-head';
    band.innerHTML = '';
    var home = el('a', 'sh-logo');
    home.href = BASE;
    home.setAttribute('aria-label', 'Home');
    var logo = el('img');
    logo.src = BASE + 'assets/header-logo.jpg';
    logo.alt = 'Fairfax & Sammons, New York ~ Palm Beach';
    home.appendChild(logo);
    var elev = el('img', 'sh-elev');
    elev.src = BASE + 'assets/header-elevation.jpg';
    elev.alt = 'The Worth Avenue street elevation of 150 Worth Avenue';
    band.appendChild(home);
    band.appendChild(elev);
    band.appendChild(el('p', 'sh-title', '150 Worth Avenue'));
  }

  /* ---------- search: one box that finds any page, view, 360 spot, presentation or client ----------
     To add something, add a line to EXTRA below: [title, small line, link, extra words]. */
  var EXTRA = [
    ['Dashboard', 'Home', '', 'home start overview map'],
    ['360 Viewer', 'Walk the building, every floor', 'scan/#skip=1', 'scan pano panorama look around walk'],
    ['360 · Floor 2', '360 Viewer', 'scan/#floor=F2&skip=2', 'second floor upstairs level 2'],
    ['360 · Floor 1 Interior', '360 Viewer', 'scan/#floor=F1&skip=2', 'first floor ground gallery via arcade level 1'],
    ['360 · Floor 1 Exterior', '360 Viewer, Worth Avenue facade', 'scan/#floor=F1X&skip=2', 'facade street outside exterior'],
    ['360 · Basement', '360 Viewer, parking', 'scan/#floor=B&skip=2', 'garage parking cars lower level'],
    ['360 · Designed view, Worth Avenue', '360 Viewer, the design on the facade', 'scan/#s=Fasad__Scan_464__designed&y=94.8&p=-0.6&f=100&skip=2', 'designed renovated proposed after facade'],
    ['Navigation', 'Floorplan + 360 and Floorplan + Renderings', 'navigation/', 'navigate both'],
    ['Navigation from Floorplan + 360', 'Navigation', 'navigation/#floorplan-360', 'plan spots dots'],
    ['Navigation from Floorplan + Renderings', 'Navigation', 'navigation/#floorplan-renderings', 'plan views renderings'],
    ['360 on the Plan', 'Ten spots on the floor plan', 'plan360/', 'plan spots dots'],
    ['360 on the Elevation', 'Six spots along Worth Avenue', 'elevation360/', 'elevation street facade'],
    ['Floorplan & Views', 'Every rendering on the plan', 'floorplan/', 'plan renderings views pin present walkthrough pdf'],
    ['Presentations', 'Every presentation we have sent', 'exports/', 'exports pdf deck pitch', 'team'],
    ['Current Site', 'The building today, Angle Finder for stills', 'cassandra/toolkit/', 'toolkit angle finder site today existing'],
    ['Google Maps', '150 Worth Avenue, Palm Beach', 'https://www.google.com/maps/search/?api=1&query=150+Worth+Ave%2C+Palm+Beach%2C+FL+33480', 'map location directions'],
    ['Google Earth', '150 Worth Avenue, Palm Beach, in 3D', 'https://earth.google.com/web/@26.70050,-80.03522,6a,350d,35y,0h,60t,0r', 'map 3d earth aerial'],
    ['Yael', 'Partner page', 'yael/', 'partner'],
    ['Yael · Views', 'Every rendering, unbranded', 'yael/views/', 'renderings pictures gallery'],
    ['Yael · Clients', 'What was delivered for each client', 'yael/clients/', 'tenants brands retailers'],
    ['Yael · Latest', 'Latest floor plan and deck', 'yael/latest/', 'latest newest'],
    ['Cassandra', 'Partner page', 'cassandra/', 'partner'],
    ['Full dashboard', 'Cassandra', 'cassandra/dashboard/', 'dashboard everything'],
    ['Spot 1 · Arcade entrance from the Esplanade', '360 on the Plan, Level 1', 'plan360/#spot=1', ''],
    ['Spot 2 · Arcade entrance from Worth Avenue', '360 on the Plan, Level 1', 'plan360/#spot=2', ''],
    ['Spot 3 · Arcade gallery, central', '360 on the Plan, Level 1', 'plan360/#spot=3', ''],
    ['Spot 4 · Arcade gallery, east bend', '360 on the Plan, Level 1', 'plan360/#spot=4', ''],
    ['Spot 5 · West court', '360 on the Plan, Level 1', 'plan360/#spot=5', ''],
    ['Spot 6 · Former Saks space', '360 on the Plan, Level 1', 'plan360/#spot=6', 'saks'],
    ['Spot 7 · West gallery', '360 on the Plan, Level 2', 'plan360/#spot=7', 'second floor'],
    ['Spot 8 · Central gallery', '360 on the Plan, Level 2', 'plan360/#spot=8', 'second floor'],
    ['Spot 9 · East bend', '360 on the Plan, Level 2', 'plan360/#spot=9', 'second floor'],
    ['Spot 10 · East suite', '360 on the Plan, Level 2', 'plan360/#spot=10', 'second floor'],
    ['Worth Avenue · Far right', '360 on the Elevation', 'scan/#s=Fasad__Scan_471&y=90.1&skip=2', 'facade street'],
    ['Worth Avenue · Where the arches start', '360 on the Elevation', 'scan/#s=Fasad__Scan_465&y=90.1&skip=2', 'facade street arches'],
    ['Worth Avenue · Where the arches stop', '360 on the Elevation', 'scan/#s=Fasad__Scan_458&y=89.7&skip=2', 'facade street arches'],
    ['Worth Avenue · The 150 Worth entrance', '360 on the Elevation', 'scan/#s=Fasad__Scan_452&y=89.8&skip=2', 'facade street entrance door'],
    ['Worth Avenue · The five bays', '360 on the Elevation', 'scan/#s=Fasad__Scan_448&y=87.7&skip=2', 'facade street bays'],
    ['Worth Avenue · The garages', '360 on the Elevation', 'scan/#s=Fasad__Scan_443&y=88.5&skip=2', 'facade street garage']
  ];
  var VIEW_NOS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17];

  function searchItems(){
    var items = [];
    var partner = /\/yael\//.test(location.pathname);   // Yael only ever sees unbranded files
    EXTRA.forEach(function(r){
      if(r[4] === 'team' && partner) return;
      var ext = /^https?:/.test(r[2]);
      items.push({ t:r[0], s:r[1], u:ext ? r[2] : BASE + r[2], k:r[3], tab:ext });
    });
    VIEW_NOS.forEach(function(n){
      items.push({ t:'View ' + n, s:'Rendering', u:BASE + 'yael/views/#view=' + n, k:'rendering picture image v' + n });
      items.push({ t:'View ' + n + ' on the plan', s:'Floorplan & Views', u:BASE + 'floorplan/#v=V' + n, k:'rendering plan pin v' + n });
    });
    var P = window.PORTAL;
    if(P){
      if(!partner) (P.exports || []).forEach(function(f){
        if(f.file) items.push({ t:f.title, s:'Presentation · ' + f.date, u:BASE + f.file, k:'pdf deck presentation', tab:true });
      });
      (P.latest || []).forEach(function(f){
        if(f.file) items.push({ t:f.label, s:'Latest · ' + f.date, u:BASE + f.file, k:'pdf latest', tab:true });
      });
      (P.clients || []).forEach(function(c){
        items.push({ t:c.name, s:'Client', u:BASE + 'yael/client/#' + c.slug, k:'client tenant brand ' + c.sent.join(' ') });
        c.files.forEach(function(f){
          items.push({ t:c.name + ' · ' + f.title, s:'Client file · ' + f.date, u:BASE + f.file, k:'pdf client', tab:true });
        });
      });
    }
    return items;
  }

  function buildSearch(){
    if(!window.PORTAL){                       // some pages do not load the list of files; fetch it quietly
      var sd = document.createElement('script'); sd.src = BASE + 'portal-data.js'; document.head.appendChild(sd);
    }
    var btn = el('button', 'psearch-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Search');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2"/></svg>';

    var box = el('div', 'psearch');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Search');
    var input = el('input');
    input.type = 'search';
    input.placeholder = 'Search views, 360 spots, presentations, clients';
    input.setAttribute('aria-label', 'Search');
    var list = el('div', 'psearch-list');
    box.appendChild(input); box.appendChild(list);

    function run(){
      var q = input.value.toLowerCase().trim(), out = [];
      list.innerHTML = '';
      if(!q){ list.appendChild(el('p', 'psearch-hint', 'Try "view 8", "basement", "entrance", "deck" or a client name.')); return; }
      var parts = q.split(/\s+/);
      searchItems().forEach(function(x){
        var w = (x.t + ' ' + x.s + ' ' + x.k).toLowerCase(), t = x.t.toLowerCase();
        if(!parts.every(function(p){ return w.indexOf(p) > -1; })) return;
        x.score = t === q ? 0 : t.indexOf(q) === 0 ? 1 : t.indexOf(q) > -1 ? 2 : 3;
        out.push(x);
      });
      out.sort(function(a, b){ return a.score - b.score; });
      if(!out.length){ list.appendChild(el('p', 'psearch-hint', 'Nothing found for "' + input.value + '".')); return; }
      out.slice(0, 30).forEach(function(x){
        var a = el('a', '', x.t);
        a.href = x.u;
        if(x.tab){ a.target = '_blank'; a.rel = 'noopener'; }
        a.appendChild(el('small', '', x.s));
        list.appendChild(a);
      });
    }
    function set(open){
      box.classList.toggle('on', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if(open){ run(); setTimeout(function(){ input.focus(); }, 30); }
    }
    input.addEventListener('input', run);
    input.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ var a = list.querySelector('a'); if(a) a.click(); }
      if(e.key === 'Escape') set(false);
    });
    btn.addEventListener('click', function(){ set(!box.classList.contains('on')); });
    document.addEventListener('click', function(e){ if(box.classList.contains('on') && !box.contains(e.target) && !btn.contains(e.target)) set(false); });
    document.addEventListener('keydown', function(e){
      var typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
      if(e.key === '/' && !typing){ e.preventDefault(); set(true); }
    });
    document.body.appendChild(box);
    document.body.appendChild(btn);
  }

  function init(){
    buildHeader(); buildMenu(); buildSearch(); lists();
    if(!window.FS){ var sh = document.createElement('script'); sh.src = BASE + 'share.js'; document.head.appendChild(sh); }   // the "Share link" buttons
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
