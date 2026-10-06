/*! The Local Motion Library v1.0.2 (6 Oct 2026). Story-section scenes chosen by the CMS Visual Scene option.
   v1.0.2: Paper band hides the template rail kicker on phones too (no duplicate kicker).
   No keys, no tracking, no network calls. */
/*! The Local Motion Library — core (v0.1). Scenes are chosen per Story Section by the CMS Visual Scene option, rendered
   as text in [data-tl-scene-flag] inside each Story Sections item. Works with any Motion Theme; the shared Rock/Editorial
   engine skips sections that carry a library scene (one-line guard in the template head). No names, slugs, IDs or
   article text are matched. Reduced motion → settled state. No JavaScript → the server-rendered page as is. */
(function () {
  'use strict';
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var key = function (t) { return (t || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  var SCENES = {}; var steps = []; var zones = []; var ticking = false;
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn('[tl-motion]', e); } }
  function frame() { ticking = false; var vh = innerHeight, vw = document.documentElement.clientWidth; steps.forEach(function (f) { safe(function () { f(vh, vw); }); }); zoneStep(vh); }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  /* Entry effect with hysteresis: fires when el enters [top..bottom] of the viewport, re-arms when it fully leaves. */
  function zone(el, fire, top, bottom) { zones.push({ el: el, fire: fire, on: false, top: top || 0.84, bottom: bottom || 0.1 }); }
  function zoneStep(vh) { zones.forEach(function (z) { var r = z.el.getBoundingClientRect(), inZ = r.top < vh * z.top && r.bottom > vh * z.bottom;
    if (inZ && !z.on) { z.on = true; safe(function () { z.fire(z.el); }); } else if (r.bottom < 0 || r.top > vh) z.on = false; }); }
  var cl = function (v, a, b) { return Math.min(b == null ? 1 : b, Math.max(a || 0, v)); };
  /* Split an element's text into spans (letters or words) while keeping it readable to screen readers. */
  function split(el, mode, cls) {
    if (!el || el.__tlSplit) return el && el.__tlSplit || [];
    var text = el.textContent; el.setAttribute('aria-label', text.replace(/\s+/g, ' ').trim());
    var out = [], frag = document.createDocumentFragment();
    (function walk(node, into) { [].slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { var parts = mode === 'letters' ? n.textContent.split('') : n.textContent.split(/(\s+)/);
        parts.forEach(function (p) { if (p === '') return; if (/^\s+$/.test(p)) { into.appendChild(document.createTextNode(p)); return; }
          var s = document.createElement('span'); s.className = cls || 'tl-m-unit'; s.setAttribute('aria-hidden', 'true'); s.style.display = 'inline-block'; s.textContent = p; into.appendChild(s); out.push(s); }); }
      else if (n.nodeType === 1) { var c = n.cloneNode(false); into.appendChild(c); walk(n, c); } }); })(el, frag);
    el.textContent = ''; el.appendChild(frag); el.__tlSplit = out; return out;
  }
  window.TLMotion = { register: function (name, fn) { SCENES[key(name)] = fn; }, steps: steps, zone: zone, req: req, cl: cl, split: split, rm: RM, safe: safe,
    mob: function () { return innerWidth < 768; } };
  /* Accent words in a display heading or kicker: text written _like this_ in the CMS field becomes
     <span class="tl-accent-inline">like this</span> (styled by each scene; screen readers get the plain text). */
  function accents() {
    [].slice.call(document.querySelectorAll('[data-tl-scene-flag]')).forEach(function (m) {
      var item = m.closest('.w-dyn-item') || m.parentElement; if (!item) return;
      [].slice.call(item.querySelectorAll('h1,h2,h3,h4,.story-template_statement,.story-template_eyebrow,.story-template_rail-label')).forEach(function (h) {
        if (h.__tlAcc || !/_[^_]+_/.test(h.textContent)) return; h.__tlAcc = true;
        h.setAttribute('aria-label', h.textContent.replace(/_/g, '').replace(/\s+/g, ' ').trim());
        [].slice.call(h.childNodes).forEach(function walk(n) {
          if (n.nodeType === 1) { [].slice.call(n.childNodes).forEach(walk); return; }
          if (n.nodeType !== 3 || !/_[^_]+_/.test(n.textContent)) return;
          var f = document.createDocumentFragment();
          n.textContent.split(/(_[^_]+_)/).forEach(function (part) {
            if (!part) return;
            if (/^_[^_]+_$/.test(part)) { var sp = document.createElement('span'); sp.className = 'tl-accent-inline'; sp.textContent = part.slice(1, -1); f.appendChild(sp); }
            else f.appendChild(document.createTextNode(part));
          });
          n.parentNode.replaceChild(f, n);
        });
      });
    });
  }
  function boot() {
    safe(accents);
    if (!Element.prototype.animate) return;
    [].slice.call(document.querySelectorAll('[data-tl-scene-flag]')).forEach(function (m) {
      var k = key(m.textContent), fn = SCENES[k], item = m.closest('.w-dyn-item') || m.parentElement;
      if (!fn || !item || item.__tlScene) return; item.__tlScene = k; item.setAttribute('data-tl-scene', k);
      safe(function () { fn(item, RM); });
    });
    addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); req();
    /* looks and scenes change layout after the shared engine measured the page: let it re-measure */
    if (window.ScrollTrigger && ScrollTrigger.refresh) { setTimeout(function () { safe(function () { ScrollTrigger.refresh(); }); }, 60); }
  }
  /* Scenes register themselves (in this file or later files) before load; boot after the DOM is ready. */
  if (document.readyState === 'complete') setTimeout(boot, 0); else addEventListener('load', function () { setTimeout(boot, 0); });
})();

/*! The Local Motion Library — scene "Temperature landing" (v0.1). Ported from the approved Nitsuh v6.2 prototype.
   Source of the words: the section's Quote Heading, written as "Place +NN°C, Place –NN°C" (format, not content, is read).
   Builds a warm field (first place) and a cold field (second place) above the pull quote. On scroll the cold field
   rises over the warm one, the warm figure is pushed out, the sun sinks, and the cold figure fills and lands.
   Reduced motion: the two fields are shown stacked and still. No JavaScript / unreadable heading: the normal pull quote. */
(function () {
  'use strict';
  var M = window.TLMotion; if (!M) return;
  var RX = /^\s*(.+?)\s*([+\-–−]\s*\d+(?:[.,]\d+)?\s*°\s*[CF])\s*[,;\/]\s*(.+?)\s*([+\-–−]\s*\d+(?:[.,]\d+)?\s*°\s*[CF])\s*$/;
  var DISPLAY = "bebas-neue-pro,'Bebas Neue Pro','Bebas Neue',Impact,sans-serif", LABEL = "acumin-pro,'Acumin Pro',Archivo,Helvetica,Arial,sans-serif";
  var WARM = '#A65018', WARM_INK = '#FFF4E6', COLD = '#101C3B', COLD_INK = '#A3D7EB';
  var SUN = 'radial-gradient(circle,rgba(255,236,180,1) 0%,rgba(255,212,130,.85) 22%,rgba(244,170,80,.38) 46%,rgba(234,150,60,0) 70%)';

  var CSS = '[data-tl-scene="temperature-landing"]{--tl-navy:#101C3B;--tl-cream:#FBFBF9;--tl-gold:#EAB883;--tl-cold-ink:#A3D7EB;background:var(--tl-navy)}' +
    '[data-tl-scene="temperature-landing"] .story-template_section{background:var(--tl-navy);color:var(--tl-cream);padding-top:clamp(40px,6vw,96px);padding-bottom:clamp(64px,8vw,128px)}' +
    '[data-tl-scene="temperature-landing"] .story-template_quote-block{max-width:1000px;border-left:4px solid var(--tl-gold);padding-left:clamp(16px,2.4vw,36px);background:transparent;box-shadow:none}' +
    '[data-tl-scene="temperature-landing"] .story-template_quote-text,[data-tl-scene="temperature-landing"] .story-template_quote-text p{font-family:acumin-pro,"Acumin Pro",Archivo,Arial,sans-serif;font-size:clamp(22px,2.5vw,37px);line-height:1.3;font-weight:500;color:var(--tl-cream);text-wrap:pretty;margin:0 0 18px}' +
    '[data-tl-scene="temperature-landing"] .story-template_quote-attribution{display:block!important;font-family:acumin-pro,"Acumin Pro",Archivo,Arial,sans-serif;font-size:13px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--tl-cold-ink)!important}' +
    '[data-tl-scene="temperature-landing"] .tl-temp-warm{color:var(--tl-gold)}[data-tl-scene="temperature-landing"] .tl-temp-cold{color:var(--tl-cold-ink)}';
  (function () { if (document.getElementById('tl-m-landing-css')) return; var st = document.createElement('style'); st.id = 'tl-m-landing-css'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); })();
  /* colour the two temperatures where they occur in the quote (values come from the Quote Heading, not hard-coded) */
  function tintTemps(root, warmDeg, coldDeg) {
    var norm = function (t) { return t.replace(/[−–-]/g, '-').replace(/\s+/g, ''); };
    var targets = [[norm(warmDeg), 'tl-temp-warm'], [norm(coldDeg), 'tl-temp-cold']];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var txt = node.nodeValue, re = /[+\-–−]\s*\d+(?:[.,]\d+)?\s*°\s*[CF]/g, m, last = 0, frag = null;
      while ((m = re.exec(txt))) { var hit = targets.filter(function (t) { return t[0] === norm(m[0]); })[0]; if (!hit) continue;
        frag = frag || document.createDocumentFragment(); frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
        var sp = document.createElement('span'); sp.className = hit[1]; sp.textContent = m[0]; frag.appendChild(sp); last = m.index + m[0].length; }
      if (frag) { frag.appendChild(document.createTextNode(txt.slice(last))); node.parentNode.replaceChild(frag, node); }
    });
  }
  function el(tag, css, html) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (html != null) e.innerHTML = html; return e; }
  function chars(text, attr) { return text.split('').map(function (c) { return '<span ' + attr + ' style="display:inline-block;transform-origin:50% 100%">' + (c === ' ' ? '&nbsp;' : c) + '</span>'; }).join(''); }
  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  var BIG = 'font-family:' + DISPLAY + ';line-height:.8;white-space:nowrap;font-size:min(40vw,42vh,340px)';
  var PLACE = 'font-family:' + LABEL + ';font-weight:700;text-transform:uppercase';
  function warmBlock(place, deg) {
    return '<div data-ld="warm-in" style="display:flex;flex-direction:column;gap:clamp(8px,1.2vw,16px)">' +
      '<span data-eth style="display:flex;' + PLACE + ';font-size:clamp(16px,1.7vw,24px);letter-spacing:.3em">' + chars(place, 'data-el') + '</span>' +
      '<span style="position:relative;display:inline-block;' + BIG + '"><span data-sun aria-hidden="true" style="position:absolute;right:-.06em;top:-50%;width:.78em;height:.78em;border-radius:50%;background:' + SUN + ';pointer-events:none;transform-origin:50% 50%"></span>' +
      '<span style="position:relative;text-shadow:0 0 .06em rgba(255,222,160,.55),0 0 .22em rgba(255,190,110,.35)">' + esc(deg) + '</span></span></div>';
  }
  function coldBlock(place, deg, live) {
    return '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:clamp(8px,1.2vw,16px)">' +
      '<span data-ld="place" style="' + PLACE + ';font-size:clamp(12px,1.1vw,16px);letter-spacing:.24em">' + esc(place) + '</span>' +
      '<span data-ld="deg" style="' + BIG + (live ? ';color:transparent;-webkit-text-stroke:2px rgba(163,215,235,.6)' : '') + '">' + (live ? chars(deg, 'data-dch') : esc(deg)) + '</span></div>';
  }
  M.register('Temperature landing', function (item, rm) {
    var head = item.querySelector('.story-template_quote-heading'); if (!head) return;
    var m = RX.exec(head.textContent.replace(/\s+/g, ' ')); if (!m) return;
    var warmPlace = m[1], warmDeg = m[2].replace(/\s+/g, ''), coldPlace = m[3], coldDeg = m[4].replace(/\s+/g, '').replace(/^-/, '–');
    var section = item.querySelector('.story-template_section') || item.firstElementChild;
    var qt = item.querySelector('.story-template_quote-text'); if (qt) tintTemps(qt, warmDeg, coldDeg);
    // keep the heading for screen readers; the fields below are decorative (aria-hidden)
    head.style.cssText += ';position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;margin:0';
    var pad = 'padding:clamp(28px,5vw,72px) clamp(20px,5.6vw,80px)';
    if (rm) { // settled: two still bands
      var still = el('div', '', ''); still.setAttribute('aria-hidden', 'true'); still.className = 'tl-landing tl-landing-still';
      still.appendChild(el('div', 'background:' + WARM + ';color:' + WARM_INK + ';display:flex;align-items:center;min-height:min(70vh,700px);' + pad, warmBlock(warmPlace, warmDeg)));
      still.appendChild(el('div', 'background:' + COLD + ';color:' + COLD_INK + ';display:flex;align-items:center;justify-content:flex-end;min-height:min(70vh,700px);' + pad, coldBlock(coldPlace, coldDeg, false)));
      item.insertBefore(still, section); return;
    }
    var track = el('div', 'position:relative;height:250vh'); track.className = 'tl-landing'; track.setAttribute('aria-hidden', 'true');
    var stage = el('div', 'position:sticky;top:0;height:100vh;overflow:hidden'); track.appendChild(stage);
    stage.appendChild(el('div', 'position:absolute;inset:0;background:' + WARM + ';color:' + WARM_INK + ';display:flex;align-items:center;padding:0 clamp(20px,5.6vw,80px)', warmBlock(warmPlace, warmDeg)));
    var cold = el('div', 'position:absolute;inset:0;background:' + COLD + ';color:' + COLD_INK + ';display:flex;align-items:center;justify-content:flex-end;padding:0 clamp(20px,5.6vw,80px);transform:translate3d(0,100%,0);box-shadow:0 -24px 60px rgba(4,8,20,.35)', coldBlock(coldPlace, coldDeg, true));
    stage.appendChild(cold);
    item.insertBefore(track, section);
    var warmIn = stage.querySelector('[data-ld="warm-in"]'), deg = stage.querySelector('[data-ld="deg"]'), place = stage.querySelector('[data-ld="place"]'),
        sun = stage.querySelector('[data-sun]'), eth = stage.querySelector('[data-eth]');
    var cl = M.cl, landed = false, ethOn = false, shT = null;
    function hopEth() { // v6.2 hopEth()
      var ls = [].slice.call(eth.querySelectorAll('[data-el]'));
      ls.forEach(function (c, i) { c.getAnimations().forEach(function (a) { a.cancel(); });
        c.animate([{ transform: 'none', color: WARM_INK }, { transform: 'translateY(-.9em) scale(1.35) rotate(' + (i % 2 ? 7 : -7) + 'deg)', color: '#FFE2A0', offset: .38 }, { transform: 'translateY(.12em) scale(.94,1.06)', offset: .66 }, { transform: 'translateY(-.06em)', offset: .82 }, { transform: 'none', color: WARM_INK }], { duration: 760, delay: i * 60, easing: 'cubic-bezier(.3,.7,.3,1)' }); });
      eth.animate([{ letterSpacing: '.3em' }, { letterSpacing: '.52em', offset: .45 }, { letterSpacing: '.3em' }], { duration: 760 + ls.length * 60, easing: 'cubic-bezier(.22,.9,.32,1)' });
    }
    function shakeChars(chs, fs, amp) { // v6.2 shakeChars()
      var seed = 11; var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647 * 2 - 1; };
      var A = 0.03 * fs * amp, ROT = 3.4 * amp, D1 = 560, GAP = 120, D2 = 260, STAMP = 300, STEP = 40, TOT = D1 + GAP + D2 + STAMP;
      var env = function (t, d) { var k = t / d; return Math.min(1, k / .18) * Math.min(1, (1 - k) / .3 + .15); };
      chs.forEach(function (c, i) { c.getAnimations().forEach(function (a) { a.cancel(); }); var f = [{ offset: 0, transform: 'none' }];
        var burst = function (t0, d, a) { for (var t = 0; t <= d; t += STEP) { var e = env(t, d) * a; f.push({ offset: (t0 + t) / TOT, transform: 'translate3d(' + (rnd() * A * e).toFixed(2) + 'px,' + (rnd() * A * .6 * e).toFixed(2) + 'px,0) rotate(' + (rnd() * ROT * e).toFixed(2) + 'deg)' }); } };
        burst(0, D1, 1); f.push({ offset: (D1 + GAP) / TOT, transform: 'none' }); burst(D1 + GAP, D2, .7);
        var s = (D1 + GAP + D2) / TOT, u = STAMP / TOT;
        f.push({ offset: s, transform: 'none' }, { offset: s + u * .35, transform: 'translate3d(0,' + (-.045 * fs).toFixed(1) + 'px,0)' }, { offset: s + u * .62, transform: 'translate3d(0,' + (.012 * fs).toFixed(1) + 'px,0) scaleY(.955)' }, { offset: 1, transform: 'none' });
        c.animate(f, { duration: TOT, delay: i * 14, easing: 'linear' }); });
    }
    M.steps.push(function (vh) { // v6.2 landing()
      var r = track.getBoundingClientRect(), span = r.height - vh, p = span > 0 ? cl(-r.top / span) : 0;
      var q = cl((p - 0.12) / 0.56), k = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
      cold.style.transform = 'translate3d(0,' + ((1 - k) * 100).toFixed(2) + '%,0)';
      var H = stage.clientHeight, edge = (1 - k) * H, bottom = warmIn.offsetTop + warmIn.offsetHeight + Math.max(16, H * 0.03);
      warmIn.style.transform = 'translate3d(0,' + (-Math.max(0, bottom - edge)).toFixed(1) + 'px,0)';
      var sk = cl(1 - q * 1.6); sun.style.transform = 'translate3d(0,' + ((1 - sk) * 30).toFixed(1) + '%,0) scale(' + (0.7 + 0.45 * sk).toFixed(3) + ')'; sun.style.opacity = (0.35 + 0.65 * sk).toFixed(2);
      var inWarm = r.top < vh * 0.3 && q < 0.12;
      if (inWarm && !ethOn) { ethOn = true; hopEth(); } else if (!inWarm && (r.top > vh * 0.7 || q > 0.4)) ethOn = false;
      if (!landed && q >= 1) {
        landed = true; deg.style.color = COLD_INK; deg.style.webkitTextStroke = '0px transparent';
        deg.animate([{ transform: 'translate3d(0,-.16em,0) scale(1.07)' }, { transform: 'translate3d(0,.045em,0) scale(.985)', offset: .55 }, { transform: 'translate3d(0,-.012em,0) scale(1.004)', offset: .8 }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.22,.9,.32,1)' });
        cold.animate([{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,7px,0)', offset: .35 }, { transform: 'translate3d(0,0,0)' }], { duration: 380, delay: 300, easing: 'ease-out' });
        place.animate([{ letterSpacing: '.5em' }, { letterSpacing: '.24em' }], { duration: 500, delay: 300, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        clearTimeout(shT); shT = setTimeout(function () { shakeChars([].slice.call(deg.querySelectorAll('[data-dch]')), parseFloat(getComputedStyle(deg).fontSize), 0.8); }, 520);
      } else if (landed && q < 0.85) { landed = false; deg.style.color = 'transparent'; deg.style.webkitTextStroke = '2px rgba(163,215,235,.6)'; }
    });
    M.req();
  });
})();

/*! The Local Motion Library — scenes "Shiver" and "Nod" (ported from design prototype v6.2, no new motion).
   Shiver: Chapter Statement Opener. Kicker words drop and stamp (v6.2 hopKick), then the statement's letters shiver
   twice and stamp (v6.2 playCold, letters only — toque, pom and scarf decorations dropped). Fires on viewport entry
   with hysteresis (TLMotion.zone) and, on hover-capable devices, replays the shiver on heading hover as v6.2 did.
   Nod: Image Right section. The accent phrase nods from 1deg to 14deg as it travels up the viewport (v6.2 'sleep'
   step, reversible) and jolts upright on heading hover (v6.2 jolt) on hover-capable devices only.
   Reduced motion → nothing runs; the page stays as served. Selection is by class only, never by text.
   Scene look: one <style> (injected once at load) restyles the native Webflow blocks to the approved Claude Design v7
   rest state. Every rule is scoped under [data-tl-scene="shiver"] / [data-tl-scene="nod"], which the core sets on the
   section's .w-dyn-item before the scene runs, so nothing else on the page is touched. Colours are custom properties
   (--tl-ice, --tl-cold, --tl-navy, --tl-gold, --tl-cream, --tl-sky) so a story can recolour a section later. */
(function () {
  'use strict';
  var M = window.TLMotion; if (!M) return;
  var HOVER = !!(window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches);

  /* Scene look (CSS only; the Nod accent's transform is left to JS). */
  var DISPLAY = "bebas-neue-pro,'Bebas Neue Pro','Bebas Neue',Impact,sans-serif";
  var SERIF = "quiche-flare,'Fraunces',Georgia,serif";
  var TEXT = "acumin-pro,'Acumin Pro',Archivo,Arial,sans-serif";
  var S = '[data-tl-scene="shiver"]', SS = S + ' .story-template_section';
  var N = '[data-tl-scene="nod"]', NS = N + ' .story-template_section';
  var LOOK = [
    S + ',' + N + '{--tl-ice:#E7EFF2;--tl-cold:#24739E;--tl-navy:#101C3B;--tl-gold:#EAB883;--tl-cream:#FBFBF9;--tl-sky:#A3D7EB;display:block;width:100%}',
    /* Shared block reset: one column, rail (number + kicker) above the main column. */
    SS + ',' + NS + '{position:relative;box-sizing:border-box;width:100%;margin:0;padding:clamp(56px,9vw,140px) clamp(20px,5.6vw,80px);overflow-x:clip;font-family:' + TEXT + '}',
    SS + ' .story-template_container,' + NS + ' .story-template_container{box-sizing:border-box;width:100%;max-width:1440px;margin:0 auto;padding:0}',
    SS + ' .story-template_grid,' + NS + ' .story-template_grid{display:grid;grid-template-columns:minmax(0,1fr);gap:0;align-items:start}',
    SS + ' .story-template_grid>*,' + NS + ' .story-template_grid>*{grid-column:1/-1;grid-row:auto;min-width:0;width:auto;max-width:none}',
    SS + ' .story-template_rail,' + NS + ' .story-template_rail{position:static;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 14px;margin:0;padding:0;writing-mode:horizontal-tb;transform:none}',
    SS + ' .story-template_rail-num,' + SS + ' .story-template_rail-label,' + SS + ' .story-template_eyebrow,' +
    NS + ' .story-template_rail-num,' + NS + ' .story-template_eyebrow,' + NS + ' .story-template_rail-label' +
    '{margin:0;padding:0;font-family:' + TEXT + ';font-size:clamp(13px,1.2vw,17px);font-weight:700;line-height:1.3;letter-spacing:.16em;text-transform:uppercase;writing-mode:horizontal-tb;transform:none}',
    SS + ' .story-template_main,' + NS + ' .story-template_main{margin:0;padding:0}',
    /* Shiver: ice field, cold-blue display statement, body in a right-hand column. */
    S + ',' + SS + '{background:var(--tl-ice);color:var(--tl-navy)}',
    SS + ' .story-template_rail-num{color:var(--tl-cold)}',
    SS + ' .story-template_rail-label,' + SS + ' .story-template_eyebrow{color:var(--tl-navy)}',
    SS + ' .story-template_statement{margin:.1em 0 clamp(28px,3.6vw,56px);padding:0;max-width:none;width:auto;font-family:' + DISPLAY + ';font-weight:400;font-style:normal;text-transform:uppercase;letter-spacing:0;color:var(--tl-cold);font-size:clamp(96px,22vw,320px);line-height:.82;text-align:left}',
    SS + ' .story-template_main .w-richtext,' + SS + ' .story-template_body{margin:0 0 0 auto;max-width:620px;color:var(--tl-navy);font-family:' + TEXT + '}',
    SS + ' .story-template_main .w-richtext p,' + SS + ' .story-template_body p{margin:0 0 1em;font-size:clamp(17px,1.32vw,19px);line-height:1.62;color:inherit}',
    SS + ' .story-template_main .w-richtext p:first-child,' + SS + ' .story-template_body p:first-child{font-size:clamp(19px,1.75vw,25px);line-height:1.5;font-weight:500}',
    SS + ' .story-template_main .w-richtext p:last-child,' + SS + ' .story-template_body p:last-child{margin-bottom:0}',
    SS + ' .story-template_opener-hero{margin-top:clamp(28px,3.6vw,56px)}',
    SS + ' img,' + NS + ' img{max-width:100%;height:auto}',
    /* Nod: navy field, three-part heading, photo on the right. */
    N + ',' + NS + '{background:var(--tl-navy);color:var(--tl-cream)}',
    NS + ' .story-template_rail{margin-bottom:20px}',
    NS + ' .story-template_rail-num,' + NS + ' .story-template_eyebrow,' + NS + ' .story-template_rail-label{color:var(--tl-gold)!important;font-size:13px}',
    NS + ' .is-story-imageright-split{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(28px,5vw,96px);align-items:center;margin:0;padding:0}',
    NS + ' .is-story-imageright-split>*{min-width:0;margin:0;padding:0}',
    NS + ' .is-story-imageright-split>*:last-child{justify-self:end;width:100%;max-width:520px}',
    NS + ' .tl-feature-title-xl{display:block;margin:0 0 clamp(24px,3vw,44px);padding:0;max-width:none;font-size:16px;line-height:1;font-weight:400;letter-spacing:0;text-transform:none;color:var(--tl-cream)}',
    NS + ' .tl-feature-title-xl .is-heading-phrase{display:block;font-family:' + SERIF + ';font-style:italic;font-weight:400;font-size:clamp(26px,2.8vw,44px);line-height:1;letter-spacing:0;text-transform:none;color:var(--tl-sky);margin:0 0 -.08em .04em;position:relative;z-index:1}',
    NS + ' .tl-feature-title-xl .is-accent-phrase{font-family:' + DISPLAY + ';font-style:normal;font-weight:400;text-transform:uppercase;letter-spacing:0;font-size:clamp(72px,24vw,240px);line-height:.82;color:var(--tl-gold);margin:0;padding:0;max-width:100%;vertical-align:top}',
    NS + ' .tl-feature-title-xl .is-accent-phrase~.is-heading-phrase{font-family:' + TEXT + ';font-style:normal;font-weight:700;text-transform:uppercase;letter-spacing:.24em;font-size:clamp(15px,1.6vw,24px);line-height:1.2;color:var(--tl-cream);margin:.3em 0 0;z-index:auto}',
    NS + ' .is-story-imageright-split .w-richtext{max-width:580px;color:var(--tl-cream);font-family:' + TEXT + '}',
    NS + ' .is-story-imageright-split .w-richtext p,' + NS + ' .is-story-imageright-split .w-richtext h6,' + NS + ' .is-story-imageright-split .w-richtext li{margin:0 0 1em;font-size:clamp(17px,1.32vw,19px);line-height:1.62;color:inherit}',
    NS + ' .is-story-imageright-split .w-richtext>:last-child{margin-bottom:0}',
    NS + ' .story-template_inline-image{display:block;width:100%;height:auto;margin:0}',
    NS + ' .story-template_caption,' + NS + ' .story-template_quote-block{color:var(--tl-cream)}',
    /* Stacked layout. */
    '@media (max-width:767px){' +
      SS + ' .story-template_main .w-richtext,' + SS + ' .story-template_body{margin-left:0;max-width:none}' +
      NS + ' .is-story-imageright-split{grid-template-columns:minmax(0,1fr);gap:clamp(28px,8vw,48px)}' +
      NS + ' .is-story-imageright-split>*:last-child{justify-self:stretch;max-width:none}' +
      NS + ' .is-story-imageright-split .w-richtext{max-width:none}' +
    '}'
  ].join('\n');
  (function injectLook() {
    if (document.getElementById('tl-m-shiver-nod-css')) return;
    var st = document.createElement('style'); st.id = 'tl-m-shiver-nod-css'; st.type = 'text/css';
    st.appendChild(document.createTextNode(LOOK));
    (document.head || document.documentElement).appendChild(st);
  })();

  function cancelTree(el) { if (el && el.getAnimations) el.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); }); }
  function cancelOwn(el) { if (el && el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); }); }
  /* First element matching sel (document order) that carries non-empty text. */
  function firstWithText(root, sel) {
    var ls = root.querySelectorAll(sel);
    for (var i = 0; i < ls.length; i++) if (ls[i].textContent.replace(/\s+/g, '')) return ls[i];
    return null;
  }

  /* v6.2 hopKick: each kicker word drops in from above, squashes, settles; the last word shudders afterwards. */
  function hopKick(ws, st) {
    if (!ws.length) return;
    ws.forEach(function (w, i) {
      cancelOwn(w);
      w.animate([
        { transform: 'translateY(-1.6em) rotate(' + (i === 1 ? 6 : -8) + 'deg) scale(1.5)' },
        { transform: 'translateY(.18em) scale(1.08,.9)', offset: .55 },
        { transform: 'translateY(-.08em)', offset: .78 },
        { transform: 'none' }
      ], { duration: 620, delay: i * 170, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'backwards' });
    });
    var last = ws[ws.length - 1];
    clearTimeout(st.kickT);
    st.kickT = setTimeout(function () {
      if (!last.isConnected) return;
      var fs = parseFloat(getComputedStyle(last).fontSize);
      last.animate([
        { transform: 'none' },
        { transform: 'translateX(' + (-.08 * fs) + 'px) rotate(-2deg)', offset: .2 },
        { transform: 'translateX(' + (.07 * fs) + 'px) rotate(2deg)', offset: .4 },
        { transform: 'translateX(' + (-.05 * fs) + 'px)', offset: .6 },
        { transform: 'translateX(' + (.03 * fs) + 'px)', offset: .8 },
        { transform: 'none' }
      ], { duration: 420, easing: 'linear' });
    }, (ws.length - 1) * 170 + 640);
  }

  /* v6.2 playCold (letters only): seeded shiver burst, pause, shorter burst, then a stamp. Deterministic (seed 7). */
  function playCold(h, chs) {
    if (!chs.length) return;
    cancelTree(h);
    var fs = parseFloat(getComputedStyle(h).fontSize), mobile = M.mob();
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647 * 2 - 1; }
    var A = (mobile ? .034 : .028) * fs, ROT = mobile ? 4 : 3.2;
    var D1 = 620, GAP = 150, D2 = 300, STAMP = 300, STEP = 40, TOT = D1 + GAP + D2 + STAMP;
    function env(t, d) { var k = t / d; return Math.min(1, k / .18) * Math.min(1, (1 - k) / .3 + .15); }
    function burst(f, t0, d, amp) {
      for (var t = 0; t <= d; t += STEP) {
        var e = env(t, d) * amp;
        f.push({ offset: (t0 + t) / TOT, transform: 'translate3d(' + (rnd() * A * e).toFixed(2) + 'px,' + (rnd() * A * .6 * e).toFixed(2) + 'px,0) rotate(' + (rnd() * ROT * e).toFixed(2) + 'deg)' });
      }
    }
    function stamp(f) {
      var s = (D1 + GAP + D2) / TOT, u = STAMP / TOT;
      f.push({ offset: s, transform: 'none' });
      f.push({ offset: s + u * .35, transform: 'translate3d(0,' + (-.045 * fs).toFixed(1) + 'px,0)' });
      f.push({ offset: s + u * .62, transform: 'translate3d(0,' + (.012 * fs).toFixed(1) + 'px,0) scaleY(.955)' });
      f.push({ offset: 1, transform: 'none' });
    }
    chs.forEach(function (c, i) {
      var f = [{ offset: 0, transform: 'none' }];
      burst(f, 0, D1, 1);
      f.push({ offset: D1 / TOT, transform: 'none' });
      f.push({ offset: (D1 + GAP) / TOT, transform: 'none' });
      burst(f, D1 + GAP, D2, .7);
      stamp(f);
      c.animate(f, { duration: TOT, delay: i * 12, easing: 'linear' });
    });
  }

  /* Scene 1 — Shiver (Chapter Statement Opener). */
  M.register('Shiver', function (item, rm) {
    if (rm) return;
    var kick = firstWithText(item, '.story-template_eyebrow, .story-template_rail-label');
    var head = item.querySelector('.story-template_statement');
    if (head && !head.textContent.replace(/\s+/g, '')) head = null;
    if (!kick && !head) return;
    var st = { kickT: null, coldT: null };
    var words = kick ? M.split(kick, 'words', 'tl-m-word') : [];
    words.forEach(function (w) { w.style.transformOrigin = '50% 100%'; });
    /* Letters are grouped per word (nowrap) as in v6.2, so a line never breaks inside a word. */
    var chs = [];
    if (head) M.split(head, 'words', 'tl-m-word').forEach(function (w) {
      w.style.whiteSpace = 'nowrap';
      M.split(w, 'letters', 'tl-m-ch').forEach(function (c) { c.style.transformOrigin = '50% 100%'; chs.push(c); });
    });
    function play() {
      clearTimeout(st.coldT);
      if (head) cancelTree(head);
      hopKick(words, st);
      if (head && chs.length) st.coldT = setTimeout(function () { if (head.isConnected) playCold(head, chs); }, words.length ? 400 : 0);
    }
    M.zone(head || kick, play);
    if (head && chs.length && HOVER) head.addEventListener('mouseenter', function () { clearTimeout(st.coldT); playCold(head, chs); });
  });

  /* Scene 2 — Nod (Image Right). */
  M.register('Nod', function (item, rm) {
    if (rm) return;
    var el = firstWithText(item, '.is-accent-phrase'); if (!el) return;
    el.style.display = 'inline-block'; el.style.transformOrigin = '10% 92%';
    var jolting = false;
    /* v6.2 'sleep' step: rotate(1 + k*13) with k = prog(rect, .95, .05); scroll-linked and reversible. */
    M.steps.push(function (vh) {
      if (jolting || !el.isConnected) return;
      var r = el.getBoundingClientRect(), k = M.cl((vh * 0.95 - r.top) / (vh * 0.9));
      el.style.transform = 'rotate(' + (1 + k * 13).toFixed(2) + 'deg)';
    });
    if (!HOVER) return;
    var host = (el.closest && el.closest('h1,h2,h3,h4,h5,h6')) || el;
    host.addEventListener('mouseenter', function () {
      if (jolting || !el.animate) return;
      jolting = true; var cur = el.style.transform || 'rotate(6deg)';
      var a = el.animate([
        { transform: cur },
        { transform: 'rotate(-5deg) translateY(-.08em)', offset: .18 },
        { transform: 'rotate(2deg)', offset: .34 },
        { transform: 'rotate(0deg)', offset: .5 },
        { transform: 'rotate(0deg)', offset: .72 },
        { transform: cur }
      ], { duration: 1600, easing: 'cubic-bezier(.22,.9,.32,1)' });
      a.onfinish = a.oncancel = function () { jolting = false; M.req(); };
    });
  });
})();

/*! The Local Motion Library — scene "Climbing chart" (ported from design prototype v6.2 "08 Two new skills", no new motion).
   A Text Only section whose body holds a list written as `LABEL — TEXT` (one <li> per step) becomes v6.2's staircase:
   white cards climbing left→right under a navy rule, display-face label over a short text, the last step emphasised
   (dashed cold rule, outlined label) as v6.2's "Next" step. Motion is v6.2's 'step' branch, scroll-linked and
   reversible: each card rises from below with a per-index stagger, measured against the chart container
   (k = cl((vh*0.95 - top)/(vh*0.5) - i*0.12), e = 1-(1-k)^3, translateY((1-e)*(34+i*26)px)).
   Data comes from the CMS list only — the list structure is parsed, never article words. The original <ul> stays in
   the DOM for screen readers (clip-hidden); the chart is aria-hidden. Fewer than two parseable items → nothing happens.
   Reduced motion → the chart is built settled, nothing moves. No JavaScript → the list shows as served.
   Every style rule is scoped under [data-tl-scene="climbing-chart"], which the core sets on the section's .w-dyn-item
   before this scene runs. Colours are custom properties (--tl-navy, --tl-cold, --tl-warm, --tl-gold, --tl-cream, --tl-ice). */
(function () {
  'use strict';
  var M = window.TLMotion; if (!M) return;

  var DISPLAY = "bebas-neue-pro,'Bebas Neue Pro','Bebas Neue',Impact,sans-serif";
  var TEXT = "acumin-pro,'Acumin Pro',Archivo,Arial,sans-serif";
  var S = '[data-tl-scene="climbing-chart"]', C = S + ' .tl-m-chart';
  var LOOK = [
    S + '{--tl-navy:#101C3B;--tl-cold:#24739E;--tl-warm:#A65018;--tl-gold:#EAB883;--tl-cream:#FBFBF9;--tl-ice:#E7EFF2;--tl-card:#FFFFFF}',
    /* v6.2 field: ice background, navy text (white cards need the ice to read as cards). */
    S + '{background:var(--tl-ice);display:block;width:100%}',
    S + ' .story-template_section{box-sizing:border-box;width:100%;max-width:none;margin:0;padding:clamp(24px,3vw,48px) clamp(20px,5.6vw,80px);background:var(--tl-ice);color:var(--tl-navy)}',
    S + ' .story-template_section>*{max-width:1280px;margin-left:auto;margin-right:auto}',
    S + ' .story-template_rail{border:0!important}',
    S + ' .story-template_body{border:0!important}',
    /* Source list: kept for assistive tech, visually clipped once the chart exists. */
    S + ' .tl-m-chart-src{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;padding:0!important;border:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important}',
    /* Chart: v6.2 <ol> grid, cards aligned to the top so growing bottom padding forms the staircase. */
    C + '{list-style:none;margin:clamp(28px,4vw,56px) 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,128px),1fr));align-items:start;max-width:100%;overflow:visible;font-family:' + TEXT + ';color:var(--tl-navy)}',
    C + ' .tl-m-chart-step{--i:0;display:flex;flex-direction:column;gap:6px;min-width:0;margin:calc(var(--i) * 8px) 0 0;padding:14px 14px calc(18px + var(--i) * 20px);border-top:3px solid var(--tl-navy);background:var(--tl-card);will-change:transform}',
    C + ' .tl-m-chart-label{display:block;font-family:' + DISPLAY + ';font-weight:400;text-transform:uppercase;letter-spacing:0;font-size:clamp(38px,3.8vw,60px);line-height:.9;color:var(--tl-cold);overflow-wrap:anywhere}',
    C + ' .tl-m-chart-text{display:block;font-family:' + TEXT + ';font-size:clamp(14px,1.15vw,16px);font-weight:600;line-height:1.25;color:var(--tl-navy);overflow-wrap:anywhere}',
    /* Last step (v6.2 "Next"): dashed cold rule, open card, outlined label. */
    C + ' .tl-m-chart-step.is-next{border-top:3px dashed var(--tl-cold);background:transparent}',
    C + ' .tl-m-chart-step.is-next .tl-m-chart-label{color:transparent;-webkit-text-stroke:1.5px var(--tl-cold)}',
    /* Mobile: one column; the climb turns vertical, each step indenting a little further right. No horizontal overflow. */
    '@media (max-width:767px){' +
      C + '{grid-template-columns:minmax(0,1fr);gap:10px}' +
      C + ' .tl-m-chart-step{margin:0 0 0 min(calc(var(--i) * 14px), 28%);padding:12px 14px 16px}' +
      C + ' .tl-m-chart-label{font-size:clamp(34px,10vw,44px)}' +
    '}'
  ].join('\n');
  (function injectLook() {
    if (document.getElementById('tl-m-chart-css')) return;
    var st = document.createElement('style'); st.id = 'tl-m-chart-css'; st.type = 'text/css';
    st.appendChild(document.createTextNode(LOOK));
    (document.head || document.documentElement).appendChild(st);
  })();

  /* `LABEL — TEXT`: em dash, en dash, spaced hyphen or colon as separator. Returns null when the item has no pair. */
  function parseItem(li) {
    var t = (li.textContent || '').replace(/\s+/g, ' ').trim(), m;
    if (!t) return null;
    m = t.match(/^(.+?)\s*[—–]\s*(.+)$/) || t.match(/^(.+?)\s+-\s+(.+)$/) || t.match(/^([^:]+?)\s*:\s*(.+)$/) || t.match(/^(\S+)-(.+)$/);
    if (!m || !m[1] || !m[2]) return null;
    return { label: m[1].trim(), text: m[2].trim() };
  }

  /* First list inside the item's body (prefers .story-template_body, then any rich text) with two or more parseable steps. */
  function findList(item) {
    var roots = [].slice.call(item.querySelectorAll('.story-template_body, .w-richtext'));
    if (!roots.length) roots = [item];
    for (var r = 0; r < roots.length; r++) {
      var lists = roots[r].querySelectorAll('ul, ol');
      for (var l = 0; l < lists.length; l++) {
        var lis = [].slice.call(lists[l].children).filter(function (c) { return c.tagName === 'LI'; });
        var rows = lis.map(parseItem).filter(Boolean);
        if (rows.length >= 2) return { item: item, root: roots[r], list: lists[l], rows: rows };
      }
    }
    return null;
  }

  function el(tag, cls, text) { var e = document.createElement(tag); e.className = cls; if (text != null) e.textContent = text; return e; }

  function build(found) {
    var chart = el('ol', 'tl-m-chart'); chart.setAttribute('aria-hidden', 'true');
    var steps = found.rows.map(function (row, i) {
      var li = el('li', 'tl-m-chart-step' + (i === found.rows.length - 1 ? ' is-next' : ''));
      li.style.setProperty('--i', String(i));
      li.appendChild(el('span', 'tl-m-chart-label', row.label));
      li.appendChild(el('span', 'tl-m-chart-text', row.text));
      chart.appendChild(li); return li;
    });
    /* After the body block (outside the rich text so its list styling never reaches the chart). */
    var body = found.root === found.item ? found.list : found.root;
    body.parentNode.insertBefore(chart, body.nextSibling);
    found.list.classList.add('tl-m-chart-src');
    return { chart: chart, steps: steps };
  }

  /* v6.2 'step' branch, verbatim maths; measured against the chart container, reversible with scroll. */
  function climb(built) {
    M.steps.push(function (vh) {
      var r = built.chart.getBoundingClientRect();
      built.steps.forEach(function (s, i) {
        var k = M.cl((vh * 0.95 - r.top) / (vh * 0.5) - i * 0.12), e = 1 - Math.pow(1 - k, 3);
        s.style.transform = 'translate3d(0,' + ((1 - e) * (34 + i * 26)).toFixed(1) + 'px,0)';
      });
    });
    M.req();
  }

  M.register('Climbing chart', function (item, rm) {
    var found = findList(item); if (!found) return;
    var built = build(found);
    if (rm) { built.steps.forEach(function (s) { s.style.transform = 'none'; s.style.willChange = 'auto'; }); return; }
    climb(built);
  });
})();

/*! The Local Motion Library — hero "Colour shift" (v0.1). Opt-in per story by adding "+ Colour shift" to the Motion Theme
   text (e.g. "Rock + Colour shift"). As the reader scrolls away from the top, the hero title lines move, one after
   another, from their own colour to the story's primary accent colour; scrolling back reverses it. Reduced motion or
   no JavaScript: the hero stays as designed. Colours come from the story's accent fields (CSS variables). */
(function () {
  'use strict';
  var flag = document.getElementById('story-motion-flag');
  if (!flag || !/\+\s*colou?r\s*shift/i.test(flag.textContent || '')) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function rgb(c) { var m = /rgba?\(([^)]+)\)/.exec(c || ''); if (m) return m[1].split(',').slice(0, 3).map(function (v) { return parseFloat(v); });
    var h = (c || '').trim().replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mix(a, b, t) { return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')'; }
  function boot() {
    var page = document.querySelector('.story-template_page') || document.documentElement;
    var warm = rgb(getComputedStyle(page).getPropertyValue('--story-accent-primary')); if (!warm) return;
    var lines = [].slice.call(document.querySelectorAll('.story-template_hero .story-template_hero-title-line'));
    if (!lines.length) return;
    var starts = lines.map(function (l) { return rgb(getComputedStyle(l).color) || warm; });
    var ticking = false;
    function step() { ticking = false;
      var k = Math.min(1, Math.max(0, scrollY / (innerHeight * 0.7)));
      lines.forEach(function (l, i) { var t = Math.min(1, Math.max(0, k * 1.6 - i * 0.18)); var c = mix(starts[i], warm, t);
        l.style.color = c; [].slice.call(l.querySelectorAll('p')).forEach(function (p) { p.style.color = c; }); }); }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(step); } }, { passive: true });
    step();
  }
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();

/*! The Local Motion Library — scenes "Ice band", "Navy band", "Amber band" (ported from design prototype v6.2, look only).
   Three reusable, purely visual bands. No motion: each scene is one <style> (injected once at load) that restyles the
   native Webflow Story Section blocks to the v6.2 rest state of the matching screen:
     Ice band   → v6.2 "08 Two new skills"  (ice field, cold-blue display accent, serif italic tail, navy text)
     Navy band  → v6.2 "09 Motorcycles"     (navy field, sky + gold display heading full width above image and text)
     Amber band → v6.2 "11 Close"           (amber field, cream display heading, serif italic gold word set right)
   Each band works on whichever template block carries it: Image Left (sort 70/90), Image Right (sort 80), Travel
   Two-Column Gallery (sort 93) and Text Only (sort 100). The DOM is never reordered; where v6.2 places the heading
   above image and text (Navy) or below the body (Amber), CSS grid `order` on the existing containers does it.
   Every rule is scoped under [data-tl-scene="ice-band"] / [data-tl-scene="navy-band"] / [data-tl-scene="amber-band"],
   which the core sets on the section's .w-dyn-item before the scene runs, so nothing else on the page is touched.
   `transform` on .is-accent-phrase is never set here (another scene may animate it). Selection is by class only,
   never by text. No JavaScript → the server-rendered page as is. */
(function () {
  'use strict';
  var M = window.TLMotion; if (!M) return;

  var DISPLAY = "bebas-neue-pro,'Bebas Neue Pro','Bebas Neue',Impact,sans-serif";
  var SERIF = "quiche-flare,'Fraunces',Georgia,serif";
  var TEXT = "acumin-pro,'Acumin Pro',Archivo,Arial,sans-serif";

  var I = '[data-tl-scene="ice-band"]', N = '[data-tl-scene="navy-band"]', A = '[data-tl-scene="amber-band"]';
  var ALL = [I, N, A];
  /* Join a selector suffix onto every band: each(' .x') → 'I .x,N .x,A .x'. */
  function each(suffix) { return ALL.map(function (s) { return s + suffix; }).join(','); }
  var IS = I + ' .story-template_section', NS = N + ' .story-template_section', AS = A + ' .story-template_section';
  var TITLE_ALL = '.story-template_feature-title,.tl-feature-title-xl,.story-template_statement';
  function titles(scope) { return TITLE_ALL.split(',').map(function (c) { return scope + ' ' + c; }).join(','); }
  var SPLITS = '.is-story-imageleft-split,.is-story-imageright-split';
  function splits(scope, tail) { return SPLITS.split(',').map(function (c) { return scope + ' ' + c + (tail || ''); }).join(','); }

  var LOOK = [
    /* ---------- Shared band chassis (all three) ---------- */
    each('') + '{--tl-ice:#E7EFF2;--tl-cold:#24739E;--tl-navy:#101C3B;--tl-warm:#7A3A12;--tl-gold:#EAB883;--tl-cream:#FBFBF9;--tl-sky:#A3D7EB;display:block;width:100%}',
    each(' .story-template_section') + '{position:relative;box-sizing:border-box;width:100%;margin:0;padding:clamp(72px,9vw,140px) clamp(20px,5.6vw,80px);overflow-x:clip;font-family:' + TEXT + '}',
    each(' .story-template_container') + '{box-sizing:border-box;width:100%;max-width:1440px;margin:0 auto;padding:0}',
    /* One column: rail (number + kicker) above the main column, never a side rail. */
    each(' .story-template_grid') + '{display:grid;grid-template-columns:minmax(0,1fr);gap:0;align-items:start}',
    each(' .story-template_grid>*') + '{grid-column:1/-1;grid-row:auto;min-width:0;width:auto;max-width:none}',
    each(' .story-template_rail') + '{position:static;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 12px;margin:0 0 10px;padding:0;writing-mode:horizontal-tb;transform:none}',
    each(' .story-template_rail-num') + ',' + each(' .story-template_rail-label') + ',' + each(' .story-template_eyebrow') +
      '{margin:0;padding:0;font-family:' + TEXT + ';font-size:13px;font-weight:700;line-height:1.3;letter-spacing:.16em;text-transform:uppercase;writing-mode:horizontal-tb;transform:none}',
    each(' .story-template_main') + '{margin:0;padding:0;min-width:0}',
    /* Images: uncropped, full column width, natural ratio. */
    each(' img') + '{display:block;max-width:100%;height:auto}',
    each(' .story-template_inline-image') + '{display:block;width:100%;height:auto;max-height:none;aspect-ratio:auto;object-fit:contain;margin:0;border-radius:0}',
    each(' .story-template_inline-caption') + ',' + each(' .story-template_caption') + '{margin:12px 0 0;padding:0;font-family:' + TEXT + ';font-size:15px;font-weight:500;line-height:1.4;text-align:left}',
    /* Headings: block-level phrases; the h3 itself carries no type of its own. */
    titles('[data-tl-scene="ice-band"]') + ',' + titles('[data-tl-scene="navy-band"]') + ',' + titles('[data-tl-scene="amber-band"]') +
      '{display:block;margin:0;padding:0;max-width:none;width:auto;font-weight:400;font-style:normal;letter-spacing:0;line-height:.86;text-transform:none;overflow-wrap:anywhere}',
    each(' .is-heading-phrase') + ',' + each(' .is-accent-phrase') + '{display:block;margin:0;padding:0;max-width:100%;letter-spacing:0}',
    each(' .is-heading-phrase.w-dyn-bind-empty') + ',' + each(' .is-accent-phrase.w-dyn-bind-empty') + '{display:none}',
    /* Body copy. */
    each(' .w-richtext') + ',' + each(' .story-template_body') + '{margin:0;padding:0;font-family:' + TEXT + '}',
    each(' .w-richtext p') + ',' + each(' .w-richtext li') + ',' + each(' .w-richtext h6') + '{margin:0 0 1em;font-size:clamp(17px,1.32vw,19px);line-height:1.62;color:inherit;text-wrap:pretty}',
    each(' .w-richtext>:last-child') + '{margin-bottom:0}',
    /* Split layouts: a single column by default (bands lay the pieces out below). */
    splits(I) + ',' + splits(N) + ',' + splits(A) + '{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(28px,4vw,56px);align-items:start;margin:0;padding:0}',
    splits(I, '>*') + ',' + splits(N, '>*') + ',' + splits(A, '>*') + '{min-width:0;width:auto;max-width:none;margin:0;padding:0}',
    /* Gallery chassis (Travel Two-Column Gallery): cards sit directly on the band. */
    each(' .story-template_gallery') + '{box-sizing:border-box;width:100%;max-width:1440px;margin:0 auto;padding:0;background:transparent}',
    each(' .story-template_gallery>.w-dyn-list') + '{margin:0;padding:0}',
    each(' .story-template_gallery .w-dyn-items') + '{display:flex;flex-wrap:nowrap;gap:clamp(16px,1.8vw,28px);align-items:flex-start;margin:0;padding:0}',
    each(' .story-template_gallery .w-dyn-item') + '{flex:1 1 0;min-width:0;margin:0;padding:0}',
    each(' .story-template_gallery-card') + '{display:block;margin:0;padding:0;background:transparent;border:0;border-radius:0;box-shadow:none;color:inherit}',
    each(' .story-template_gallery-img') + '{display:block;width:100%;height:auto;max-height:none;aspect-ratio:auto;overflow:visible;margin:0;padding:0;border-radius:0;background:transparent}',
    each(' .story-template_gallery-img img') + '{display:block;width:100%;height:auto;max-height:none;aspect-ratio:auto;object-fit:contain;object-position:50% 50%;border-radius:0}',
    each(' .tl-gallery-meta') + ',' + each(' .story-template_gallery-card-body') + ',' + each(' .story-template_travel-card-title') +
      '{margin:12px 0 0;padding:0;font-family:' + TEXT + ';font-size:15px;font-weight:500;line-height:1.4;text-align:left}',
    each(' .story-template_travel-card-title.w-dyn-bind-empty') + '{display:none}',
    each(' .story-template_gallery-intro') + '{display:block;margin:0 0 clamp(28px,3vw,48px);padding:0;font-weight:400;letter-spacing:0;overflow-wrap:anywhere}',

    /* ---------- Ice band (v6.2 "08 Two new skills") ---------- */
    I + ',' + IS + '{background:var(--tl-ice);color:var(--tl-navy)}',
    IS + ' .story-template_rail-num{color:var(--tl-cold)}',
    IS + ' .story-template_rail-label,' + IS + ' .story-template_eyebrow{color:var(--tl-navy)!important}',
    IS + ' .story-template_inline-caption,' + IS + ' .story-template_caption,' + IS + ' .tl-gallery-meta,' + IS + ' .story-template_gallery-card-body{color:var(--tl-navy)}',
    IS + ' .tl-gallery-meta{color:var(--tl-cold)}',
    /* Heading: accent in cold-blue display, the tail in serif italic navy, any lead phrase in a smaller navy display line. */
    titles(IS) + '{line-height:.84;color:var(--tl-navy)}',
    IS + ' .story-template_feature-title:not(:has(.is-accent-phrase)),' + IS + ' .tl-feature-title-xl:not(:has(.is-accent-phrase)),' + IS + ' .story-template_statement' +
      '{font-family:' + DISPLAY + ';text-transform:uppercase;color:var(--tl-cold);font-size:clamp(64px,11vw,180px);line-height:.84}',
    IS + ' .is-heading-phrase{font-family:' + DISPLAY + ';text-transform:uppercase;color:var(--tl-navy);font-size:clamp(28px,3.4vw,52px);line-height:.9;margin:0 0 .12em}',
    IS + ' .is-accent-phrase{font-family:' + DISPLAY + ';font-style:normal;text-transform:uppercase;color:var(--tl-cold);font-size:clamp(72px,17vw,280px);line-height:.84;vertical-align:top}',
    IS + ' .is-accent-phrase~.is-heading-phrase{font-family:' + SERIF + ';font-style:italic;font-weight:400;text-transform:none;color:var(--tl-navy);font-size:clamp(36px,4.4vw,72px);line-height:1;margin:.05em 0 0}',
    IS + ' .story-template_gallery-intro{font-family:' + DISPLAY + ';text-transform:uppercase;color:var(--tl-cold);font-size:clamp(64px,11vw,180px);line-height:.84}',
    /* Body: beside the heading at the right (v6.2 flex row, bottom aligned), under it on small screens. */
    IS + ' .w-richtext,' + IS + ' .story-template_body{color:var(--tl-navy)}',
    IS + ' .story-template_main>.w-richtext,' + IS + ' .story-template_main>.story-template_body,' + splits(IS, '>div>.w-richtext') + '{max-width:560px}',
    /* Image: the text block first, the photo below it at the width of one v6.2 photo column. */
    IS + ' .is-story-imageleft-split>div:first-child{order:2}',
    IS + ' .is-story-imageright-split>div:last-child{order:2}',
    IS + ' .story-template_gallery .w-dyn-items{border-top:0;padding-top:0}',
    /* 5 Oct (Désirée): large photos, even spacing, one colour across the whole band. */
    each(' .story-template_rail') + '{border:0!important}',
    each(' .story-template_quote-block:empty') + '{display:none!important}',
    IS + '{padding:clamp(48px,6vw,96px) clamp(20px,5.6vw,80px)}',
    IS + ' .story-template_container{max-width:1280px}',
    splits(IS) + '{gap:clamp(24px,3vw,40px)}',
    IS + ' .is-story-imageleft-split>div:first-child,' + IS + ' .is-story-imageright-split>div:last-child{width:100%;max-width:none}',
    IS + ' .story-template_inline-image{width:100%!important;max-width:none!important}',

    /* ---------- Navy band (v6.2 "09 Motorcycles") ---------- */
    N + ',' + NS + '{background:var(--tl-navy);color:var(--tl-cream)}',
    NS + '{padding-bottom:clamp(80px,9vw,150px)}',
    NS + ' .story-template_rail{margin-bottom:20px}',
    NS + ' .story-template_rail-num{color:var(--tl-gold)}',
    NS + ' .story-template_rail-label,' + NS + ' .story-template_eyebrow{color:var(--tl-cream)!important}',
    NS + ' .story-template_inline-caption,' + NS + ' .story-template_caption,' + NS + ' .story-template_gallery-card-body{color:var(--tl-cream)}',
    NS + ' .tl-gallery-meta{color:var(--tl-gold)}',
    /* Heading: sky display lead line, gold display accent, full width above everything. */
    titles(NS) + '{text-transform:uppercase;color:var(--tl-gold);margin:0 0 clamp(28px,3vw,48px)}',
    NS + ' .story-template_feature-title:not(:has(.is-accent-phrase)),' + NS + ' .tl-feature-title-xl:not(:has(.is-accent-phrase)),' + NS + ' .story-template_statement' +
      '{font-family:' + DISPLAY + ';font-size:clamp(56px,11vw,176px);line-height:.9}',
    NS + ' .is-heading-phrase{font-family:' + DISPLAY + ';font-style:normal;text-transform:uppercase;color:var(--tl-sky);font-size:clamp(40px,6.6vw,104px);line-height:.9}',
    NS + ' .is-accent-phrase{font-family:' + DISPLAY + ';font-style:normal;text-transform:uppercase;color:var(--tl-gold);font-size:clamp(56px,11vw,176px);line-height:.92;letter-spacing:.004em}',
    NS + ' .story-template_gallery-intro{font-family:' + DISPLAY + ';text-transform:uppercase;color:var(--tl-gold);font-size:clamp(56px,11vw,176px);line-height:.92}',
    /* Layout: the heading leaves its text column (display:contents) so the split grid can order it first, the photo
       second (centred, up to 960px), the body third (indented, larger, medium weight) — v6.2 order, DOM unchanged. */
    splits(NS, '>div:has(>.story-template_feature-title)') + ',' + splits(NS, '>div:has(>.tl-feature-title-xl)') + '{display:contents}',
    splits(NS, ' .story-template_feature-title') + ',' + splits(NS, ' .tl-feature-title-xl') + '{order:-2}',
    splits(NS, '>div:has(>.story-template_inline-image)') + '{order:-1;justify-self:center;width:100%;max-width:960px;margin:0 auto clamp(28px,4vw,64px)}',
    splits(NS, '>div:has(>.story-template_inline-image) .story-template_inline-caption') + '{text-align:center}',
    NS + ' .w-richtext,' + NS + ' .story-template_body{color:var(--tl-cream)}',
    NS + ' .story-template_main .w-richtext,' + NS + ' .story-template_main .story-template_body{max-width:760px;margin-left:clamp(0px,16vw,240px)}',
    NS + ' .story-template_main .w-richtext p,' + NS + ' .story-template_main .w-richtext li,' + NS + ' .story-template_main .w-richtext h6{font-size:clamp(20px,1.75vw,25px);line-height:1.5;font-weight:500}',
    /* Gallery: gold rule over a row of three uncropped photos, captions beneath. */
    NS + ' .story-template_gallery .w-dyn-items{border-top:3px solid var(--tl-gold);padding-top:clamp(20px,2vw,28px)}',
    /* 5 Oct (Désirée: "all over the place" vs v6.2): heading → text → large photo → one tidy row of photos. */
    NS + '{padding:clamp(48px,6vw,96px) clamp(20px,5.6vw,80px)}',
    NS + ' .story-template_container{max-width:1280px}',
    splits(NS, '>div:has(>.story-template_inline-image)') + '{order:-1;justify-self:stretch;max-width:1280px;margin:0 0 clamp(28px,4vw,64px)}',
    splits(NS, '>div:has(>.story-template_inline-image) .story-template_inline-caption') + '{text-align:left}',
    NS + ' .story-template_main .w-richtext,' + NS + ' .story-template_main .story-template_body{margin-left:clamp(0px,18vw,300px);max-width:820px}',
    '@media (max-width:767px){' + NS + ' .story-template_main .w-richtext{margin-left:0}}',
    NS + ' .story-template_gallery-intro.tl-continued{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    NS + ' .story-template_gallery .w-dyn-items{gap:clamp(16px,2vw,28px);align-items:flex-start}',
    NS + ' .story-template_gallery{max-width:1200px}',
    NS + ' .story-template_gallery .w-dyn-items>.w-dyn-item:nth-child(n) .story-template_gallery-img,' + NS + ' .story-template_gallery-img,' + NS + ' .is-gallery-img-frame{display:block!important;height:auto!important;flex:none!important;aspect-ratio:auto!important;min-height:0!important;max-height:none!important;padding:0!important}',
    IS + ' .tl-ice-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(16px,2.4vw,36px);align-items:start;margin:0 0 0}',
    IS + ' .tl-ice-pair>div{width:100%!important;margin:0!important;order:0!important}',
    IS + ' .tl-ice-pair .story-template_inline-image{width:100%!important;height:auto!important}',
    IS + ' .tl-moved{display:none!important}',
    IS + '.tl-has-pair{padding-top:clamp(24px,3vw,48px)}',
    IS + '.tl-gave-photo{padding-bottom:clamp(24px,3vw,48px)}',
    '@media (max-width:767px){' + IS + ' .tl-ice-pair{grid-template-columns:minmax(0,1fr)}}',
    IS + '.tl-no-title .story-template_main .w-richtext{justify-self:start!important;text-align:left!important;margin-left:0!important;font-size:clamp(20px,1.75vw,25px)}',
    NS + ' .story-template_gallery-card-body,' + NS + ' .story-template_gallery-card-body *{position:static!important;transform:none!important;text-align:left!important;margin-left:0!important}',
    NS + ' .story-template_gallery-card-body{margin:12px 0 0!important;padding:0!important;min-height:0!important}',
    NS + ' .story-template_gallery .w-dyn-item{margin:0!important;grid-column:auto;transform:none}',
    NS + ' .story-template_gallery-img{position:relative;height:auto!important;padding:0!important}',
    NS + ' .story-template_gallery-img img,' + NS + ' .story-template_gallery-card img{position:static!important;inset:auto;width:100%!important;height:auto!important;object-fit:contain!important;transform:none}',
    '@media (max-width:767px){' + NS + ' .story-template_gallery .w-dyn-items{flex-wrap:wrap}' + NS + ' .story-template_gallery .w-dyn-item{flex:1 1 100%!important}}',

    /* ---------- Amber band (v6.2 "11 Close") ---------- */
    A + ',' + AS + '{background:var(--tl-warm);color:var(--tl-cream)}',
    AS + '{padding-bottom:clamp(80px,9vw,150px)}',
    AS + ' .story-template_rail{margin-bottom:clamp(24px,3vw,40px)}',
    AS + ' .story-template_rail-num{color:var(--tl-gold)}',
    AS + ' .story-template_rail-label,' + AS + ' .story-template_eyebrow{color:var(--tl-cream)!important}',
    AS + ' .story-template_inline-caption,' + AS + ' .story-template_caption,' + AS + ' .story-template_gallery-card-body{color:var(--tl-cream)}',
    AS + ' .tl-gallery-meta{color:var(--tl-gold)}',
    /* Body first (indented column), then the heading as the closing line: grid order on the existing containers. */
    AS + ' .story-template_main,' + splits(AS, '>div') + '{display:grid;grid-template-columns:minmax(0,1fr);gap:0}',
    titles(AS) + '{order:2;margin:clamp(56px,7vw,112px) 0 0;text-transform:uppercase;color:var(--tl-cream);line-height:.86}',
    AS + ' .w-richtext,' + AS + ' .story-template_body{order:1;color:var(--tl-cream);max-width:660px;margin-left:clamp(0px,16vw,240px)}',
    AS + ' .w-richtext p{margin:0 0 1.2em}',
    AS + ' .w-richtext p:last-child{font-size:clamp(22px,2.1vw,30px);line-height:1.3;font-weight:600;margin-bottom:0}',
    AS + ' .w-richtext p:only-child{font-size:clamp(17px,1.32vw,19px);line-height:1.62;font-weight:400}',
    /* Heading: cream display lines; the accent word in serif italic gold, set to the right (v6.2 "warm,"). */
    AS + ' .story-template_feature-title:not(:has(.is-accent-phrase)),' + AS + ' .tl-feature-title-xl:not(:has(.is-accent-phrase)),' + AS + ' .story-template_statement' +
      '{font-family:' + DISPLAY + ';font-size:min(9.2vw,150px);line-height:.88;letter-spacing:-.004em;overflow-wrap:normal;word-break:normal;hyphens:none;text-wrap:balance}',
    AS + ' .is-heading-phrase{font-family:' + DISPLAY + ';font-style:normal;text-transform:uppercase;color:var(--tl-cream);font-size:min(14.2vw,224px);line-height:.86;letter-spacing:-.004em}',
    AS + ' .is-accent-phrase{font-family:' + SERIF + ';font-style:italic;font-weight:500;text-transform:none;color:var(--tl-gold);font-size:min(17vw,268px);line-height:.84;text-align:right;margin:-.04em 0 -.02em}',
    AS + ' .is-accent-phrase~.is-heading-phrase{font-size:min(9.4vw,150px);line-height:.9}',
    /* Accent word written _like this_ in a plain heading: its own line, serif italic gold, set right (v6.2 "warm,"). */
    AS + ' .story-template_feature-title:has(.tl-accent-inline),' + AS + ' .tl-feature-title-xl:has(.tl-accent-inline),' + AS + ' .story-template_statement:has(.tl-accent-inline){font-size:min(12.4vw,196px)!important;line-height:.86;text-transform:uppercase;color:var(--tl-cream)}',
    AS + ' .tl-word:has(>.tl-accent-inline){display:block!important;text-align:right}',
    AS + ' .tl-spot-line{display:block;transform-origin:left center}',
    AS + ' .tl-spot-line.is-accent{transform-origin:right center}',
    '@media (prefers-reduced-motion: reduce){' + AS + ' .tl-spot-line{scale:1!important;opacity:1!important}}',
    AS + ' .story-template_eyebrow .tl-accent-inline,' + AS + ' .story-template_rail-label .tl-accent-inline{display:inline-block;transform-origin:50% 100%;color:var(--tl-gold);font-size:1.35em;font-family:inherit;font-style:normal;font-weight:700;text-transform:uppercase;text-align:left;margin:0;line-height:1}',
    AS + ' .tl-accent-inline{display:block;font-family:' + SERIF + ';font-style:italic;font-weight:500;text-transform:none;color:var(--tl-gold);font-size:1.18em;line-height:.84;text-align:right;margin:-.04em 0 -.02em}',
    AS + ' .story-template_gallery-intro{font-family:' + DISPLAY + ';text-transform:uppercase;color:var(--tl-cream);font-size:min(14.2vw,224px);line-height:.86}',
    AS + ' .story-template_gallery .w-dyn-items{border-top:3px solid var(--tl-gold);padding-top:clamp(20px,2vw,28px)}',

    /* ---------- Wide (≥768): v6.2 two-up text blocks and half-width photos ---------- */
    '@media (min-width:768px){' +
      /* Ice: heading left, body right, bottom aligned (v6.2 flex row). Only when the text block is exactly heading + body. */
      IS + ' .story-template_main:has(>.story-template_feature-title:first-child+.w-richtext:last-child),' +
      IS + ' .story-template_main:has(>.story-template_feature-title:first-child+.story-template_body:last-child),' +
      splits(IS, '>div:has(>.story-template_feature-title:first-child+.w-richtext:last-child)') + ',' +
      splits(IS, '>div:has(>.tl-feature-title-xl:first-child+.w-richtext:last-child)') +
        '{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:clamp(24px,4vw,72px);align-items:end}' +
      IS + ' .story-template_main>.w-richtext,' + IS + ' .story-template_main>.story-template_body,' + splits(IS, '>div>.w-richtext') + '{justify-self:end}' +
      /* Ice: a lone photo takes one v6.2 photo column (half the row), left-aligned under the text. */
      IS + ' .is-story-imageleft-split>div:first-child,' + IS + ' .is-story-imageright-split>div:last-child{width:100%;margin-top:clamp(16px,2vw,28px)}' +
      splits(IS, '>div:not(:has(>.story-template_feature-title)):not(:has(>.tl-feature-title-xl))>.w-richtext') + '{justify-self:start}' +
      /* Navy / Amber: wide bodies keep their v6.2 indents (already set); nothing else changes. */
    '}',

    /* ---------- Small (≤767): one column, stacked gallery, body indents eased ---------- */
    '@media (max-width:767px){' +
      each(' .story-template_section') + '{padding-left:20px;padding-right:20px}' +
      each(' .story-template_gallery .w-dyn-items') + '{flex-direction:column;gap:32px}' +
      each(' .story-template_gallery .w-dyn-item') + '{flex:none;width:100%}' +
      IS + ' .story-template_main>.w-richtext,' + IS + ' .story-template_main>.story-template_body,' + splits(IS, '>div>.w-richtext') + '{max-width:none;margin-top:clamp(20px,5vw,28px)}' +
      AS + ' .w-richtext,' + AS + ' .story-template_body{margin-left:clamp(0px,16vw,240px)}' +
    '}',
    /* ---------- Narrowest (≤360): no indents so the body keeps a readable measure ---------- */
    '@media (max-width:360px){' +
      NS + ' .story-template_main .w-richtext,' + NS + ' .story-template_main .story-template_body,' + AS + ' .w-richtext,' + AS + ' .story-template_body{margin-left:0}' +
    '}'
  ].join('\n');

  (function injectLook() {
    if (document.getElementById('tl-m-bands-css')) return;
    var st = document.createElement('style'); st.id = 'tl-m-bands-css'; st.type = 'text/css';
    st.appendChild(document.createTextNode(LOOK));
    (document.head || document.documentElement).appendChild(st);
  })();

  /* The bands are CSS only; the scene functions exist so the core marks the item ([data-tl-scene]) and the look applies. */
  M.register('Ice band', function (item, rm) {
    /* A section whose heading fields are all empty: its text starts at the left, not beside an empty heading. */
    var sec = item.querySelector('.story-template_section'), h = item.querySelector('.story-template_feature-title,.tl-feature-title-xl');
    if (sec && (!h || !h.textContent.trim())) sec.classList.add('tl-no-title');
    /* v6.2 "two new skills": a headless photo section later in the same band joins the band's lead section —
       its sentence continues the lead text, and both photos sit side by side here, after anything in between. */
    if (!sec || !sec.classList.contains('tl-no-title')) return;
    var all = [].slice.call(document.querySelectorAll('[data-tl-scene]')), i = all.indexOf(item), lead = null;
    for (var j = i - 1; j >= 0; j--) { var k = all[j].getAttribute('data-tl-scene');
      if (k === 'ice-band') { if (!all[j].querySelector('.tl-no-title')) { lead = all[j]; break; } continue; }
      if (k !== 'climbing-chart') break; }
    if (!lead) return;
    var pick = function (it) { var im = it.querySelector('.story-template_inline-image'); return im && im.parentElement; };
    var mine = pick(item), theirs = pick(lead), myText = sec.querySelector('.w-richtext'), leadText = lead.querySelector('.w-richtext');
    if (!mine || !theirs) return;
    if (myText && leadText) {
      var last = leadText.lastElementChild, kids = [].slice.call(myText.children);
      /* One short sentence continues the lead's last paragraph (v6.2); anything longer follows as its own paragraphs. */
      if (kids.length === 1 && last && last.tagName === 'P' && kids[0].tagName === 'P' && kids[0].textContent.length < 140) { last.appendChild(document.createTextNode(' ')); while (kids[0].firstChild) last.appendChild(kids[0].firstChild); }
      else kids.forEach(function (p) { leadText.appendChild(p); });
      myText.classList.add('tl-moved'); }
    var row = document.createElement('div'); row.className = 'tl-ice-pair';
    row.appendChild(theirs); row.appendChild(mine);
    var main = sec.querySelector('.story-template_main') || sec; main.insertBefore(row, main.firstChild);
    sec.classList.add('tl-has-pair'); lead.querySelector('.story-template_section').classList.add('tl-gave-photo');
    if (window.ScrollTrigger) M.safe(function () { ScrollTrigger.refresh(); });
  });
  M.register('Navy band', function (item, rm) {
    /* Photo row: equal columns, top aligned (v6.2). */
    [].slice.call(item.querySelectorAll('.story-template_gallery .w-dyn-item')).forEach(function (c) {
      var im = c.querySelector('img'); if (!im) return; im.loading = 'eager';
      c.style.flex = '1 1 0';
    });
    /* A gallery straight after a navy section that already has a heading continues it: its intro stays for screen readers only. */
    var intro = item.querySelector('.story-template_gallery-intro'); if (!intro) return;
    var all = [].slice.call(document.querySelectorAll('[data-tl-scene]')), prev = all[all.indexOf(item) - 1];
    var h = prev && prev.getAttribute('data-tl-scene') === 'navy-band' && prev.querySelector('.story-template_feature-title,.tl-feature-title-xl');
    if (h && h.textContent.trim()) intro.classList.add('tl-continued');
  });
  /* Word boom (Karen's road title, Rock engine wordBoom, generalised): each word appears large at the centre of the
     screen, then lands in place, one word per beat. A word that holds a styled accent keeps the accent's look. */
  function wordBoom(h) {
    var g = window.gsap; if (!g || !window.ScrollTrigger) return;
    var words = [].slice.call(h.querySelectorAll('.tl-word')); if (!words.length) words = M.split(h, 'words', 'tl-word');
    if (!words.length) return;
    /* 6 Oct (Désirée): softer. The heading rises in gently, word by word; only the accent word (written _like this_)
       gets the boom — it appears large at the centre of the screen and lands in place. No accent word → soft only. */
    var accent = words.filter(function (w) { return w.querySelector('.tl-accent-inline') || w.classList.contains('tl-accent-inline'); });
    var soft = words.filter(function (w) { return accent.indexOf(w) < 0; });
    g.killTweensOf(words); g.set(words, { clearProps: 'transform' });
    g.set(soft, { opacity: 0, y: '0.22em' }); g.set(accent, { opacity: 0 });
    ScrollTrigger.create({ trigger: h, start: 'top 80%', once: true, onEnter: function () {
      g.to(soft, { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out', stagger: 0.12 });
      var ov = document.getElementById('tl-boom');
      if (!ov) { ov = document.createElement('div'); ov.id = 'tl-boom'; ov.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:99999'; document.body.appendChild(ov); }
      var vw = innerWidth, vh = innerHeight;
      accent.forEach(function (w, idx) {
        var src = (w.children.length === 1 && w.textContent.trim() === w.children[0].textContent.trim()) ? w.children[0] : w;
        var r = src.getBoundingClientRect(), cs = getComputedStyle(src), c = document.createElement('span');
        c.textContent = src.textContent;
        c.style.cssText = 'position:absolute;margin:0;padding:0;white-space:nowrap;left:' + r.left + 'px;top:' + r.top + 'px;font-family:' + cs.fontFamily + ';font-weight:' + cs.fontWeight + ';font-style:' + cs.fontStyle + ';font-size:' + cs.fontSize + ';line-height:' + cs.lineHeight + ';letter-spacing:' + cs.letterSpacing + ';text-transform:' + cs.textTransform + ';color:' + cs.color + ';';
        ov.appendChild(c);
        var dx = vw / 2 - (r.left + r.width / 2), dy = vh / 2 - (r.top + r.height / 2);
        var sc = Math.max(1.6, Math.min(Math.min(vw * 0.7 / Math.max(r.width, 1), vh * 0.45 / Math.max(r.height, 1)), 6));
        g.set(c, { transformOrigin: '50% 50%', x: dx, y: dy, scale: sc, opacity: 0 });
        var tl = g.timeline({ delay: 0.5 + soft.length * 0.12 + idx * 0.6 });
        tl.to(c, { opacity: 1, duration: 0.35, ease: 'power2.out' }); tl.to(c, { duration: 0.25 });
        tl.to(c, { x: 0, y: 0, scale: 1, duration: 0.9, ease: 'power3.out', onComplete: function () { g.set(w, { opacity: 1 }); if (c.parentNode) c.parentNode.removeChild(c); } });
      });
    } });
  }
  /* Scroll spotlight (adapted from The Local's Local Business People "Things Worth Knowing" scale-up, same numbers):
     each heading line sits small and quiet (scale .42, opacity .30) and grows to full size and strength as it crosses
     the reading line (68% of the screen); scrolling back up returns it. Follows the scroll, never a one-off. Lines are
     the text before the accent word, the accent word (written _like this_), and the text after it. 6 Oct (Désirée). */
  function spotlight(h) {
    var g = window.gsap;
    var words = [].slice.call(h.querySelectorAll('.tl-word'));
    if (g && words.length) { g.killTweensOf(words); g.set(words, { clearProps: 'transform,opacity' }); }
    var acc = h.querySelector('.tl-accent-inline'); if (!acc) return;
    var accHost = acc; while (accHost.parentNode && accHost.parentNode !== h) accHost = accHost.parentNode;
    var kids = [].slice.call(h.childNodes), i = kids.indexOf(accHost);
    var mk = function (cls) { var s = document.createElement('span'); s.className = 'tl-spot-line ' + cls; return s; };
    var a = mk('is-before'), b = mk('is-accent'), c = mk('is-after');
    kids.slice(0, i).forEach(function (n) { a.appendChild(n); }); b.appendChild(accHost); kids.slice(i + 1).forEach(function (n) { c.appendChild(n); });
    [a, b, c].forEach(function (s) { if (s.textContent.trim()) h.appendChild(s); });
    var rows = [].slice.call(h.querySelectorAll('.tl-spot-line'));
    var SMALL = 0.42, DIM = 0.30, ease = function (t) { return 1 - Math.pow(1 - t, 2.2); };
    M.steps.push(function (vh) {
      var focus = vh * 0.68, band = vh * 0.34, atEnd = (scrollY + vh) >= (document.documentElement.scrollHeight - 160);
      rows.forEach(function (row) { var r = row.getBoundingClientRect(), t = (focus - (r.top + r.height / 2)) / band;
        if (atEnd) t = 1; t = M.cl(t, 0, 1); var e = ease(t);
        row.style.scale = (SMALL + (1 - SMALL) * e).toFixed(4); row.style.opacity = (DIM + (1 - DIM) * e).toFixed(3); });
    });
    M.req();
  }
  /* Bump (v6.2 "if you bump into him"): an accent word in the kicker drops in large, squashes and settles. */
  function bump(el) {
    el.getAnimations().forEach(function (a) { a.cancel(); });
    el.animate([{ transform: 'translateY(-1.5em) scale(2)' }, { transform: 'translateY(0) scale(1.14,.82)', offset: .3 }, { transform: 'translateY(-.42em) scale(.96,1.06)', offset: .46 },
      { transform: 'translateY(0) scale(1.05,.95)', offset: .6 }, { transform: 'translateY(-.16em)', offset: .72 }, { transform: 'translateY(0)', offset: .82 }, { transform: 'translateY(-.05em)', offset: .91 }, { transform: 'none' }],
      { duration: 1150, easing: 'cubic-bezier(.3,0,.35,1)', fill: 'backwards' });
  }
  M.register('Amber band', function (item, rm) {
    var kick = [].slice.call(item.querySelectorAll('.story-template_eyebrow .tl-accent-inline,.story-template_rail-label .tl-accent-inline'));
    if (!rm) kick.forEach(function (el) { M.zone(el, bump, 0.84, 0.1); el.addEventListener('mouseenter', function () { bump(el); }); });
    var h = item.querySelector('.story-template_feature-title,.tl-feature-title-xl,.story-template_statement');
    if (h && !rm) M.safe(function () { spotlight(h); });
  });
})();

/*! The Local Motion Library — story look "Thaw" + section scenes "Paper band" and "Pull line" (v0.1).
   Story look: opt in by adding "+ Thaw" to the Motion Theme text (e.g. "Rock + Colour shift + Thaw"). Restyles the
   hero (navy, v6.2 title colours and two-row title), shows photos uncropped, ends a closing full-bleed photo on a
   brown band, and overlays the "We'll end on this" label and caption on the photo. Scoped to html.tl-look-thaw.
   Scenes (chosen per section with Visual Scene): "Paper band" — paper background, serif-italic split heading (or a
   stacked display heading whose last word turns serif-italic amber); "Pull line" — ice background, the body's last
   paragraph set as a large serif-italic pull line. Selection is by structure/position only, never by words. */
(function () {
  'use strict';
  var flag = document.getElementById('story-motion-flag');
  var THAW = !!(flag && /\+\s*thaw\b/i.test(flag.textContent || ''));
  var D = "bebas-neue-pro,'Bebas Neue Pro','Bebas Neue',Impact,sans-serif", SERIF = "quiche-flare,'Fraunces',Georgia,serif",
      TXT = "acumin-pro,'Acumin Pro',Archivo,Arial,sans-serif";
  var V = '--tl-navy:#101C3B;--tl-ice:#E7EFF2;--tl-paper:#FAFAF8;--tl-cream:#FBFBF9;--tl-cold:#24739E;--tl-sky:#A3D7EB;--tl-gold:#EAB883;--tl-warm:#A65018;--tl-toque:#7A3A12;';
  var H = 'html.tl-look-thaw .story-template_hero';
  var css = [
    'html.tl-look-thaw{' + V + '}',
    /* hero */
    H + '{background:var(--tl-navy);color:var(--tl-cream)}',
    H + ' .story-template_hero-shapes,' + H + ' .story-template_hero-dots{display:none!important}',
    H + ' .story-template_hero-kicker{color:var(--tl-gold)!important;font-family:' + TXT + ';font-size:13px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}',
    H + ' .story-template_hero-title-line,' + H + ' .story-template_hero-title-line p{font-family:' + D + '!important;font-weight:400!important;text-transform:uppercase;line-height:.84;letter-spacing:.004em}',
    H + ' .tl-hl-1{color:var(--tl-sky)!important}',
    H + ' .tl-hl-2,' + H + ' .tl-hl-2 p{color:var(--tl-gold)!important}',
    H + ' .tl-hl-3,' + H + ' .tl-hl-3 p,' + H + ' .tl-hl-4,' + H + ' .tl-hl-4 p{color:var(--tl-cream)!important}',
    H + ' .story-template_hero-summary{color:var(--tl-cream);opacity:.9}',
    H + ' .story-template_hero-meta,' + H + ' .story-template_hero-meta-item{color:var(--tl-cream);border-color:rgba(251,251,249,.25)!important}',
    H + ' .hero-meta-accent-name{color:var(--tl-gold)!important}',
    H + ' .story-template_hero-scroll-cue{color:var(--tl-cream)}',
    H + ' .story-template_hero-cover,' + H + ' .story-template_hero-cover-mobile{aspect-ratio:auto!important;height:auto!important;max-width:none;box-shadow:none;rotate:none}',
    H + ' .story-template_hero-cover-img,' + H + ' .is-hero-cover-mobile-photo{object-fit:contain!important;height:auto!important;width:100%}',
    /* v7 hero (5 Oct): text column left, uncropped cover image right; stacked four-line title; labelled credits */
    H + ' .story-template_hero-container{max-width:1440px;padding-left:clamp(20px,5.6vw,80px);padding-right:clamp(20px,5.6vw,80px)}',
    H + ' .story-template_hero-kicker{margin:0 0 18px}',
    H + ' .story-template_hero-title{display:flex!important;flex-direction:column;margin:0 0 28px}',
    H + ' .story-template_hero-title-line{font-size:clamp(60px,6.6vw,108px)!important;line-height:.86!important;white-space:nowrap}',
    H + ' .story-template_hero-meta{display:flex!important;flex-wrap:wrap;gap:14px 32px;margin-top:0;padding-top:16px;border-top:1px solid rgba(251,251,249,.22)!important}',
    H + ' .story-template_hero-meta:after{display:none!important}',
    H + ' .story-template_hero-meta-item{display:flex!important;flex-direction:column;align-items:flex-start;gap:3px;text-transform:none;letter-spacing:0;font-size:15px;font-weight:600;white-space:normal}',
    H + ' .story-template_hero-meta-item:before{display:none!important}',
    H + ' .story-template_hero-meta-item.is-first:before{content:"Read time";display:block!important;width:auto;height:auto;margin:0;background:none!important}',
    H + ' .story-template_hero-meta-item.is-first:before,' + H + ' .hero-meta-prefix{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--tl-sky)}',
    H + ' .story-template_hero-cover,' + H + ' .story-template_hero-cover:hover{transform:none!important;border:0;background:none}',
    H + ' .story-template_hero-scroll-cue{display:none!important}',
    H + ' .hero-meta-accent-name{color:var(--tl-gold)!important;font-size:15px;font-weight:700;letter-spacing:0;text-transform:none}',
    '@media (min-width:992px){' +
      H + ' .story-template_hero-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);grid-template-areas:"content media";column-gap:clamp(28px,5vw,80px);align-items:center}' +
      H + ' .story-template_hero-content{grid-area:content;display:flex;flex-direction:column;min-width:0}' +
      H + ' .story-template_hero-media{grid-area:media;width:100%;max-width:none}' +
    '}',
    '@media (max-width:991px){' + H + ' .story-template_hero-title-line{font-size:min(17vw,96px)!important}}',
    /* 5 Oct: no stray rules under body text; the closing photo meets the band above it with no paper gap */
    'html.tl-look-thaw .story-template_body,html.tl-look-thaw .story-template_body.w-richtext{border-bottom:0!important}',
    'html.tl-look-thaw .tl-closing-band .story-template_module-gap{margin-top:0!important}',
    /* photos uncropped */
    'html.tl-look-thaw .story-template_section img,html.tl-look-thaw .story-template_inline-image{object-fit:contain!important;aspect-ratio:auto!important;height:auto!important;max-height:none}',
    'html.tl-look-thaw .story-template_fullbleed-img{height:auto!important;max-height:none!important;aspect-ratio:auto!important}',
    'html.tl-look-thaw .story-template_fullbleed-img img{position:static!important;object-fit:contain!important;height:auto!important;width:100%;max-height:none!important}',
    'html.tl-look-thaw .tl-closing-band{background:var(--tl-toque);padding-bottom:clamp(28px,4vw,64px)}',
    /* last look: label and caption over the photo */
    'html.tl-look-thaw .story-template_lastlook{position:relative;background:var(--tl-paper);padding-bottom:0;margin-top:0}',
    'html.tl-look-thaw .story-template_lastlook-inner{position:absolute;inset:0;background:transparent!important;max-width:none;margin:0;padding:clamp(16px,3vw,44px) clamp(20px,3.4vw,48px);pointer-events:none}',
    'html.tl-look-thaw .story-template_lastlook-label{font-family:' + D + '!important;text-transform:uppercase;color:#fff!important;font-size:clamp(32px,4.6vw,66px)!important;line-height:1;letter-spacing:.04em;text-shadow:0 2px 24px rgba(16,28,59,.45)}',
    'html.tl-look-thaw .story-template_lastlook-caption{position:absolute;right:clamp(20px,2.2vw,32px);bottom:clamp(16px,2.4vw,34px);margin:0;max-width:min(560px,70%);text-align:right;color:#fff!important;font-family:' + TXT + ';font-size:clamp(17px,1.6vw,24px);line-height:1.3;font-weight:500;letter-spacing:0;text-transform:none;text-shadow:0 1px 14px rgba(16,28,59,.55)}',
    /* scene: Paper band */
    '[data-tl-scene="paper-band"]{' + V + 'background:var(--tl-paper);color:var(--tl-navy)}',
    '[data-tl-scene="paper-band"] .story-template_section{background:var(--tl-paper);padding-top:clamp(72px,9vw,140px);padding-bottom:clamp(72px,9vw,140px)}',
    '[data-tl-scene="paper-band"] .story-template_rail-num{color:var(--tl-cold)!important;font-family:' + TXT + ';font-size:13px;font-weight:700;letter-spacing:.16em}',
    '[data-tl-scene="paper-band"] .story-template_eyebrow,[data-tl-scene="paper-band"] .story-template_rail-label{color:var(--tl-navy)!important;font-family:' + TXT + ';font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}',
    '[data-tl-scene="paper-band"] .tl-feature-title-xl,[data-tl-scene="paper-band"] .story-template_main h3:has(.is-accent-phrase){font-family:' + SERIF + '!important;font-style:italic;font-weight:400;color:var(--tl-cold);font-size:clamp(48px,5.4vw,96px)!important;line-height:.94;letter-spacing:-.02em;text-transform:none}',
    '[data-tl-scene="paper-band"] .is-heading-phrase,[data-tl-scene="paper-band"] .is-accent-phrase{display:block;color:var(--tl-cold)!important;font-family:inherit!important;font-style:italic}',
    '[data-tl-scene="paper-band"] .is-accent-phrase{padding-left:.8em}',
    '[data-tl-scene="paper-band"] .story-template_feature-title:not(:has(.is-accent-phrase)){font-family:' + D + '!important;font-weight:400;text-transform:uppercase;color:var(--tl-navy);font-size:clamp(56px,6.4vw,104px)!important;line-height:.88}',
    '[data-tl-scene="paper-band"] .tl-slam{display:inline-block;transform-origin:0 75%}',
    '[data-tl-scene="paper-band"] .tl-last-word{display:block;color:var(--tl-warm);font-family:' + SERIF + ';font-style:italic;text-transform:none;font-size:1.06em;line-height:.9}',
    '[data-tl-scene="paper-band"] .story-template_body,[data-tl-scene="paper-band"] .story-template_body p{font-family:' + TXT + ';font-size:clamp(17px,1.32vw,19px);line-height:1.62;color:var(--tl-navy)}',
    '[data-tl-scene="paper-band"] .story-template_inline-image{max-height:min(90vh,880px)!important;width:auto!important;max-width:100%}',
    '[data-tl-scene="paper-band"] .story-template_rail{display:none!important}',
    '[data-tl-scene="paper-band"] .story-template_grid{display:block}',
    '[data-tl-scene="paper-band"] .story-template_main{max-width:none!important;width:100%!important}',
    '[data-tl-scene="paper-band"] .tl-kicker-line{display:flex;gap:12px;align-items:baseline;margin:0 0 clamp(18px,2vw,28px);font-family:' + TXT + ';font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--tl-navy)}',
    '[data-tl-scene="paper-band"] .tl-kicker-line b{color:var(--tl-cold)}',
    '[data-tl-scene="paper-band"] .is-story-imageleft-split,[data-tl-scene="paper-band"] .is-story-imageright-split{display:flex;flex-wrap:wrap;gap:clamp(32px,5vw,96px);align-items:center}',
    '@media (max-width:767px){[data-tl-scene="paper-band"] .is-story-imageleft-split>div:first-child{order:2}}',
    '[data-tl-scene="paper-band"] .is-story-imageleft-split>div:last-child,[data-tl-scene="paper-band"] .is-story-imageright-split>div:first-child{flex:1 1 320px;min-width:0;max-width:600px}',
    /* scene: Pull line */
    '[data-tl-scene="pull-line"]{' + V + 'background:var(--tl-ice);color:var(--tl-navy)}',
    '[data-tl-scene="pull-line"] .story-template_section{background:var(--tl-ice);padding-top:clamp(72px,9vw,140px);padding-bottom:clamp(56px,6vw,96px)}',
    '[data-tl-scene="pull-line"] .story-template_body{display:flex;flex-wrap:wrap;gap:clamp(28px,5vw,96px);align-items:flex-end;max-width:none}',
    '[data-tl-scene="pull-line"] .story-template_body p{flex:1 1 320px;max-width:560px;margin:0;font-family:' + TXT + ';font-size:clamp(17px,1.32vw,19px);line-height:1.62;color:var(--tl-navy)}',
    '[data-tl-scene="pull-line"] .story-template_body p:last-child{max-width:none;font-family:' + SERIF + ';font-style:italic;font-weight:400;font-size:clamp(30px,3.6vw,58px);line-height:1.08;letter-spacing:-.01em;color:var(--tl-warm);text-wrap:balance}',
    '[data-tl-scene="pull-line"] .story-template_rail{display:none}',
    '[data-tl-scene="pull-line"] .story-template_grid{display:block}'
  ].join('\n');
  (function () { if (document.getElementById('tl-look-thaw-css')) return; var st = document.createElement('style'); st.id = 'tl-look-thaw-css'; st.textContent = css; (document.head || document.documentElement).appendChild(st); })();
  if (THAW) {
    document.documentElement.classList.add('tl-look-thaw');
    [].slice.call(document.querySelectorAll('.story-template_hero .story-template_hero-title-line')).forEach(function (l, i) { l.classList.add('tl-hl-' + (i + 1)); });
    var markBand = function () {
      var items = [].slice.call(document.querySelectorAll('.w-dyn-item')).filter(function (i) { return i.querySelector('.story-template_section,.story-template_fullbleed'); });
      var last = items[items.length - 1];
      if (last && last.querySelector('.story-template_fullbleed') && !last.querySelector('.story-template_body')) last.classList.add('tl-closing-band');
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markBand); else markBand();
  }
  var M = window.TLMotion; if (!M) return;
  M.register('Paper band', function (item) {
    // kicker line above the heading (number + kicker text taken from the rail, by class)
    var num = item.querySelector('.story-template_rail-num'), kick = item.querySelector('.story-template_eyebrow') || item.querySelector('.story-template_rail-label');
    var headEl = item.querySelector('.story-template_main h2,.story-template_main h3');
    if (headEl && ((num && num.textContent.trim()) || (kick && kick.textContent.trim())) && !item.querySelector('.tl-kicker-line')) {
      var line = document.createElement('p'); line.className = 'tl-kicker-line';
      if (num && num.textContent.trim()) { var b = document.createElement('b'); b.textContent = num.textContent.trim(); line.appendChild(b); }
      if (kick && kick.textContent.trim()) { var sp = document.createElement('span'); sp.textContent = kick.textContent.trim(); line.appendChild(sp); }
      headEl.parentNode.insertBefore(line, headEl);
    }
    // stacked display heading (no split heading): last word becomes the serif-italic accent line (position, not words)
    var h = item.querySelector('.story-template_feature-title'); if (!h || h.querySelector('.is-accent-phrase') || h.__tlLast) return;
    var t = (h.textContent || '').trim(); var i = t.lastIndexOf(' '); if (i < 1) return;
    h.__tlLast = true; h.setAttribute('aria-label', t);
    h.textContent = '';
    var mk = function (txt, into) { var w = document.createElement('span'); w.className = 'tl-slam'; w.setAttribute('aria-hidden', 'true'); w.textContent = txt; into.appendChild(w); return w; };
    var words = t.slice(0, i).split(/\s+/).map(function (wd) { var w = mk(wd, h); h.appendChild(document.createTextNode(' ')); return w; });
    var s = document.createElement('span'); s.className = 'tl-last-word'; h.appendChild(s); words.push(mk(t.slice(i + 1), s));
    // Slam (v6.2 "the guy doesn't sit still."): words punch in large one after another; the longest word hits hardest, in the accent colour.
    if (M.rm) return;
    var longest = words.reduce(function (a, w) { return w.textContent.length > a.textContent.length ? w : a; }, words[0]);
    var slam = function () { var vw = document.documentElement.clientWidth;
      /* 6 Oct (Désirée): only the hardest-hitting word slams; the rest of the heading stays still. */
      [longest].forEach(function (sp, k) { sp.getAnimations().forEach(function (a) { a.cancel(); });
        var big = true, want = 3.2, r = sp.getBoundingClientRect();
        var sc = Math.max(1.05, Math.min(want, (vw - 8 - r.left) / Math.max(1, r.width)));
        sp.animate([{ transform: 'translate3d(0,-.12em,0) scale(' + sc + ')' + (big ? ' rotate(-3deg)' : ''), color: big ? '#A65018' : 'inherit' }, { transform: 'scale(.9)', offset: .4 }, { transform: 'scale(1.05)', offset: .6 }, { transform: 'scale(.985)', offset: .8 }, { transform: 'none' }],
          { duration: big ? 820 : 600, delay: k * 190, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'backwards' }); }); };
    M.zone(h, slam, 0.8, 0.1); h.addEventListener('mouseenter', slam);
  });
  M.register('Pull line', function () { /* look only (CSS) */ });
})();

/*! The Local Motion Library — "Title overlay" and "Photo series" scenes (v0.1, CD v7 IMP-2 + Sort 65 layout).
   Title overlay (Image Above): chapter number + kicker above a large uncropped photo; the split heading sits on the photo
   at the top over a navy fade; the image caption sits on the photo at the bottom in serif italic over a navy fade; body
   follows. A kicker in Ethiopic script gets lang="am" and an Ethiopic system-font stack (no font is loaded).
   Photo series (Showcase): the first photo full width, the rest in one row at equal height (natural ratios, uncropped),
   captions under each. A heading that only repeats the opening words of the body is kept for screen readers only.
   Reduced motion → settled state. Nothing is matched on names, slugs, IDs or article text. */
(function () {
  'use strict';
  var M = window.TLMotion; if (!M) return;
  var D = "bebas-neue-pro,'Bebas Neue',Impact,sans-serif", SERIF = "Fraunces,'Quiche Flare',quiche-flare,Georgia,serif";
  var ETH = "'Noto Sans Ethiopic','Kefa','Nyala','Abyssinica SIL',sans-serif";
  var T = '[data-tl-scene="title-overlay"]', P = '[data-tl-scene="photo-series"]';
  var SR = 'position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
  var css = [
    T + ' .story-template_section{display:block;max-width:1440px;margin:0 auto;padding:clamp(56px,8vw,128px) 0 0;background:var(--tl-paper,#FAFAF8)}',
    T + ' .tl-ov-kicker{display:flex;flex-wrap:wrap;gap:12px;align-items:baseline;max-width:1040px;margin:0 auto 16px;padding:0 clamp(20px,3vw,40px);color:var(--tl-navy,#101C3B)}',
    T + ' .tl-ov-kicker .story-template_rail-num{font-size:13px;font-weight:700;letter-spacing:.16em;color:var(--tl-warm,#A65018);margin:0}',
    T + ' .tl-ov-kicker .story-template_eyebrow{margin:0;font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--tl-navy,#101C3B)!important}',
    T + ' .tl-ov-kicker .story-template_eyebrow[lang="am"]{font-family:' + ETH + ';text-transform:none;letter-spacing:.02em;font-size:18px;line-height:1.35}',
    T + ' .tl-ov-fig{position:relative;max-width:1040px;margin:0 auto;overflow:hidden}',
    T + ' .tl-ov-fig img{display:block;width:100%;height:auto!important;max-height:none!important;aspect-ratio:auto!important;object-fit:contain!important;margin:0}',
    T + ' .tl-ov-fade{position:absolute;z-index:1;left:0;right:0;pointer-events:none}',
    T + ' .tl-ov-fade.is-top{top:0;height:48%;background:linear-gradient(0deg,rgba(16,28,59,0) 0%,rgba(16,28,59,.72) 100%)}',
    T + ' .tl-ov-fade.is-bottom{bottom:0;height:30%;background:linear-gradient(180deg,rgba(16,28,59,0) 0%,rgba(16,28,59,.8) 100%)}',
    T + ' .tl-ov-fig .story-template_feature-title{position:absolute;z-index:2;left:clamp(16px,4vw,56px);right:clamp(16px,4vw,56px);top:clamp(14px,3.6vw,52px);margin:0;font-family:' + D + '!important;font-weight:400;text-transform:uppercase;line-height:.84;color:var(--tl-cream,#FBFBF9);font-size:clamp(76px,21vw,230px)}',
    T + ' .tl-ov-fig .story-template_feature-title>span{display:block;font-family:inherit!important;font-style:normal;font-weight:400;line-height:.84;margin:0}',
    T + ' .tl-ov-fig .is-heading-phrase{font-size:.62em;color:var(--tl-cream,#FBFBF9)}',
    T + ' .tl-ov-fig .is-accent-phrase{font-size:1em;color:var(--tl-gold,#EAB883)}',
    T + ' .tl-ov-fig .story-template_inline-caption{position:absolute;z-index:2;left:clamp(16px,4vw,56px);right:clamp(16px,4vw,56px);bottom:clamp(16px,3.6vw,52px);margin:0;font-family:' + SERIF + ';font-style:italic;font-weight:400;color:var(--tl-gold,#EAB883);font-size:clamp(28px,4.4vw,64px);line-height:1.05;letter-spacing:-.015em;text-wrap:balance;text-transform:none}',
    T + ' .story-template_body{border:0!important;max-width:1040px;margin:0 auto;padding:clamp(28px,3.6vw,56px) clamp(20px,3vw,40px) 1.1em;font-size:clamp(17px,1.32vw,19px);line-height:1.62}',
    T + ' .story-template_body>*{max-width:620px}',
    T + ' .tl-ov-fig img{transition:transform 1.4s cubic-bezier(.2,.7,.2,1),opacity 1s ease}',
    T + ' .tl-ov-fig .story-template_feature-title>span,' + T + ' .tl-ov-fig .story-template_inline-caption{transition:transform .9s cubic-bezier(.2,.7,.2,1),opacity .9s ease}',
    T + ' .tl-ov-fig.is-pre img{transform:scale(1.06);opacity:.4}',
    T + ' .tl-ov-fig.is-pre .story-template_feature-title>span,' + T + ' .tl-ov-fig.is-pre .story-template_inline-caption{transform:translateY(.25em);opacity:0}',
    T + ' .tl-ov-fig .is-accent-phrase{transition-delay:.15s}' + T + ' .tl-ov-fig .story-template_inline-caption{transition-delay:.35s}',
    /* Photo series */
    P + ' .story-template_gallery{background:var(--tl-paper,#FAFAF8);padding:0 0 clamp(64px,9vw,140px)}',
    P + ' .story-template_container{max-width:1040px;margin:0 auto;padding:0 clamp(20px,3vw,40px)}',
    P + ' .story-template_feature-split{display:block!important;margin:0 0 clamp(28px,4vw,56px)!important;padding:0}',
    P + ' .story-template_feature-split,' + P + ' .story-template_feature-split *{border:0!important}',
    P + ' .story-template_feature-split .story-template_body{max-width:620px;font-size:clamp(17px,1.32vw,19px);line-height:1.62}',
    P + ' .tl-sr-only{' + SR + '}',
    /* 6 Oct (Désirée): each paragraph reads as its own paragraph; italic words in this text are set in brown. */
    P + ' .story-template_feature-split .story-template_body p{margin:0 0 1.1em}',
    P + ' .story-template_feature-split .story-template_body p:last-child{margin-bottom:0}',
    P + ' .story-template_feature-split .story-template_body em{font-style:italic;color:#7A3A12}',
    P + ' .story-template_gallery-grid{display:flex!important;flex-wrap:wrap;gap:clamp(20px,2.4vw,36px);align-items:flex-end;max-width:1440px;margin:0 auto;padding:0 clamp(20px,5.6vw,80px)}',
    P + ' .story-template_gallery-card{flex:1 1 300px;min-width:0;margin:0;background:none;box-shadow:none;transform:none}',
    P + ' .story-template_gallery-card.is-lead{flex:1 1 100%!important}',
    P + ' .story-template_gallery-img{aspect-ratio:auto!important;height:auto!important;padding:0!important;background:none;overflow:visible}',
    P + ' .story-template_gallery-img img{position:static!important;display:block;width:100%!important;height:auto!important;aspect-ratio:auto!important;object-fit:contain!important;transform:none}',
    P + ' .story-template_gallery-card-body{padding:10px 0 0;background:none}',
    P + ' .story-template_gallery-caption{margin:0;font-size:15px;font-weight:500;line-height:1.4;color:var(--tl-navy,#101C3B);text-transform:none;letter-spacing:0}',
    '@media (max-width:600px){' + P + ' .story-template_gallery-card{flex:1 1 100%!important}}'
  ].join('\n');
  if (!document.getElementById('tl-m-home-css')) { var st = document.createElement('style'); st.id = 'tl-m-home-css'; st.textContent = css; document.head.appendChild(st); }

  M.register('Title overlay', function (item, rm) {
    var sec = item.querySelector('.story-template_section') || item;
    var img = sec.querySelector('img'), head = sec.querySelector('.story-template_feature-title');
    if (!img || !head) return; /* nothing to overlay: leave the block as the template renders it */
    var cap = sec.querySelector('.story-template_inline-caption'), num = sec.querySelector('.story-template_rail-num'), eye = sec.querySelector('.story-template_eyebrow');
    var row = document.createElement('div'); row.className = 'tl-ov-kicker';
    if (num && num.textContent.trim()) row.appendChild(num);
    if (eye && eye.textContent.trim()) { if (/[ሀ-᎟ⶀ-⷟]/.test(eye.textContent)) eye.setAttribute('lang', 'am'); row.appendChild(eye); }
    var fig = document.createElement('figure'); fig.className = 'tl-ov-fig';
    var top = document.createElement('div'); top.className = 'tl-ov-fade is-top'; top.setAttribute('aria-hidden', 'true');
    var bot = document.createElement('div'); bot.className = 'tl-ov-fade is-bottom'; bot.setAttribute('aria-hidden', 'true');
    sec.insertBefore(fig, sec.firstChild); if (row.childNodes.length) sec.insertBefore(row, fig);
    fig.appendChild(top); fig.appendChild(head); fig.appendChild(img);
    if (cap && cap.textContent.trim()) { fig.appendChild(bot); fig.appendChild(cap); }
    if (rm) return;
    fig.classList.add('is-pre');
    M.zone(fig, function () { fig.classList.remove('is-pre'); }, 0.8, 0.05);
  });

  M.register('Photo series', function (item) {
    var h = item.querySelector('.story-template_feature-title'), b = item.querySelector('.story-template_body');
    if (h && b) { var norm = function (t) { return t.toLowerCase().replace(/[^a-z0-9À-ɏ]+/g, ' ').trim(); };
      if (norm(h.textContent) && norm(b.textContent).indexOf(norm(h.textContent)) === 0) h.classList.add('tl-sr-only'); }
    var cards = [].slice.call(item.querySelectorAll('.story-template_gallery-card'));
    if (cards.length > 2) cards[0].classList.add('is-lead');
    cards.forEach(function (c, i) {
      var im = c.querySelector('img'); if (!im) return; im.loading = 'eager';
      var fit = function () { if (im.naturalWidth && !(i === 0 && cards.length > 2)) c.style.flex = (im.naturalWidth / im.naturalHeight).toFixed(3) + ' 1 0'; if (window.ScrollTrigger) M.safe(function () { ScrollTrigger.refresh(); }); };
      if (im.complete) fit(); else im.addEventListener('load', fit);
    });
  });
})();

