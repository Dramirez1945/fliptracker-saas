import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 192; // scale factor relative to 192 base

  // Rounded-rect background
  const r = size * 0.2;
  ctx.fillStyle = '#B8612A';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Draw a white dresser shape
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = size / 2;
  const cy = size / 2;

  // Dresser body
  const bodyW = 110 * s;
  const bodyH = 80 * s;
  const bodyX = cx - bodyW / 2;
  const bodyY = cy - bodyH / 2 - 8 * s;
  const br = 6 * s;

  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY, bodyW, bodyH, br);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#FFFFFF';
  const legW = 10 * s;
  const legH = 14 * s;
  const legY = bodyY + bodyH;
  const legInset = 16 * s;

  ctx.fillRect(bodyX + legInset, legY, legW, legH);
  ctx.fillRect(bodyX + bodyW - legInset - legW, legY, legW, legH);

  // Drawer divider lines (horizontal)
  ctx.strokeStyle = '#B8612A';
  ctx.lineWidth = 2.5 * s;
  const mid1Y = bodyY + bodyH / 3;
  const mid2Y = bodyY + (bodyH / 3) * 2;

  ctx.beginPath();
  ctx.moveTo(bodyX + br, mid1Y);
  ctx.lineTo(bodyX + bodyW - br, mid1Y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bodyX + br, mid2Y);
  ctx.lineTo(bodyX + bodyW - br, mid2Y);
  ctx.stroke();

  // Vertical center divider
  ctx.beginPath();
  ctx.moveTo(cx, bodyY + br);
  ctx.lineTo(cx, bodyY + bodyH - br);
  ctx.stroke();

  // Drawer pulls (small white circles on sienna bg, so use sienna-pale)
  const pullR = 4 * s;
  const pullOffsetX = bodyW / 4;
  const pullY1 = bodyY + bodyH / 6;
  const pullY2 = bodyY + bodyH / 2;
  const pullY3 = bodyY + (bodyH / 6) * 5;

  const pulls = [
    [cx - pullOffsetX, pullY1], [cx + pullOffsetX, pullY1],
    [cx - pullOffsetX, pullY2], [cx + pullOffsetX, pullY2],
    [cx - pullOffsetX, pullY3], [cx + pullOffsetX, pullY3],
  ];

  ctx.fillStyle = '#B8612A';
  pulls.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px, py, pullR, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas.toBuffer('image/png');
}

writeFileSync('public/icons/icon-192.png', drawIcon(192));
writeFileSync('public/icons/icon-512.png', drawIcon(512));
console.log('Icons generated: public/icons/icon-192.png + icon-512.png');
