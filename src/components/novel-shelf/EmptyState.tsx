'use client';

import { motion } from 'framer-motion';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <motion.div
        animate={{
          y: [0, -8, 0],
          rotate: [0, -3, 3, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
          {icon || <BookOpen className="w-12 h-12 text-primary" />}
        </div>
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-foreground mb-2"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-sm mb-6 max-w-xs"
      >
        {description}
      </motion.p>
      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={onAction} className="gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
