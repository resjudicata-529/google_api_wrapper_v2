import { TokenData, TokenSchema } from '@/types/auth';
import { encryptToken, decryptToken } from '@/services/auth';

describe('Auth Service', () => {
  const mockToken: TokenData = {
    access_token: 'test_access_token',
    refresh_token: 'test_refresh_token',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    token_type: 'Bearer',
    expiry_date: Date.now() + 3600000, // 1 hour from now
  };

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'test_encryption_key_32chars_______';
  });

  it('should validate token schema', () => {
    const result = TokenSchema.safeParse(mockToken);
    expect(result.success).toBe(true);
  });

  it('should encrypt and decrypt token', () => {
    const encrypted = encryptToken(mockToken);
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('content');

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toEqual(mockToken);
  });

  it('should fail validation for invalid token', () => {
    const invalidToken = {
      access_token: 123, // Should be string
      token_type: 'Bearer',
    };

    const result = TokenSchema.safeParse(invalidToken);
    expect(result.success).toBe(false);
  });
}); 