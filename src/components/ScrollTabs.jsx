import { useEffect, useRef, useState } from 'react';

// El scroll pertenece a la barra. El scrollbar permanece nativo y el foco de
// teclado también permite recorrerla sin desplazar horizontalmente la página.
function ScrollTabs({ activeKey, children, className = '', ...props }) {
  const ref = useRef(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const nav = ref.current;
    function measure() { setOverflows(nav.scrollWidth > nav.clientWidth + 1); }
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(nav);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    const active = ref.current?.querySelector('[aria-current="page"], [aria-pressed="true"]');
    active?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [activeKey]);

  return (
    <div className="min-w-0 max-w-full">
      <nav ref={ref} tabIndex={0} className={`max-w-full overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-primary ${className}`} {...props}>
        {children}
      </nav>
      {overflows && <span aria-hidden="true" className="-mt-4 mb-2 block text-right text-sm text-muted">↔</span>}
    </div>
  );
}

export default ScrollTabs;
