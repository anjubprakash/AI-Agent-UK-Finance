import { ApiError } from '../utils/apiError.js';
import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    error = new ApiError(400, 'Validation Failed', formattedErrors);
  } else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  return res.status(error.statusCode).json(response);
};
