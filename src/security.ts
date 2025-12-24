import crypto from 'crypto';

export function verifySignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    if (!signature || !secret) return false;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');

    // Constant time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
    );
}
