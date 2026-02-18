'use client';

import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}: ButtonProps) {
  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 disabled:opacity-40 disabled:pointer-events-none text-sm';

  const variants = {
    primary:
      'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/30',
    secondary:
      'bg-bg-surface text-text-secondary border border-border hover:border-border-hover hover:text-text-primary',
    ghost: 'text-text-muted hover:text-text-secondary',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${base} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}
