import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Settings, LogOut, Activity, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils';

interface TopNavigationProps {
  className?: string;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbs = React.useMemo(() => {
    const path = location.pathname;
    if (path === '/') return [{ label: 'Operation Selection', href: '/' }];
    if (path === '/configure') return [
      { label: 'Operation Selection', href: '/' },
      { label: 'Configure', href: '/configure' },
    ];
    if (path === '/run') return [
      { label: 'Operation Selection', href: '/' },
      { label: 'Run', href: '/run' },
    ];
    return [];
  }, [location.pathname]);

  return (
    <header
      className={cn(
        'h-10 bg-neutral-800 border-b border-neutral-900 flex items-center px-4 gap-4 shrink-0',
        className,
      )}
    >
      {/* Logo & App Name */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 bg-primary-500 rounded flex items-center justify-center">
          <Camera className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-bold text-white tracking-wider uppercase">
          MV<span className="text-primary-400">IS</span>
        </span>
      </div>

      <div className="w-px h-5 bg-neutral-600" />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.href}>
            {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-500 shrink-0" />}
            <button
              onClick={() => navigate(crumb.href)}
              className={cn(
                'text-xs transition-colors truncate',
                i === breadcrumbs.length - 1
                  ? 'text-neutral-200 font-medium cursor-default'
                  : 'text-neutral-400 hover:text-neutral-200',
              )}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* Status indicator */}
      <div className="flex items-center gap-1">
        <Activity className="w-3 h-3 text-success-500" />
        <span className="text-2xs text-neutral-400 font-mono">SYSTEM READY</span>
      </div>

      <div className="w-px h-5 bg-neutral-600" />

      {/* User & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
            <span className="text-2xs font-bold text-white">
              {user?.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-neutral-300">{user?.displayName}</span>
          <span className="text-2xs text-neutral-500 bg-neutral-700 px-1 py-0.5 rounded uppercase">
            {user?.role}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/')}
          className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 transition-colors"
          title="Home"
        >
          <Settings className="w-3.5 h-3.5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleLogout}
          className="p-1 rounded text-neutral-400 hover:text-danger-400 hover:bg-neutral-700 transition-colors"
          title="Log out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </header>
  );
};
