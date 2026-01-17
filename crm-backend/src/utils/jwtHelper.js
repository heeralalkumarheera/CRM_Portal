import jwt from 'jsonwebtoken';

// Lazy-load secrets (they're populated after dotenv.config() in server.js)
export const getSecrets = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required in .env file');
  }
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is required in .env file');
  }

  return { JWT_SECRET, JWT_REFRESH_SECRET };
};

// Generate Access Token
export const generateAccessToken = (id) => {
  if (!id) {
    throw new Error('User ID is required to generate access token');
  }
  const { JWT_SECRET } = getSecrets();
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h'
  });
};

// Generate Refresh Token
export const generateRefreshToken = (id) => {
  if (!id) {
    throw new Error('User ID is required to generate refresh token');
  }
  const { JWT_REFRESH_SECRET } = getSecrets();
  return jwt.sign({ id }, JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
  try {
    const { JWT_REFRESH_SECRET } = getSecrets();
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Send token response
export const sendTokenResponse = async (user, statusCode, res, message = 'Success') => {
  try {
    // Validate user has ID
    if (!user || !user._id) {
      console.error('❌ sendTokenResponse: Invalid user object', user);
      throw new Error('User object with _id is required');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Keep only last 5 refresh tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    // AWAIT the save before sending response
    await user.save({ validateBeforeSave: false });

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
      success: true,
      message,
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('❌ Token response error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating tokens',
      error: error.message
    });
  }
};
