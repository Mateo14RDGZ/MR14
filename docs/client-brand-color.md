# Client accent color

Apply `supabase/migrations/0019_client_brand_color.sql` before deploying this version.
It adds a nullable, hex-validated `clients.brand_color` column under existing client
RLS policies (admin writes, members read). It seeds Motocenter with red `#C62828`.

Admin → Clients → Edit → Color del panel del cliente:
- Automatic (default): one dominant chromatic hue from the current logo.
- Manual: one chosen color, preserved when replacing the logo; uncheck to restore automatic.

Detection runs only on the server with Sharp, at 64×64 resolution. White, gray,
black and transparent pixels are excluded. Nearby hues are grouped and weighted
by visible area and saturation. Results use Next's data cache (24h), keyed by the
client ID and versioned logo URL. Existing logos work without re-uploading.
Only the configured Supabase public client-logo path is fetched, with redirects
disabled, timeout, download size and decoded pixel limits. Failure falls back
to slate blue without blocking access. A replaced logo receives a new cache key.

Theme variables are server-rendered and scoped to the client layout. React
context carries the same variables into body-portaled dialogs without changing
the admin theme. No logo-analysis JavaScript is shipped to phones. Surfaces stay
white; semantic status colors are unchanged. Accent brightness is reduced until
white text and accent links meet AA, including the soft tint. Hover uses the same hue.

Run `node --test tests/brand-color.test.mjs`, TypeScript, lint and the production build.
Before production, verify with two accounts: automatic logo selection, replacing
a logo, saving/restoring a manual override, organization switching, and dialogs.
