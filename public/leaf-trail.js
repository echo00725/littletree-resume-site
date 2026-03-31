(() => {
  const BLOCK_SELECTOR = 'a,button,input,textarea,select,[role="button"],.nav';
  const LEAVES = ['🍃', '🍂'];
  let last = 0;

  function spawnLeaf(x, y) {
    const leaf = document.createElement('span');
    leaf.textContent = LEAVES[Math.random() > 0.75 ? 1 : 0];
    leaf.style.position = 'fixed';
    leaf.style.left = `${x}px`;
    leaf.style.top = `${y}px`;
    leaf.style.fontSize = `${14 + Math.random() * 12}px`;
    leaf.style.pointerEvents = 'none';
    leaf.style.userSelect = 'none';
    leaf.style.zIndex = '9999';
    leaf.style.opacity = '0.9';
    leaf.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 180}deg)`;
    document.body.appendChild(leaf);

    const dx = (Math.random() - 0.5) * 90;
    const dy = 40 + Math.random() * 80;
    const rot = (Math.random() - 0.5) * 260;

    leaf.animate([
      { transform: leaf.style.transform, opacity: 0.95 },
      { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 }
    ], {
      duration: 1100 + Math.random() * 700,
      easing: 'cubic-bezier(.2,.7,.2,1)'
    });

    setTimeout(() => leaf.remove(), 2000);
  }

  window.addEventListener('mousemove', (e) => {
    const target = e.target;
    if (target && target.closest && target.closest(BLOCK_SELECTOR)) return;
    const now = Date.now();
    if (now - last < 55) return;
    last = now;
    spawnLeaf(e.clientX, e.clientY);
  }, { passive: true });
})();
