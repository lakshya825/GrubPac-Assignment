import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../utils/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  organizationId?: string;
  role?: string;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = user;

    // Organization Context
    // We allow the client to pass X-Organization-Id to switch orgs, but we rigorously verify it.
    // If not passed, we default to the user's first organization.
    const clientOrgId = req.headers['x-organization-id'] as string | undefined;
    
    let membership;
    
    if (clientOrgId) {
      membership = await prisma.orgMember.findUnique({
        where: { userId_organizationId: { userId: user.id, organizationId: clientOrgId } }
      });
      if (!membership) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this organization' });
      }
    } else {
      membership = await prisma.orgMember.findFirst({
        where: { userId: user.id }
      });
      // It's okay if they have no orgs yet, but if they do, we attach the first one.
    }

    if (membership) {
      req.organizationId = membership.organizationId;
      req.role = membership.role;
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.role !== 'org_admin') {
    return res.status(403).json({ error: 'Forbidden: Organization admin privileges required' });
  }
  next();
};
