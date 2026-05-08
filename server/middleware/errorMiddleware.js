const errorHandler = (err, req, res, next) => {
  // If the headers have already been sent to the client, delegate to the default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isProduction = process.env.NODE_ENV === "production";

  console.error("Express Error:", err.message);

  res.status(statusCode).json({
    message: err.message || "An unexpected server error occurred",
    // Only send the stack trace if we are not in production
    stack: isProduction ? undefined : err.stack,
  });
};

module.exports = { errorHandler };
