/** The only user shape the API ever returns. */
export function toPublicUser(user, { hasPhoto = false } = {}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    isFirstTimeLogin: Boolean(user.isFirstTimeLogin),
    hasPhoto,
    // Changes whenever the profile changes; used to bust the avatar cache.
    photoVersion: new Date(user.updatedAt ?? 0).getTime(),
    preferences: {
      currency: user.preferences?.currency ?? 'CAD',
      timezone: user.preferences?.timezone ?? 'America/Edmonton',
      aiEnabled: Boolean(user.preferences?.aiEnabled),
    },
    createdAt: user.createdAt,
  };
}
