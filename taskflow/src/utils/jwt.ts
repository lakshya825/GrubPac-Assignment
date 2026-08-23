import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'supersecretaccess';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'supersecretrefresh';

export interface JwtPayload {
  userId: string;
}

import crypto from 'crypto';

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId }, 
    ACCESS_TOKEN_SECRET, 
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId }, 
    REFRESH_TOKEN_SECRET, 
    { 
      expiresIn: '7d',
      jwtid: crypto.randomUUID()
    }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
};
