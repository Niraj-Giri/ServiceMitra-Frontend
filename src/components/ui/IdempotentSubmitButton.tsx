import React from 'react';
import { Button } from './Button';
import type { ButtonProps } from './Button';
import { getStoredIdempotencyKey, clearIdempotencyKey } from '../../utils/idempotency';

interface IdempotentSubmitButtonProps extends Omit<ButtonProps, 'onClick'> {
  actionName: string;
  onClick: (idempotencyKey: string) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const IdempotentSubmitButton: React.FC<IdempotentSubmitButtonProps> = ({
  actionName,
  onClick,
  onSuccess,
  onError,
  children,
  ...props
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    const idempKey = getStoredIdempotencyKey(actionName);

    try {
      await onClick(idempKey);
      // If it succeeds, clear the key so the next operation gets a fresh one
      clearIdempotencyKey(actionName);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      // Do not clear the key on error, so retry sends the same key
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      isLoading={loading || props.isLoading}
    >
      {children}
    </Button>
  );
};
