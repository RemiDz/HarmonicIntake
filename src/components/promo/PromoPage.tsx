'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PromoCards from './PromoCards';
import PromoHooks from './PromoHooks';
import PromoCaptions from './PromoCaptions';
import PromoCalendar from './PromoCalendar';
import PromoHashtags from './PromoHashtags';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

function Divider() {
  return <div className="border-t border-border my-12" />;
}

export default function PromoPage() {
  const [selectedHook, setSelectedHook] = useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-bg-deep py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="font-display text-4xl font-semibold text-text-primary mb-1">
            Content Studio
          </h1>
          <p className="font-mono text-sm text-text-muted">{today}</p>
          <p className="text-text-secondary mt-2 text-sm">
            Generate social media content for Harmonic Intake. Select a hook to auto-fill captions and image cards.
          </p>
        </motion.div>

        {/* Section 1: Image Cards */}
        <motion.section
          custom={0}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <PromoCards selectedHook={selectedHook} />
        </motion.section>

        <Divider />

        {/* Section 2: Opening Hooks */}
        <motion.section
          custom={1}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <PromoHooks
            selectedHook={selectedHook}
            onSelectHook={setSelectedHook}
          />
        </motion.section>

        <Divider />

        {/* Section 3: Platform Captions */}
        <motion.section
          custom={2}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <PromoCaptions selectedHook={selectedHook} />
        </motion.section>

        <Divider />

        {/* Section 4: Content Calendar */}
        <motion.section
          custom={3}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <PromoCalendar />
        </motion.section>

        <Divider />

        {/* Section 5: Hashtag Sets */}
        <motion.section
          custom={4}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <PromoHashtags />
        </motion.section>

        {/* Footer */}
        <div className="text-center mt-16 mb-8">
          <p className="font-mono text-xs text-text-dim tracking-widest uppercase">
            Harmonic Intake — Content Studio
          </p>
        </div>
      </div>
    </div>
  );
}
