import User from '../models/User.js';

/**
 * Enforces the 24-hour rolling rate limit quota and increments applicationsSentToday
 * @param {string | import('mongoose').Types.ObjectId} userId - User ID to enforce quota for
 * @returns {Promise<import('../models/User.js').User>} - Updated user document
 * @throws {Error} - Throws 'Daily application limit reached' or 'User not found'
 */
export const enforceAndConsumeQuota = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const now = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const lastReset = user.lastResetDate ? new Date(user.lastResetDate).getTime() : 0;

  // 1. Reset quota if 24 hours have elapsed
  if (now - lastReset >= TWENTY_FOUR_HOURS_MS) {
    user.applicationsSentToday = 0;
    user.lastResetDate = new Date(now);
  }

  // 2. Check if daily threshold is reached
  const dailyLimit = typeof user.dailyApplicationLimit === 'number' ? user.dailyApplicationLimit : 10;
  if (user.applicationsSentToday >= dailyLimit) {
    throw new Error('Daily application limit reached');
  }

  // 3. Increment consumed quota and save
  user.applicationsSentToday += 1;
  await user.save();

  return user;
};

export default enforceAndConsumeQuota;
