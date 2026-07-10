import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Camera, Lock, User, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import type { LoginCredentials } from '@/types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    defaultValues: { username: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginCredentials) => {
    clearError();
    const ok = await login(data);
    if (ok) navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-neutral-50 to-blue-50 flex flex-col items-center justify-center p-6">
      {/* Decorative background grid */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Machine Vision Inspection
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Industrial Quality Control System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
          {/* Card header stripe */}
          <div className="h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600" />

          <div className="p-8">
            <h2 className="text-base font-semibold text-neutral-800 mb-6">Sign in to continue</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Username or email"
                    className="w-full pl-9 pr-4 h-10 text-sm border rounded-lg bg-neutral-50 text-neutral-900
                      border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                      outline-none transition-all placeholder:text-neutral-400"
                    {...register('username', {
                      required: 'Username is required',
                      minLength: { value: 2, message: 'At least 2 characters' },
                    })}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-danger-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Password"
                    className="w-full pl-9 pr-10 h-10 text-sm border rounded-lg bg-neutral-50 text-neutral-900
                      border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                      outline-none transition-all placeholder:text-neutral-400"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 3, message: 'At least 3 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-danger-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-neutral-300 text-primary-500 focus:ring-primary-400"
                  {...register('rememberMe')}
                />
                <label htmlFor="rememberMe" className="text-xs text-neutral-600 cursor-pointer">
                  Remember me on this device
                </label>
              </div>

              {/* Server error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-700"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-xs">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full mt-2"
              >
                {isLoading ? 'Authenticating…' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 text-center">
                Demo: <span className="font-mono text-neutral-600">admin / admin123</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          © {new Date().getFullYear()} Machine Vision Inspection System. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};
