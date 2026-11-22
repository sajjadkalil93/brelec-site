/* BR ELEC — comportements du site (v2.4) */
(function () {
  'use strict';
  var doc = document, body = doc.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menu mobile ---------- */
  var burger = doc.getElementById('burger');
  var mnav = doc.getElementById('mnav');
  if (burger && mnav) {
    var closeBtn = doc.getElementById('mnavClose');
    var setMenu = function (open) {
      mnav.hidden = !open;
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      body.classList.toggle('menu-open', open);
      if (open) { closeBtn.focus(); } else { burger.focus(); }
    };
    burger.addEventListener('click', function () { setMenu(true); });
    closeBtn.addEventListener('click', function () { setMenu(false); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mnav.hidden) { setMenu(false); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && !mnav.hidden) { setMenu(false); }
    }, { passive: true });
  }

  /* ---------- Apparition des blocs au défilement ---------- */
  var reveals = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Hero vidéo (accueil) ---------- */
  var cine = doc.getElementById('cine');
  if (cine) {
    var video = doc.getElementById('cineVideo');
    var white = doc.getElementById('cineWhite');
    var cue = doc.getElementById('cineCue');
    var header = doc.getElementById('siteHeader');
    var steps = Array.prototype.slice.call(doc.querySelectorAll('.cine-copy'));

    if (reduced) {
      header.classList.add('solid');
    } else {
      // Version légère sur mobile, version pleine définition sinon
      if (video) {
        var small = window.matchMedia('(max-width: 900px)').matches;
        video.src = small ? video.getAttribute('data-src-m') : video.getAttribute('data-src');
        video.load();
        var tryPlay = function () { var p = video.play(); if (p && p.catch) { p.catch(function () {}); } };
        tryPlay();
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) { tryPlay(); } else { video.pause(); } });
          }, { threshold: 0.05 }).observe(cine);
        }
      }

      var ticking = false;
      var zones = [[0.00, 0.34], [0.34, 0.66], [0.66, 0.97]];
      var update = function () {
        ticking = false;
        var rect = cine.getBoundingClientRect();
        var vh = window.innerHeight;
        var total = cine.offsetHeight - vh;
        var p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;

        steps.forEach(function (el, i) {
          var z = zones[i], o = 0, ty = 30;
          if (p >= z[0] && p <= z[1]) {
            var lp = (p - z[0]) / (z[1] - z[0]);
            var fadeIn = (i === 0) ? 1 : Math.min(1, lp / 0.18);
            var fadeOut = (i === steps.length - 1) ? 1 : Math.min(1, (1 - lp) / 0.18);
            o = Math.min(fadeIn, fadeOut);
            ty = 30 * (1 - fadeIn) - 18 * (1 - fadeOut);
          } else if (i === steps.length - 1 && p > z[1]) {
            o = 1; ty = 0;
          }
          el.style.opacity = o;
          el.style.transform = 'translateY(' + ty + 'px)';
          // Seul le bloc visible reçoit les clics
          el.classList.toggle('interactive', o > 0.5);
        });

        white.style.opacity = p > 0.9 ? (p - 0.9) / 0.1 : 0;
        if (cue) { cue.style.opacity = p < 0.02 ? 1 : 0; }
        header.classList.toggle('solid', p > 0.985 || rect.bottom <= vh * 0.5);
      };
      var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      update();
    }
  }

  /* ---------- Devis express ---------- */
  var form = doc.getElementById('quote-form');
  if (form) {
    var EMAIL = 'contact@brelec.fr';
    var okPanel = doc.getElementById('form-ok');
    var fbPanel = doc.getElementById('form-fallback');
    var btn = form.querySelector('button[type=submit]');
    var val = function (n) { var el = form.elements[n]; return el ? String(el.value || '').trim() : ''; };

    // La barre d'action ne doit pas gêner la saisie au clavier
    form.addEventListener('focusin', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== 'radio') { body.classList.add('typing'); }
    });
    form.addEventListener('focusout', function () { body.classList.remove('typing'); });

    var show = function (panel, d) {
      var who = panel.querySelector('[data-fill=nom]');
      var tel = panel.querySelector('[data-fill=tel]');
      if (who) { who.textContent = d.nom.split(' ')[0]; }
      if (tel) { tel.textContent = d.tel; }
      form.hidden = true;
      panel.hidden = false;
      panel.setAttribute('tabindex', '-1');
      panel.focus();
      panel.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    };

    var mailtoUrl = function (d) {
      var subject = 'Demande de devis - ' + d.besoin;
      var text = 'Nom : ' + d.nom + '\nTéléphone : ' + d.tel + '\nEmail : ' + (d.email || '-') +
        '\nType de besoin : ' + d.besoin + '\n\n' + d.message;
      return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
    };

    var fallback = function (d) {
      btn.disabled = false; btn.textContent = 'Envoyer la demande';
      show(fbPanel, d);
      window.location.href = mailtoUrl(d);
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) { return; }
      if (form.elements.botcheck && form.elements.botcheck.checked) { return; }
      var d = { nom: val('nom'), tel: val('tel'), email: val('email'), besoin: val('besoin'), message: val('message') };

      // Clé du service d'envoi, posée dans l'attribut data-key du formulaire
      var KEY = (form.getAttribute('data-key') || '').trim();
      if (!KEY || !window.fetch) { fallback(d); return; }

      btn.disabled = true; btn.textContent = 'Envoi en cours…';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: KEY,
          subject: 'Demande de devis — ' + d.besoin + ' — ' + d.nom,
          from_name: 'Site brelec.fr',
          replyto: d.email || undefined,
          Nom: d.nom, 'Téléphone': d.tel, Email: d.email || '-', Besoin: d.besoin, Message: d.message || '-'
        })
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (j && j.success) { show(okPanel, d); } else { fallback(d); }
      }).catch(function () { fallback(d); });
    });

    doc.querySelectorAll('[data-form-reset]').forEach(function (b) {
      b.addEventListener('click', function () {
        okPanel.hidden = true; fbPanel.hidden = true; form.hidden = false;
        btn.disabled = false; btn.textContent = 'Envoyer la demande';
      });
    });
  }
})();
