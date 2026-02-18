'use client';

import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { FrequencyProfile } from '@/lib/types';
import { formatHumanEmailSubject, formatHumanEmailBody } from '@/lib/profile/humanize';

interface EmailProfileProps {
  profile: FrequencyProfile;
}

export function EmailProfile({ profile }: EmailProfileProps) {
  const handleClick = () => {
    const subject = encodeURIComponent(formatHumanEmailSubject(profile));
    const body = encodeURIComponent(formatHumanEmailBody(profile));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  return (
    <Button variant="secondary" onClick={handleClick} className="w-full">
      <Mail size={16} />
      Email Summary
    </Button>
  );
}
