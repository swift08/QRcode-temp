'use client';

import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminQrToggleButtonProps {
  profileId: string;
  isActive: boolean;
}

export function AdminQrToggleButton({ profileId, isActive }: AdminQrToggleButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = async () => {
    try {
      await fetch('/api/admin/qr-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, active: !isActive }),
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Failed to toggle QR status', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
        isActive
          ? 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-red-500'
          : 'bg-red-950/40 border-red-700 text-red-300 hover:border-red-400'
      } flex items-center gap-1.5`}
    >
      {pending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <span>{isActive ? 'Disable QR' : 'Enable QR'}</span>
      )}
    </button>
  );
}

