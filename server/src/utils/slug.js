import slugify from 'slugify';
import crypto from 'crypto';

/**
 * Generate a unique slug from title
 */
export function generateSlug(title) {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true
  }).slice(0, 50);

  const suffix = crypto.randomBytes(3).toString('hex');
  return `${baseSlug}-${suffix}`;
}
