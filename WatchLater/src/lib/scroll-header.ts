export function mountScrollHeader(el: HTMLElement) {
  const onScroll = () => {
    const atTop = window.scrollY < 8;
    el.classList.toggle('header--at-top', atTop);
    el.classList.toggle('header--scrolled', !atTop);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}
