/**
 * API base URL — empty in development (Vite proxy handles /api),
 * absolute URL in staging/production Vercel deployments.
 *
 * Set via VITE_API_URL environment variable in Vercel dashboard:
 *   - Staging:    https://api-staging.synflo.space
 *   - Production: https://api.synflo.space
 */
export const API_URL = import.meta.env.VITE_API_URL ?? ''
