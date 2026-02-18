'use client';

import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useClipboard } from '@/hooks/useClipboard';
import type { FrequencyProfile } from '@/lib/types';
import { formatClipboardText } from '@/lib/profile/recommendations';

interface CopyProfileProps {
  profile: FrequencyProfile;
}

export function CopyProfile({ profile }: CopyProfileProps) {
  const { copy, copied } = useClipboard();

  return (
    <Button variant="secondary" onClick={() => copy(formatClipboardText(profile))}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? 'Copied!' : 'Copy Text'}
    </Button>
  );
}
