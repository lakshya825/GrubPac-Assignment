import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../../src/utils/jwt';
import bcrypt from 'bcrypt';

describe('Auth Utilities', () => {
  describe('JWT Utility', () => {
    it('should generate valid access and refresh tokens', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const tokens = generateTokens(userId);
      
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');

      const decodedAccess = verifyAccessToken(tokens.accessToken);
      expect(decodedAccess.userId).toBe(userId);

      const decodedRefresh = verifyRefreshToken(tokens.refreshToken);
      expect(decodedRefresh.userId).toBe(userId);
    });

    it('should fail to verify an invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash a password and verify it correctly', async () => {
      const plainPassword = 'mySuperSecretPassword123!';
      const hash = await bcrypt.hash(plainPassword, 10);
      
      const isValid = await bcrypt.compare(plainPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('wrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });
});
