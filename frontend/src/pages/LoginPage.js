import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatApiError } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left Panel - Background Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{ 
          backgroundImage: 'url(/logo.png)'
        }}
      >
        <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-sm"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Raffles University
          </h1>
          <p className="text-xl text-blue-100 mb-2 font-medium drop-shadow-sm">Neemrana, India</p>
          <p className="text-lg text-slate-100 max-w-md bg-black/30 p-4 rounded-xl backdrop-blur-md border border-white/20">
            Academic Management System - Streamlining admissions, curriculum, attendance, and more.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img 
              src="/logo.png"
              alt="Raffles University"
              className="h-24 w-auto"
            />
          </div>

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-900 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Sign In
                </CardTitle>
              </div>
              <CardDescription className="text-slate-500">
                Enter your credentials to access the Academic CRM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" data-testid="login-error">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@raffles.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 border-slate-200 focus:border-blue-900 focus:ring-blue-900/20"
                    data-testid="login-email-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 border-slate-200 focus:border-blue-900 focus:ring-blue-900/20 pr-10"
                      data-testid="login-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-medium"
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-center text-sm text-slate-500">
                  Contact IT department for access issues
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
