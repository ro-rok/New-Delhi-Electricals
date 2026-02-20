# Vercel Environment Variables Setup

## Required Environment Variables

To ensure proper SEO and social sharing (WhatsApp, Facebook, Twitter), you need to set the following environment variables in Vercel:

### Frontend Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_SITE_URL` | `https://www.newdelhielectricals.com` | Production |
| `VITE_API_BASE_URL` | `https://api.newdelhielectricals.com` | Production |
| `VITE_SITE_URL` | `http://localhost:5173` | Development (optional) |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Development (optional) |

## Why This Is Important

The `VITE_SITE_URL` variable is crucial for:
- Converting relative image URLs to absolute URLs
- Ensuring product images display in WhatsApp previews
- Proper Open Graph tags for social sharing
- SEO optimization

## After Setting Variables

1. Redeploy your application
2. Test social sharing:
   - Share a product URL in WhatsApp
   - Verify image and description appear
3. Use debugging tools:
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/

## Troubleshooting

If images still don't show after deployment:
1. Verify the environment variable is set correctly
2. Check that the variable is assigned to "Production" environment
3. Trigger a new deployment (redeploy)
4. Clear social platform cache using their debugging tools
5. Wait 24-48 hours for cache to expire naturally

## Testing

To test if the environment variable is working:
1. Open browser console on your production site
2. Run: `console.log(import.meta.env.VITE_SITE_URL)`
3. Should output: `https://www.newdelhielectricals.com`
