import { type Request, type Response, type NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(`Error: ${err.message}`);
  res.status(500).json({ success: false, error: err.message });
}
