import type { Request } from 'express';

/** Data stored inside the JWT */
export interface JwtPayload {
  sub: string; // admin id
  email: string;
}

/** Request after AuthGuard ran: the decoded token is available as request.admin */
export interface AuthenticatedRequest extends Request {
  admin: JwtPayload;
}
