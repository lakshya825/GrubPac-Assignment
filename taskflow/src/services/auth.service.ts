import prisma from '../utils/prisma';
import bcrypt from 'bcrypt';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';

const BCRYPT_ROUNDS = 12;

export const authService = {
  async register(email: string, passwordRaw: string, name: string, organizationId?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email is already in use');
    }

    if (organizationId) {
      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) throw new Error('Organization not found');
    }

    const password = await bcrypt.hash(passwordRaw, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        password,
        name,
      },
    });

    if (organizationId) {
      await prisma.orgMember.create({
        data: {
          userId: user.id,
          organizationId,
          role: 'member'
        }
      });
    }

    const tokens = generateTokens(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { user: { id: user.id, email: user.email, name: user.name }, ...tokens };
  },

  async login(email: string, passwordRaw: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(passwordRaw, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const tokens = generateTokens(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { user: { id: user.id, email: user.email, name: user.name }, ...tokens };
  },

  async refresh(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      // Verify it exists in DB (revocation support)
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new tokens
      const tokens = generateTokens(decoded.userId);

      // Rotate: Delete old token and store new one
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.$transaction([
        prisma.refreshToken.delete({ where: { token: refreshToken } }),
        prisma.refreshToken.create({
          data: {
            token: tokens.refreshToken,
            userId: decoded.userId,
            expiresAt,
          },
        }),
      ]);

      return tokens;
    } catch (err) {
      throw new Error('Invalid or expired refresh token');
    }
  },

  async logout(refreshToken: string) {
    try {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } catch (e) {
      // Ignore if token doesn't exist
    }
  },
};
