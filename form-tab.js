/*--------------------
Form Tab JS
--------------------*/

function initFormTab() {
  const formTabComponent = document.querySelectorAll('[data-form-tab-component]')
  if (!formTabComponent.length) return

  const mq = window.matchMedia('(max-width: 991px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const FADE_MS = 300;

  formTabComponent.forEach((component) => {
    const toggles = component.querySelectorAll('[data-tab-toggle]');
    const panels = Array.from(component.querySelectorAll('[data-tab-panel]'));
    let activeId = null;
    let token = 0; // invalidates in-flight fades when a newer click comes in

    function setToggles(id) {
      toggles.forEach((toggle) => {
        const isActive = toggle.dataset.tabToggle === id;
        toggle.classList.toggle('is-active', isActive);
        toggle.setAttribute('aria-selected', isActive);
      });
    }

    function showPanel(panel) {
      panel.classList.add('is-active');
      panel.style.display = ''; // restore the designer's display value
    }

    function hidePanel(panel) {
      panel.classList.remove('is-active');
      panel.style.display = 'none'; // inline beats any Designer class
    }

    function cancelFades() {
      panels.forEach((p) => p.getAnimations().forEach((a) => a.cancel()));
    }

    function activate(id, animate = true) {
      if (id === activeId) return;
      const next = panels.find((p) => p.dataset.tabPanel === id);
      if (!next) return;
      const prev = panels.find((p) => p.dataset.tabPanel === activeId);
      const myToken = ++token;

      activeId = id;
      setToggles(id);
      cancelFades();

      // Snap everything else shut; only prev fades out
      panels.forEach((p) => {
        if (p !== next && p !== prev) hidePanel(p);
      });

      const swap = () => {
        if (myToken !== token) return;
        if (prev) {
          hidePanel(prev);
          cancelFades(); // drop the fade-out's held opacity:0 so prev can show again later
        }
        showPanel(next);
        if (animate && !reduceMotion.matches) {
          next.animate({ opacity: [0, 1] }, { duration: FADE_MS, easing: 'ease' });
        }
      };

      const canFade = animate && !reduceMotion.matches && prev && prev.style.display !== 'none';
      if (canFade) {
        prev
          .animate({ opacity: [1, 0] }, { duration: FADE_MS, easing: 'ease', fill: 'forwards' })
          .finished.then(swap)
          .catch(() => {}); // cancelled by a newer click
      } else {
        swap();
      }
    }

    function reset() {
      token++;
      activeId = null;
      cancelFades();
      toggles.forEach((t) => {
        t.classList.remove('is-active');
        t.removeAttribute('aria-selected');
      });
      panels.forEach((p) => {
        p.classList.remove('is-active');
        p.style.display = '';
      });
    }

    // Tab 1 active on load (no fade), and again whenever we re-enter <992px
    function sync() {
      mq.matches ? activate('1', false) : reset();
    }

    component.addEventListener('click', (e) => {
      if (!mq.matches) return;
      const toggle = e.target.closest('[data-tab-toggle]');
      if (!toggle || !component.contains(toggle)) return;
      e.preventDefault();
      activate(toggle.dataset.tabToggle);
    });

    mq.addEventListener('change', sync);
    sync();
  });
}
