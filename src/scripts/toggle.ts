function init() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('button.action-btn[data-target]');
  const sections = new Map<string, HTMLElement>();

  buttons.forEach((btn) => {
    const target = btn.dataset.target!;
    const sec = document.getElementById(`section-${target}`);
    if (sec) sections.set(target, sec);
  });

  function close(target: string) {
    const sec = sections.get(target);
    if (!sec) return;
    sec.hidden = true;
    const btn = document.querySelector<HTMLButtonElement>(`button.action-btn[data-target="${target}"]`);
    btn?.setAttribute('aria-expanded', 'false');
  }

  function open(target: string) {
    sections.forEach((_, key) => {
      if (key !== target) close(key);
    });
    const sec = sections.get(target);
    if (!sec) return;
    sec.hidden = false;
    const btn = document.querySelector<HTMLButtonElement>(`button.action-btn[data-target="${target}"]`);
    btn?.setAttribute('aria-expanded', 'true');
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target!;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (expanded) close(target);
      else open(target);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
