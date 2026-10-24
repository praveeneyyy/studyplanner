export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request payload validation failed.',
          details: result.error.errors.map((err) => ({
            field: err.path.join('.'),
            issue: err.message
          }))
        }
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
