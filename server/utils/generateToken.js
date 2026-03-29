const jwt = require('jsonwebtoken');

const DEFAULT_JWT_EXPIRES_IN_DAYS = 7;

const getJwtExpiresInDays = () => {
  const parsed = Number.parseInt(process.env.JWT_EXPIRES_IN_DAYS, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_JWT_EXPIRES_IN_DAYS;
};

const generateToken = (res, userId) => {
  const expiresInDays = getJwtExpiresInDays();

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: `${expiresInDays}d`,
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    sameSite: 'strict', // Prevent CSRF attacks
    maxAge: expiresInDays * 24 * 60 * 60 * 1000,
  });
};

module.exports = generateToken;
