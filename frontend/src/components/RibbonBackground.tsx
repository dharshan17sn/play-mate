import React, { useEffect } from 'react';

const gradients: string[] = [
  'linear-gradient(90deg,#ff6a88,#5ee7df)',
  'linear-gradient(90deg,#7a6cff,#3ad59f)',
  'linear-gradient(90deg,#ffd86b,#ff6a88)',
  'linear-gradient(90deg,#4facfe,#00f2fe)',
  'linear-gradient(90deg,#f093fb,#f5576c)',
  'linear-gradient(90deg,#43e97b,#38f9d7)',
  'linear-gradient(90deg,#fa709a,#fee140)'
];

function overlaps(rect: { left: number; top: number; right: number; bottom: number }, others: Array<{ left: number; top: number; right: number; bottom: number }>) {
  return others.some(o => !(rect.right < o.left || rect.left > o.right || rect.bottom < o.top || rect.top > o.bottom));
}

function randomBlob(ribbon: HTMLDivElement, placedRects: Array<{ left: number; top: number; right: number; bottom: number }>) {
  const grad = gradients[Math.floor(Math.random() * gradients.length)];
  const w = 15 + Math.random() * 25; // vw
  const h = 15 + Math.random() * 25; // vh

  const shapes = [
    '50%',
    '60% 40% 30% 70% / 60% 30% 70% 40%',
    '70% 30% 50% 50% / 50% 60% 40% 50%',
    '40% 60% 70% 30% / 50% 40% 60% 50%'
  ];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];

  let rect: { left: number; top: number; right: number; bottom: number } | undefined;
  let attempts = 0;
  do {
    const x = Math.random() * (100 - w);
    const y = Math.random() * (100 - h);
    rect = { left: x, top: y, right: x + w, bottom: y + h };
    attempts++;
    if (attempts > 30) break;
  } while (rect && overlaps(rect, placedRects));

  ribbon.style.background = grad;
  ribbon.style.width = w + 'vw';
  ribbon.style.height = h + 'vh';
  ribbon.style.left = (rect?.left ?? 0) + 'vw';
  ribbon.style.top = (rect?.top ?? 0) + 'vh';
  ribbon.style.borderRadius = shape;

  if (rect) placedRects.push(rect);
}

export const RibbonBackground: React.FC = () => {
  useEffect(() => {
    const ribbons = Array.from(document.querySelectorAll<HTMLDivElement>('.bg-ribbons .ribbon'));
    function positionRibbons() {
      const placedRects: Array<{ left: number; top: number; right: number; bottom: number }> = [];
      ribbons.forEach(r => randomBlob(r, placedRects));
    }

    // initial setup
    positionRibbons();
    const id = window.setInterval(positionRibbons, 6000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="bg-ribbons" aria-hidden>
      <div className="ribbon" />
      <div className="ribbon" />
      <div className="ribbon" />
      <div className="ribbon" />
      <div className="ribbon" />
      <div className="ribbon" />
      <div className="ribbon" />
      <div className="ribbon" />
    </div>
  );
};

export default RibbonBackground;


