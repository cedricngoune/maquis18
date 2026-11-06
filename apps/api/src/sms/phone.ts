/**
 * French phone number → international E.164 format required by Twilio.
 * "06 12 34 56 78" → "+33612345678", "+33 6 12 34 56 78" → "+33612345678"
 */
export function toFrenchE164(phone: string): string {
  const digits = phone.replace(/[\s.-]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('0')) return `+33${digits.slice(1)}`;
  return digits;
}

/** "+33612345678" → "+33 6 •• •• •• 78" (for logs: never write full numbers there) */
export const maskPhone = (e164: string) => `${e164.slice(0, 4)} •• •• •• ${e164.slice(-2)}`;
