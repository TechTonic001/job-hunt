/**
 * Authentication verification middleware stub
 * In production with Firebase Admin SDK, verifies Bearer tokens and populates req.user
 */
export const protect = async (req, res, next) => {
  try {
    if (!req.user) {
      // In development fallback, allow testing or check for x-user-id header
      const mockUserId = req.headers['x-user-id'] || '000000000000000000000001';
      req.user = { _id: mockUserId };
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

export default protect;
