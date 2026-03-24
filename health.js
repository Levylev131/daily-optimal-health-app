(function () {
  const superfoods = [
    '🥦','🫐','🥑','🍇','🥬','🍋','🥕','🍓','🌿','🥝',
    '🍅','🧄','🐟','🥚','🫚','🍒','🍊','🫛','🍏','🫑'
  ];

  const style = document.createElement('style');
  style.textContent = `
    .sf-icon {
      position: fixed;
      pointer-events: none;
      user-select: none;
      z-index: 0;
      animation: sfFloat linear forwards;
    }
    @keyframes sfFloat {
      0%   { transform: translateY(0px) rotate(0deg);    opacity: 0;   }
      8%   { opacity: 1; }
      92%  { opacity: 1; }
      100% { transform: translateY(-115vh) rotate(540deg); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  function spawn() {
    const el = document.createElement('span');
    el.className = 'sf-icon';
    el.textContent = superfoods[Math.floor(Math.random() * superfoods.length)];

    const size  = Math.random() * 25 + 18;      // 18–43px
    const left  = Math.random() * 97;            // 0–97vw
    const dur   = Math.random() * 20 + 25;       // 25–45s
    const alpha = Math.random() * 0.18 + 0.06;   // subtle: 0.06–0.24
    const blur  = Math.random() < 0.35 ? '1px' : '0px';

    el.style.cssText = `
      font-size: ${size}px;
      left: ${left}vw;
      top: ${Math.random() * 30 + 40}vh;
      opacity: ${alpha};
      animation-duration: ${dur}s;
      filter: blur(${blur});
    `;

    document.body.appendChild(el);
    el.addEventListener('animationend', () => { el.remove(); spawn(); });
  }

  // Stagger the initial wave so they don't all appear at once
  for (let i = 0; i < 18; i++) {
    setTimeout(spawn, Math.random() * 14000);
  }
})();
