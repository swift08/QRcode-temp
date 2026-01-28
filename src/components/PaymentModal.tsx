'use client';

import { useState, useEffect } from 'react';
import { Loader2, X, Shield, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, userId, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFree, setIsFree] = useState<boolean | null>(null);
  const [activationNumber, setActivationNumber] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      setError(null);
      setIsFree(null);
      setActivationNumber(null);
      setToken(null);
      setSuccess(false);

      fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Activation failed');
          }
          setIsFree(data.isFree);
          setActivationNumber(data.activationNumber);
          setToken(data.token);
          setSuccess(true);
          setTimeout(() => {
            onSuccess();
          }, 1200);
        })
        .catch((err: any) => {
          console.error('Activation error from modal:', err);
          setError(err.message || 'Failed to activate QR');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Activate Your QR</h2>
          <p className="text-zinc-500 text-sm mt-1">
            One-time payment of ₹10 (~$0.12).{' '}
            <span className="font-semibold text-red-600">
              Free for the first 1000 customers.
            </span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-300 font-medium"
            >
              Close
            </button>
          </div>
        ) : success && isFree !== null ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
              {isFree ? 'You got it free!' : 'Activation successful'}
            </h3>
            <p className="text-zinc-500 text-sm">
              {isFree
                ? 'As one of the first 1000 customers, your QR has been activated at no cost.'
                : 'A one-time mock payment of ₹10 has been recorded and your QR is now active.'}
            </p>
            {activationNumber && (
              <p className="text-xs text-zinc-400">
                Customer ID: <span className="font-mono">{activationNumber}</span>
              </p>
            )}
            {token && (
              <p className="text-xs text-zinc-400">
                QR Token: <span className="font-mono break-all">{token}</span>
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-400">
          <Shield className="w-3 h-3" />
          <span>Mock payment · real activation</span>
        </div>
      </div>
    </div>
  );
}
