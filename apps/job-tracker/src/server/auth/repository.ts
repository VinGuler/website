import type { PrismaClient } from '../../generated/prisma/index.js';
import type {
  AuthRepository,
  AuthUser,
  CreateUserData,
  PasswordResetTokenRecord,
} from '@workspace/login';

export function createAuthRepository(prisma: PrismaClient): AuthRepository {
  const selectAuthUser = {
    id: true,
    username: true,
    displayName: true,
    passwordHash: true,
    tokenVersion: true,
    emailEncrypted: true,
  } as const;

  return {
    async findUserByUsername(username: string): Promise<AuthUser | null> {
      return prisma.user.findUnique({ where: { username }, select: selectAuthUser });
    },

    async findUserById(id: number): Promise<AuthUser | null> {
      return prisma.user.findUnique({ where: { id }, select: selectAuthUser });
    },

    async getUserTokenVersion(id: number): Promise<number | null> {
      const user = await prisma.user.findUnique({ where: { id }, select: { tokenVersion: true } });
      return user?.tokenVersion ?? null;
    },

    async createUser(data: CreateUserData): Promise<AuthUser> {
      return prisma.user.create({
        data: {
          username: data.username,
          displayName: data.displayName,
          passwordHash: data.passwordHash,
          emailHash: data.emailHash,
          emailEncrypted: data.emailEncrypted,
        },
        select: selectAuthUser,
      });
    },

    async incrementTokenVersion(userId: number): Promise<void> {
      await prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      });
    },

    async updatePasswordAndInvalidateSessions(userId: number, passwordHash: string): Promise<void> {
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      });
    },

    async updateEmail(userId: number, emailHash: string, emailEncrypted: string): Promise<void> {
      await prisma.user.update({ where: { id: userId }, data: { emailHash, emailEncrypted } });
    },

    async createPasswordResetToken(data: {
      userId: number;
      tokenHash: string;
      expiresAt: Date;
    }): Promise<void> {
      await prisma.passwordResetToken.create({ data });
    },

    async findValidResetToken(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
      return prisma.passwordResetToken.findFirst({ where: { tokenHash } });
    },

    async markResetTokenUsed(tokenId: number): Promise<void> {
      await prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      });
    },
  };
}
