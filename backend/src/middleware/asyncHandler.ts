import type { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Express 4 does not catch rejected promises thrown inside async handlers --
 * an unhandled rejection there crashes the whole process (Node terminates on
 * unhandled rejections by default). Wrap every async route with this so
 * errors reach the error-handling middleware instead of taking the server down.
 */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
