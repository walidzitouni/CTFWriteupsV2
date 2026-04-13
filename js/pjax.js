// Pjax — swap only the content areas, keep sidebar/girl/cursor alive
(function () {
  const SELECTORS = ['main[aria-label="Main Content"]', '#panel-wrapper', '#tail-wrapper', 'title'];
  const IGNORE = /\.(pdf|zip|png|jpg|jpeg|gif|svg|webp|mp4|mp3|7z|tar|gz)$/i;

  function navigate(url, push) {
    fetch(url)
      .then(function(r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(function(html) {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');

        // swap each target zone
        SELECTORS.forEach(function(sel) {
          if (sel === 'title') {
            document.title = newDoc.title;
            return;
          }
          const cur = document.querySelector(sel);
          const nxt = newDoc.querySelector(sel);
          if (cur && nxt) cur.innerHTML = nxt.innerHTML;
        });

        // update active nav
        document.querySelectorAll('#sidebar .nav-item').forEach(function(li) {
          const a = li.querySelector('a');
          if (!a) return;
          const href = a.getAttribute('href') || '';
          li.classList.toggle('active', url.endsWith(href) || url === location.origin + href);
        });

        if (push) history.pushState({ url: url }, '', url);
        window.scrollTo(0, 0);

        // re-run scripts in new main content
        const main = document.querySelector('main[aria-label="Main Content"]');
        if (main) {
          main.querySelectorAll('script').forEach(function(old) {
            const s = document.createElement('script');
            if (old.src) { s.src = old.src; s.defer = true; }
            else s.textContent = old.textContent;
            old.replaceWith(s);
          });
        }

        if (typeof initToc === 'function') initToc();
      })
      .catch(function() {
        window.location.href = url;
      });
  }

  document.addEventListener('click', function(e) {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (
      !href ||
      a.hostname !== location.hostname ||
      href.startsWith('#') ||
      href.startsWith('javascript') ||
      IGNORE.test(href) ||
      a.target === '_blank' ||
      e.ctrlKey || e.metaKey || e.shiftKey
    ) return;

    e.preventDefault();
    const url = a.href;
    if (url === location.href) return;
    navigate(url, true);
  });

  window.addEventListener('popstate', function() {
    navigate(location.href, false);
  });
})();
