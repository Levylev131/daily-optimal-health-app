(function () {
  const foods = [
    '🥦','🫐','🥑','🍇','🥬','🍋','🥕','🍓','🌿','🥝',
    '🍅','🧄','🐟','🥚','🫚','🍒','🍊','🫛','🍏','🫑'
  ];

  const SIZE    = 64;   // px
  const COL_GAP = 150;  // px between columns
  const ROW_GAP = 130;  // px between rows

  const W = window.innerWidth;
  const H = window.innerHeight;

  const cols = Math.ceil(W / COL_GAP) + 2;
  const rows = Math.ceil(H / ROW_GAP) + 2;

  // Container — sits behind all page content
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
  `;
  document.body.insertBefore(container, document.body.firstChild);

  let foodIndex = 0;

  for (let r = 0; r < rows; r++) {
    const offsetX = (r % 2 === 0) ? 0 : COL_GAP / 2; // brick pattern offset
    for (let c = 0; c < cols; c++) {
      const el = document.createElement('span');
      el.textContent = foods[foodIndex % foods.length];
      foodIndex++;

      const x      = c * COL_GAP + offsetX - COL_GAP;
      const y      = r * ROW_GAP - ROW_GAP;
      const rot    = (((r * cols + c) % 5) - 2) * 8; // −16°, −8°, 0°, 8°, 16°

      el.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        font-size: ${SIZE}px;
        opacity: 0.36;
        transform: rotate(${rot}deg);
        line-height: 1;
        filter:
          drop-shadow(-4px  0   0 white)
          drop-shadow( 4px  0   0 white)
          drop-shadow( 0   -4px 0 white)
          drop-shadow( 0    4px 0 white)
          drop-shadow(-3px -3px 0 white)
          drop-shadow( 3px -3px 0 white)
          drop-shadow(-3px  3px 0 white)
          drop-shadow( 3px  3px 0 white);
      `;

      container.appendChild(el);
    }
  }
})();

