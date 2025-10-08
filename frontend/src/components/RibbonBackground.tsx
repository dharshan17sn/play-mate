import React, { useEffect } from 'react';

const gradients: string[] = [
  'linear-gradient(90deg,#00c6ff,#0072ff)',
  'linear-gradient(90deg,#36d1dc,#5b86e5)',
  'linear-gradient(90deg,#f83600,#f9d423)',
  'linear-gradient(90deg,#ff512f,#dd2476)',
  'linear-gradient(90deg,#00b09b,#96c93d)',
  'linear-gradient(90deg,#fc466b,#3f5efb)',
  'linear-gradient(90deg,#ee0979,#ff6a00)'
];

function overlaps(rect: { left: number; top: number; right: number; bottom: number }, others: Array<{ left: number; top: number; right: number; bottom: number }>) {
  return others.some(o => !(rect.right < o.left || rect.left > o.right || rect.bottom < o.top || rect.top > o.bottom));
}

function randomBlob(ribbon: HTMLDivElement, placedRects: Array<{ left: number; top: number; right: number; bottom: number }>) {
  const grad = gradients[Math.floor(Math.random() * gradients.length)];
  const w = 18 + Math.random() * 28; // slightly larger for more presence
  const h = 18 + Math.random() * 28;

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


