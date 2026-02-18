interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-bg-card/60 p-6 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
