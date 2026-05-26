const ACTIVE_BG = { popular: 'bg-orange-500', value: 'bg-teal-500' } as const;

function init() {
  document.querySelectorAll<HTMLElement>('.theme-tabs[data-group]').forEach((tabs) => {
    const group = tabs.dataset.group!;
    const panes = document.querySelectorAll<HTMLElement>(`[data-pane-group="${group}"]`);

    tabs.querySelectorAll<HTMLButtonElement>('.theme-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const variant = btn.dataset.tab as 'popular' | 'value';

        tabs.querySelectorAll<HTMLButtonElement>('.theme-tab').forEach((b) => {
          const isActive = b === btn;
          b.setAttribute('aria-selected', String(isActive));
          b.classList.remove('bg-orange-500', 'bg-teal-500', 'bg-slate-800', 'text-white', 'text-slate-300');
          if (isActive) {
            b.classList.add(ACTIVE_BG[b.dataset.tab as 'popular' | 'value'], 'text-white');
          } else {
            b.classList.add('bg-slate-800', 'text-slate-300');
          }
        });

        panes.forEach((pane) => {
          pane.hidden = pane.dataset.pane !== variant;
        });
      });
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
