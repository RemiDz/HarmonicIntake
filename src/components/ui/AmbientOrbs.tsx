'use client';

interface AmbientOrbsProps {
  accentColor?: string;
}

export function AmbientOrbs({ accentColor }: AmbientOrbsProps) {
  const color1 = accentColor || '#4FA8D6';
  const color2 = '#7B6DB5';

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="animate-breathe absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
        style={{ backgroundColor: color1 }}
      />
      <div
        className="animate-breathe absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full opacity-15 blur-[140px]"
        style={{ backgroundColor: color2, animationDelay: '3s' }}
      />
      <div
        className="animate-breathe absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-10 blur-[100px]"
        style={{ backgroundColor: color1, animationDelay: '1.5s' }}
      />
    </div>
  );
}
