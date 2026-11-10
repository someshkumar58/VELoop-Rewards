import React, { useState } from 'react';
import { AlertCircle, Info, ShieldCheck } from 'lucide-react';
import Modal from '../common/Modal';
import InputField from '../common/InputField';
import SelectField from '../common/SelectField';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const WithdrawalRequestModal = ({
  isOpen = false,
  onClose,
  maxAmount = 85.00,
  onSubmitWithdrawal,
}) => {
  const { addToast } = useToast();
  const { isDevPreview } = useAuth();
  const [amount, setAmount] = useState('25.00');
  const [method, setMethod] = useState('USDC_POLYGON');
  const [destination, setDestination] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const methodOptions = [
    { value: 'USDC_POLYGON', label: 'USDC (Polygon Network - Zero Gas)' },
    { value: 'USDT_TRON', label: 'USDT (Tron TRC-20)' },
    { value: 'PAYPAL', label: 'PayPal (Direct Account Email)' },
    { value: 'BANK_ACH', label: 'Bank Wire / Domestic ACH' }
  ];

  const validate = () => {
    const newErrors = {};
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0.01) {
      newErrors.amount = 'Minimum withdrawal amount is 0.01 Tokens';
    } else if (numAmount > maxAmount) {
      newErrors.amount = `Insufficient balance. Amount exceeds your maximum convertible balance (${maxAmount.toFixed(2)} Tokens)`;
    }

    if (!destination.trim()) {
      newErrors.destination = 'Recipient payout address or account email is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (onSubmitWithdrawal) {
        await onSubmitWithdrawal({
          amount: parseFloat(amount),
          asset: 'tokens',
          method,
          payoutMethod: method,
          destination,
          isSimulated: isDevPreview,
        });
      }
      onClose();
    } catch (err) {
      addToast(err.message || 'Failed to submit withdrawal.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const numAmount = parseFloat(amount) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Payout / Withdrawal"
      subtitle="Withdraw platform earnings directly to your external wallet or account"
      maxWidth="520px"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleWithdraw} loading={loading}>
            {isDevPreview ? 'Submit Simulated Request' : 'Submit Payout Request'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleWithdraw}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(110, 168, 254, 0.12)',
          border: '1px solid rgba(110, 168, 254, 0.35)',
          color: 'var(--accent-blue)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          marginBottom: '16px'
        }}>
          <ShieldCheck size={16} style={{ flexShrink: 0 }} />
          <span>Infrastructure Mode: Payout requests record administrative token reservations for manual audit. Real-money fiat and cryptocurrency transfers remain disabled in this phase.</span>
        </div>

        {isDevPreview && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(244, 199, 106, 0.12)',
            border: '1px solid rgba(244, 199, 106, 0.35)',
            color: 'var(--accent-gold)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            marginBottom: '16px'
          }}>
            <Info size={16} style={{ flexShrink: 0 }} />
            <span>Development Preview: This is a simulated transaction. Real funds are not moved until connected to a live production backend.</span>
          </div>
        )}

        <SelectField
          label="Payout Method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          options={methodOptions}
          required
        />

        <InputField
          label="Payout Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={method.includes('PAYPAL') ? 'account@example.com' : '0x... or Wallet Address'}
          error={errors.destination}
          helperText="Verify your address carefully. Payouts to incorrect addresses cannot be reversed."
          required
        />

        <InputField
          label="Withdrawal Amount (Tokens)"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          helperText={`Convertible Balance: ${maxAmount.toFixed(2)} Tokens (Min: 0.01 Tokens)`}
          required
        />

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginTop: '10px',
          fontSize: '0.84rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--accent-gold)' }}>
            <span>Reserved Balance:</span>
            <span>{numAmount.toFixed(2)} Tokens</span>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default WithdrawalRequestModal;
