interface CurrencyDisplayProps {
  amount: number;
  user?: any;
  showSign?: boolean;
}

export const CurrencyDisplay = ({ amount, user, showSign = false }: CurrencyDisplayProps) => {
  const symbol = user?.country?.symbol || '₹';
  const sign = showSign && amount > 0 ? '+' : '';
  
  return (
    <span>
      {sign}{symbol}{amount.toFixed(2)}
    </span>
  );
};

export const getMinAmount = (user?: any) => {
  return user?.country?.code === 'GB' ? 25 : 300;
};

export const getMinAmountText = (user?: any) => {
  const symbol = user?.country?.symbol || '₹';
  const amount = getMinAmount(user);
  return `${symbol}${amount}`;
};
