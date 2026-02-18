'use client';

import { useRef, useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProfileCard } from './ProfileCard';
import type { FrequencyProfile } from '@/lib/types';

interface SaveCardProps {
  profile: FrequencyProfile;
}

export function SaveCard({ profile }: SaveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const handleSave = useCallback(async () => {
    if (!cardRef.current || generating) return;

    setGenerating(true);

    try {
      // Dynamic import to keep bundle light
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#050c15',
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (!blob) return;

      // Try Web Share API on mobile first
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'harmonic-intake-profile.png', { type: 'image/png' });
        const shareData = { files: [file], title: 'Frequency Profile' };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setGenerating(false);
          return;
        }
      }

      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'harmonic-intake-profile.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // If share was cancelled or failed, that's fine
    } finally {
      setGenerating(false);
    }
  }, [generating]);

  return (
    <>
      <ProfileCard ref={cardRef} profile={profile} />
      <Button variant="secondary" onClick={handleSave} disabled={generating} className="w-full">
        <Download size={16} />
        {generating ? 'Generating...' : 'Save Card'}
      </Button>
    </>
  );
}
