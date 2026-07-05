import { v4 as uuidv4 } from 'uuid';

export const generateIdempotencyKey = (): string => {
  return uuidv4();
};

export const getStoredIdempotencyKey = (actionName: string): string => {
  const stored = localStorage.getItem(`idemp_key_${actionName}`);
  if (stored) return stored;
  
  const newKey = generateIdempotencyKey();
  localStorage.setItem(`idemp_key_${actionName}`, newKey);
  return newKey;
};

export const clearIdempotencyKey = (actionName: string): void => {
  localStorage.removeItem(`idemp_key_${actionName}`);
};
