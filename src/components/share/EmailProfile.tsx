'use client';

import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { FrequencyProfile } from '@/lib/types';
import { formatEmailSubject, formatEmailBody } from '@/lib/profile/recommendations';

interface EmailProfileProps {
  profile: FrequencyProfile;
}

export function EmailProfile({ profile }: EmailProfileProps) {
  const handleClick = () => {
    const subject = encodeURIComponent(formatEmailSubject(profile));
    const body = encodeURIComponent(formatEmailBody(profile));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  return (
    <Button variant="secondary" onClick={handleClick}>
      <Mail size={16} />
      Email Profile
    </Button>
  );
}
