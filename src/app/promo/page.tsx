'use client';

import dynamic from 'next/dynamic';

const PromoPage = dynamic(() => import('@/components/promo/PromoPage'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-deep)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          color: 'var(--color-text-muted)',
        }}
      >
        Loading Content Studio...
      </p>
    </div>
  ),
});

export default function PromoRoute() {
  return <PromoPage />;
}
