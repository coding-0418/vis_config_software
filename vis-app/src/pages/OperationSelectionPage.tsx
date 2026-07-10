import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings2, Play, ChevronRight, Cpu, Activity } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useConfigurationStore } from '@/stores/configurationStore';
import { TopNavigation } from '@/components/shared/TopNavigation';
import { cn } from '@/utils';

interface OperationCard {
  id: 'configure' | 'run';
  title: string;
  description: string;
  details: string[];
  icon: React.ElementType;
  href: string;
  color: string;
  accent: string;
  disabled?: boolean;
  badge?: string;
}

export const OperationSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDeployed, lastDeployedAt } = useConfigurationStore();

  const cards: OperationCard[] = [
    {
      id: 'configure',
      title: 'Configure',
      description: 'Set up measurement parameters, tolerances, and image correction for your inspection recipe.',
      details: [
        'Select measurement categories',
        'Capture reference image',
        'Define tolerances & ideal values',
        'Apply image corrections',
        'Save & deploy configuration',
      ],
      icon: Settings2,
      href: '/configure',
      color: 'from-primary-500 to-primary-700',
      accent: 'border-primary-200 hover:border-primary-400',
    },
    {
      id: 'run',
      title: 'Run',
      description: 'Execute continuous live inspection using the deployed configuration and export results to CSV.',
      details: [
        'Live camera feed',
        'Continuous PASS/FAIL inspection',
        'Real-time measurement output',
        'Automatic CSV export',
        'Stop & manual save',
      ],
      icon: Play,
      href: '/run',
      color: isDeployed ? 'from-success-500 to-success-700' : 'from-neutral-400 to-neutral-500',
      accent: isDeployed
        ? 'border-success-200 hover:border-success-400'
        : 'border-neutral-200 cursor-not-allowed',
      disabled: !isDeployed,
      badge: isDeployed ? 'Ready' : 'Deploy config first',
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-workspace overflow-hidden">
      <TopNavigation />

      <main className="flex-1 flex flex-col items-center justify-center p-12 overflow-auto">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 text-xs text-neutral-500 bg-white border border-border rounded-full px-3 py-1 mb-4 shadow-xs">
            <Activity className="w-3 h-3 text-success-500" />
            System Online
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Hi, Welcome{' '}
            <span className="text-primary-600">{user?.displayName ?? 'Operator'}</span>
          </h1>
          <p className="text-neutral-500 text-sm max-w-md">
            Select an operation to begin. Configure your inspection recipe first, then run live inspection.
          </p>
          {isDeployed && lastDeployedAt && (
            <p className="text-xs text-success-600 mt-2">
              ✓ Configuration deployed at{' '}
              {new Date(lastDeployedAt).toLocaleTimeString('en-US', { hour12: false })}
            </p>
          )}
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <motion.button
                  whileHover={card.disabled ? {} : { y: -3, scale: 1.01 }}
                  whileTap={card.disabled ? {} : { scale: 0.98 }}
                  onClick={() => !card.disabled && navigate(card.href)}
                  className={cn(
                    'w-full text-left bg-white rounded-2xl border-2 p-7 transition-all duration-200',
                    'shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
                    card.accent,
                    card.disabled && 'opacity-60',
                  )}
                >
                  {/* Icon badge */}
                  <div
                    className={cn(
                      'inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br mb-5 shadow-md',
                      card.color,
                    )}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Badge */}
                  {card.badge && (
                    <div className="mb-3">
                      <span
                        className={cn(
                          'text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                          isDeployed && card.id === 'run'
                            ? 'text-success-700 bg-success-50 border-success-200'
                            : 'text-neutral-500 bg-neutral-100 border-neutral-200',
                        )}
                      >
                        {card.badge}
                      </span>
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-neutral-900 mb-2">{card.title}</h2>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-4">{card.description}</p>

                  <ul className="space-y-1.5 mb-5">
                    {card.details.map((d) => (
                      <li key={d} className="flex items-center gap-2 text-xs text-neutral-600">
                        <span className="w-1 h-1 rounded-full bg-primary-400 shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>

                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs font-semibold transition-colors',
                      card.disabled ? 'text-neutral-400' : 'text-primary-600',
                    )}
                  >
                    {card.disabled ? 'Unavailable' : `Open ${card.title}`}
                    {!card.disabled && <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* System info bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex items-center gap-6 text-xs text-neutral-400"
        >
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>v1.0.0</span>
          </div>
          <div className="w-px h-3 bg-neutral-300" />
          <span>Role: <strong className="text-neutral-600">{user?.role}</strong></span>
          <div className="w-px h-3 bg-neutral-300" />
          <span>Units: <strong className="text-neutral-600">mm</strong></span>
        </motion.div>
      </main>
    </div>
  );
};
