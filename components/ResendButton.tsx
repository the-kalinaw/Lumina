import React, { useEffect } from 'react';
import { resendConfirmation } from '../services/storageService';

interface Props {
  email: string;
  cooldown: number;
  onResendStart: () => void;
  setInfo: (s: string) => void;
  setError: (s: string) => void;
  setShowResend: (v: boolean) => void;
}

const ResendButton: React.FC<Props> = ({ email, cooldown, onResendStart, setInfo, setError, setShowResend }) => {
  useEffect(() => {
    // no-op
  }, []);

  const handleResend = async () => {
    setError('');
    setInfo('');
    const result = await resendConfirmation(email);
    if (result.success) {
      setInfo(`A confirmation email has been sent to ${email}.`);
      onResendStart();
    } else {
      setError(result.message || 'Failed to resend confirmation');
      // if there's an error that indicates account already confirmed, hide the resend
      if (result.message && result.message.toLowerCase().includes('already')) {
        setShowResend(false);
      }
    }
  };

  return (
    <div>
      <button
        onClick={handleResend}
        disabled={cooldown > 0}
        className="text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend confirmation'}
      </button>
    </div>
  );
};

export default ResendButton;