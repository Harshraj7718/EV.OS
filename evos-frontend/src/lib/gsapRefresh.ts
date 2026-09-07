import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * ScrollTrigger measures trigger positions synchronously when created. On this
 * site those measurements happen before the Google Fonts swap (and other late
 * layout shifts) settle, which can leave trigger start/end points stale enough
 * that a trigger never fires — stranding content at its GSAP "from" state
 * (e.g. permanently opacity: 0). Refresh from a few different signals so a
 * stale measurement gets corrected instead of sticking.
 */
export const scheduleScrollTriggerRefresh = (): void => {
  const refresh = () => ScrollTrigger.refresh();

  document.fonts?.ready?.then(refresh);
  window.addEventListener('load', refresh, { once: true });
  window.setTimeout(refresh, 600);
};
