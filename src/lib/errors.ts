/** Errors that carry the HTTP status the API routes should return. */
export class HttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Sign in to continue.") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "You do not have access to this resource.") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not found.") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends HttpError {
  constructor(
    message = "This entry was changed somewhere else. Reload and try again.",
  ) {
    super(message, 409);
    this.name = "ConflictError";
  }
}

export class ValidationError extends HttpError {
  constructor(message = "The request payload is invalid.") {
    super(message, 400);
    this.name = "ValidationError";
  }
}
