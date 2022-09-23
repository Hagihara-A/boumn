import { types } from "util";

export type Errors = Error | NodeJS.ErrnoException | AppError;

class AppError implements Error {
  constructor(public readonly name: string, public readonly message: string) {}
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return types.isNativeError(error);
}

export const matchError = (e: unknown): Errors => {
  if (isNodeError(e)) {
    return e;
  }
  if (e instanceof AppError) {
    return e;
  }
  if (e instanceof Error) {
    return e;
  }
  return new Error(String(e));
};
