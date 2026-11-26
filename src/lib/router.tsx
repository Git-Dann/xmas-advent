import { useEffect, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

/** A deliberately tiny history router: the app has a handful of routes. */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === location.pathname + location.search + location.hash) return;
  if (opts.replace) history.replaceState(null, '', to);
  else history.pushState(null, '', to);
  listeners.forEach((l) => l());
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, () => location.pathname, () => '/');
}

export function Link({ to, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handle} {...rest} />;
}

/** Moves focus to the main heading after navigation, for screen-reader and keyboard users. */
export function useFocusOnRoute(path: string) {
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('main h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0 });
  }, [path]);
}
