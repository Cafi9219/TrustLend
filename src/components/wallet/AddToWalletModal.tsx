import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  PlusCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { 
  dbService, 
  MIN_TRANSACTION_AMOUNT, 
  MAX_TRANSACTION_AMOUNT,
  DEMO_LENDER_ID,
  DEMO_BORROWER_ID
} from '../../services/dbService';
import { useAuthMock } from '../../hooks/useAuthMock';

interface AddToWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedAmount?: number;
  onSuccess?: (newBalance: number) => void;
}

export const AddToWalletModal: React.FC<AddToWalletModalProps> = ({
  isOpen,
  onClose,
  suggestedAmount,
  onSuccess,
}) => {
  const { currentUser } = useAuthMock();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [amount, setAmount] = useState<number>(suggestedAmount || 5000);
  const [amountInput, setAmountInput] = useState<string>((suggestedAmount || 5000).toLocaleString('en-IN'));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const isDemoUser = currentUser?.id === DEMO_LENDER_ID || currentUser?.id === DEMO_BORROWER_ID || !!currentUser?.isTestAccount;

  const loadData = () => {
    if (!currentUser) return;
    setWalletBalance(dbService.getWalletBalance(currentUser.id));
  };

  const syncWalletIfDemo = (val: number) => {
    if (isDemoUser && currentUser && val >= MIN_TRANSACTION_AMOUNT && val <= MAX_TRANSACTION_AMOUNT) {
      if (currentUser.id === DEMO_LENDER_ID) {
        dbService.syncDemoWalletBalance(val);
      } else {
        dbService.setWalletBalance(currentUser.id, val, `Demo Wallet Allocation: ₹${val.toLocaleString('en-IN')}`);
      }
      setWalletBalance(val);
      if (onSuccess) {
        onSuccess(val);
      }
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadData();
      if (suggestedAmount && suggestedAmount >= MIN_TRANSACTION_AMOUNT) {
        setAmount(suggestedAmount);
        setAmountInput(suggestedAmount.toLocaleString('en-IN'));
      }
      setErrorMessage(null);
      setSuccessNotice(null);
    }
  }, [isOpen, currentUser, suggestedAmount]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = dbService.subscribe((type) => {
      if (type === 'wallet_updated') {
        loadData();
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleAmountChange = (valStr: string) => {
    const raw = valStr.replace(/\D/g, '');
    if (!raw) {
      setAmountInput('');
      return;
    }
    const val = Number(raw);
    setAmountInput(val.toLocaleString('en-IN'));
    setAmount(val);
    setErrorMessage(null);
    setSuccessNotice(null);
    if (val >= MIN_TRANSACTION_AMOUNT && val <= MAX_TRANSACTION_AMOUNT) {
      syncWalletIfDemo(val);
    }
  };

  const handleAmountBlur = () => {
    let finalVal = Number(amountInput.replace(/\D/g, ''));
    if (!finalVal || finalVal < MIN_TRANSACTION_AMOUNT) {
      finalVal = MIN_TRANSACTION_AMOUNT;
    } else if (finalVal > MAX_TRANSACTION_AMOUNT) {
      finalVal = MAX_TRANSACTION_AMOUNT;
    }
    setAmount(finalVal);
    setAmountInput(finalVal.toLocaleString('en-IN'));
    syncWalletIfDemo(finalVal);
  };

  const handleSliderChange = (newVal: number) => {
    setAmount(newVal);
    setAmountInput(newVal.toLocaleString('en-IN'));
    setErrorMessage(null);
    setSuccessNotice(null);
    syncWalletIfDemo(newVal);
  };

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setAmountInput(val.toLocaleString('en-IN'));
    setErrorMessage(null);
    setSuccessNotice(null);
    syncWalletIfDemo(val);
  };

  // Add chosen amount to current balance
  const handleAddFunds = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (amount < MIN_TRANSACTION_AMOUNT || amount > MAX_TRANSACTION_AMOUNT) {
      setErrorMessage(`Amount must be between ₹${MIN_TRANSACTION_AMOUNT.toLocaleString('en-IN')} and ₹${MAX_TRANSACTION_AMOUNT.toLocaleString('en-IN')}.`);
      return;
    }

    try {
      const newBal = Math.min(walletBalance + amount, MAX_TRANSACTION_AMOUNT);
      dbService.setWalletBalance(currentUser.id, newBal, `Added funds: +₹${amount.toLocaleString('en-IN')}`);
      setWalletBalance(newBal);
      setSuccessNotice(`Successfully added ${formatINR(amount)} to wallet! New Balance: ${formatINR(newBal)}`);
      if (onSuccess) {
        onSuccess(newBal);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add funds.');
    }
  };

  // Set wallet to exact chosen amount
  const handleSetExactBalance = () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    if (amount < MIN_TRANSACTION_AMOUNT || amount > MAX_TRANSACTION_AMOUNT) {
      setErrorMessage(`Amount must be between ₹${MIN_TRANSACTION_AMOUNT.toLocaleString('en-IN')} and ₹${MAX_TRANSACTION_AMOUNT.toLocaleString('en-IN')}.`);
      return;
    }

    try {
      dbService.setWalletBalance(currentUser.id, amount, `Set wallet balance to ₹${amount.toLocaleString('en-IN')}`);
      setWalletBalance(amount);
      setSuccessNotice(`Wallet balance set to ${formatINR(amount)}!`);
      if (onSuccess) {
        onSuccess(amount);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update wallet balance.');
    }
  };

  // Reset wallet balance back to ₹0
  const handleResetToZero = () => {
    try {
      dbService.setWalletBalance(currentUser.id, 0, 'Reset wallet balance to ₹0');
      setWalletBalance(0);
      setSuccessNotice('Wallet balance reset to ₹0.');
      if (onSuccess) {
        onSuccess(0);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset wallet balance.');
    }
  };

  const quickPresets = [5000, 10000, 20000, 35000, 50000, 100000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Manage Wallet Funds</h2>
            <p className="text-xs text-slate-500">Live Demo & Sandbox Balance Controller</p>
          </div>
        </div>

        {/* Current Available Wallet Display */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Current Available Wallet Balance:</span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-black ${walletBalance === 0 ? 'text-slate-700' : 'text-emerald-600'}`}>
                {formatINR(walletBalance)}
              </span>
              {walletBalance > 0 && (
                <button
                  type="button"
                  onClick={handleResetToZero}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  title="Reset to ₹0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to ₹0</span>
                </button>
              )}
            </div>
          </div>
          {suggestedAmount && suggestedAmount > 0 && (
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Selected Investment Amount:</span>
              <strong className="text-emerald-700 font-bold">{formatINR(suggestedAmount)}</strong>
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            {isDemoUser
              ? 'Demo live sync active: Typing a number, choosing a preset, or dragging the slider updates the wallet in real time.'
              : 'Add funds to your available wallet balance to cover your selected investment.'}
          </p>
        </div>

        {/* Demo Live Sync Indicator */}
        {isDemoUser && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Live Demo Synced: Wallet updates dynamically on every slider movement, keystroke, and preset click.</span>
          </div>
        )}

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Amount Input Form */}
        <form onSubmit={handleAddFunds} className="space-y-4">
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700 uppercase tracking-wider">
                Select or Enter Money (₹)
              </label>
              <span className="font-semibold text-slate-500">₹100 – ₹1,00,000</span>
            </div>

            {/* Direct Input */}
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-bold text-slate-400 select-none pointer-events-none text-base">
                ₹
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                onBlur={handleAmountBlur}
                placeholder="10,000"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 font-extrabold text-slate-900 bg-white"
              />
            </div>

            {/* Sliding Bar Range Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <span>Slide bar to change wallet value:</span>
                </span>
                <span className={`font-black ${currentUser.role === 'lender' ? 'text-emerald-700' : 'text-blue-700'}`}>
                  {formatINR(amount)}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="100000"
                step="500"
                value={Math.min(Math.max(amount, 100), 100000)}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className={`w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none ${
                  currentUser.role === 'lender' ? 'accent-emerald-600' : 'accent-blue-600'
                }`}
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>₹100 min</span>
                <span>₹25,000</span>
                <span>₹50,000</span>
                <span>₹1,00,000 max</span>
              </div>
            </div>

            {/* Selectable Preset Amount Pills */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">
                Quick Select Preset Options:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {quickPresets.map((presetVal) => (
                  <button
                    key={presetVal}
                    type="button"
                    onClick={() => handleSelectPreset(presetVal)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center flex flex-col items-center justify-center ${
                      amount === presetVal
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/25 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{presetVal >= 100000 ? '₹1,00,000' : formatINR(presetVal)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons: Add money or Set exact balance */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={amount < MIN_TRANSACTION_AMOUNT || amount > MAX_TRANSACTION_AMOUNT}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add +{formatINR(amount)} to Wallet (Total: {formatINR(walletBalance + amount)})</span>
            </button>

            <button
              type="button"
              onClick={handleSetExactBalance}
              disabled={amount < MIN_TRANSACTION_AMOUNT || amount > MAX_TRANSACTION_AMOUNT}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>Or Set Wallet Directly to {formatINR(amount)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Updates your wallet instantly across Navbar, Calculator & Dashboard.</span>
        </div>
      </div>
    </div>
  );
};
