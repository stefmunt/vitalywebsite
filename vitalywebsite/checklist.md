# Vitaly Executive Chauffeur — Pre-Launch Checklist

Work through every section before going live. Mark each item ✅ when done.

---

## 1. Business & Legal Details

These appear on the website, in emails, and in schema.org structured data.
Collect these before touching any placeholder in the code.

| Item | Where to find it | Status |
|---|---|---|
| Legal company name | CRO certificate | ☐ |
| CRO registration number | CRO certificate | ☐ |
| VAT number (IE XXXXXXXX) | Revenue.ie confirmation letter | ☐ |
| PSV operator licence number | National Transport Authority letter | ☐ |
| Business phone number (E.164) | SIM card / carrier | ☐ |
| WhatsApp number (must match phone) | WhatsApp Business app | ☐ |
| Business email address | Email provider | ☐ |
| Verified sender domain for Resend | resend.com dashboard → Domains | ☐ |
| Google Business Profile URL | Google Maps → your listing → Share | ☐ |
| Instagram handle | Instagram account | ☐ |
| LinkedIn company page URL | LinkedIn | ☐ |

---

## 2. Placeholder Replacements in Code

Run a global search for `PLACEHOLDER` and `[FILL IN` in the project before launch.
Every instance must be resolved.

```bash
grep -r "PLACEHOLDER\|\[FILL IN" src/ public/ worker.js
```

### Critical (site will not function correctly without these)

| File | Placeholder | Replace with |
|---|---|---|
| `src/components/Header.astro` | `+353XXXXXXXXX` | Real phone number |
| `src/components/Header.astro` | `353XXXXXXXXX` (WhatsApp) | Real WA number (no +) |
| `src/components/CTABand.astro` | `+353XXXXXXXXX` | Real phone number |
| `src/components/CTABand.astro` | `353XXXXXXXXX` (WhatsApp) | Real WA number |
| `src/components/FAQ.astro` | `+353XXXXXXXXX` | Real phone number |
| `src/components/FAQ.astro` | `353XXXXXXXXX` (WhatsApp) | Real WA number |
| `src/components/Footer.astro` | `353XXXXXXXXX` | Real WA number |
| `src/layouts/BaseLayout.astro` | `PLACEHOLDER_PHONE` | Real phone (schema.org) |
| `src/layouts/BaseLayout.astro` | `PLACEHOLDER_VAT` | VAT number |
| `src/layouts/BaseLayout.astro` | `PLACEHOLDER_LEGAL_NAME` | Legal company name |
| `src/layouts/BaseLayout.astro` | `G-XXXXXXXXXX` | GA4 Measurement ID |
| `public/app.js` | `+353XXXXXXXXX` | Real phone number |
| `public/app.js` | `353XXXXXXXXX` | Real WA number |
| `public/app.js` | `G-XXXXXXXXXX` | GA4 Measurement ID |
| `wrangler.jsonc` | `PLACEHOLDER_OWNER_EMAIL` | Owner email |
| `wrangler.jsonc` | `PLACEHOLDER_OWNER_PHONE` | Owner E.164 phone |
| `wrangler.jsonc` | `PLACEHOLDER_TWILIO_FROM_NUMBER` | Twilio number |
| `src/pages/api/booking.ts` | `353XXXXXXXXX` (in email template) | Real WA number |
| `worker.js` | `353XXXXXXXXX` (in email template) | Real WA number |

### Content (site will look unfinished without these)

| File | Placeholder | Replace with |
|---|---|---|
| `src/components/TrustStrip.astro` | `[FILL IN]` PSV licence | Real PSV number |
| `src/components/TrustStrip.astro` | `[FILL IN: X]+ years` | Real years of experience |
| `src/components/MeetChauffeur.astro` | All `[FILL IN: ...]` | Real chauffeur details |
| `src/components/Reviews.astro` | All `[FILL IN]` | Real testimonials |
| `src/components/Footer.astro` | CRO / VAT / PSV numbers | Real numbers |
| `src/layouts/BaseLayout.astro` | `PLACEHOLDER_INSTAGRAM_URL` | Real Instagram URL |
| `src/layouts/BaseLayout.astro` | `PLACEHOLDER_LINKEDIN_URL` | Real LinkedIn URL |
| `src/layouts/BaseLayout.astro` | `PLACEHOLDER_GOOGLE_BUSINESS_URL` | Real Google Business URL |

---

## 3. Secrets — Cloudflare Environment

Run each command once. Cloudflare stores these encrypted — never commit them to the repo.

```bash
wrangler secret put RESEND_API_KEY
wrangler secret put TWILIO_ACCOUNT_SID
wrangler secret put TWILIO_AUTH_TOKEN
```

Then update the non-secret `[vars]` in `wrangler.jsonc` with real values:
- `OWNER_EMAIL`
- `OWNER_PHONE`
- `TWILIO_FROM_NUMBER`
- `FROM_EMAIL` (must be a verified domain in Resend)

---

## 4. Photo Shot List

All photos are currently placeholder images. Commission or photograph the following.

**Technical spec for all photos:**
- Minimum 2000px on the longest side
- sRGB colour profile
- Saved as progressive JPEG (quality 85) or WebP
- No watermarks, no tourist crowds in background
- Time of day: blue hour (30 min after sunset) for exteriors — gives richest results

### Vehicle Exterior Shots

| Shot | Description | File name |
|---|---|---|
| Hero background | S-Class side-on, Dublin cityscape or airport drop zone in background, blue hour | `hero-s-class.jpg` |
| S-Class front 3/4 | Front-left angle, headlights on, wet road for reflections | `fleet-s-class-exterior.jpg` |
| V-Class front 3/4 | Same treatment as S-Class | `fleet-v-class-exterior.jpg` |
| S-Class detail | Close-up of Mercedes star, gold ambient light | `fleet-s-class-detail.jpg` (optional) |

### Vehicle Interior Shots

| Shot | Description | File name |
|---|---|---|
| S-Class rear cabin | Rear seats, Nappa leather, ambient lighting on, wide angle | `fleet-s-class-interior.jpg` |
| V-Class rear cabin | Captain's chairs, partition, luggage visible in boot | `fleet-v-class-interior.jpg` |
| S-Class dashboard | Driver's POV, instrument cluster, steering wheel | `fleet-s-class-dashboard.jpg` (optional) |

### Chauffeur / People Shots

| Shot | Description | File name |
|---|---|---|
| Chauffeur portrait | Smart dark suit, white shirt, no tie optional, neutral background or car door | `chauffeur-portrait.jpg` |
| Chauffeur with car | Standing at open rear door, S-Class, hotel or terminal exterior | `chauffeur-with-car.jpg` |
| Meet & greet | Name board in arrivals hall, Dublin Airport Terminal 1 or 2 | `chauffeur-arrivals.jpg` (optional) |

### Other

| Shot | Description | File name |
|---|---|---|
| OG image | 1200×630px branded image — car + logo + tagline, for social sharing | `og-image.jpg` |
| Logo SVG | Full logo + icon-only variant, in white and gold on dark, and dark on white | `logo.svg`, `logo-icon.svg` |
| Favicon | 32×32 and 16×16 ICO, plus 180×180 PNG for Apple touch icon | `favicon.ico`, `apple-touch-icon.png` |

---

## 5. Testimonials

Required: at least 3 written testimonials with permission to publish name and role.

For each testimonial, collect:
- [ ] Full quote (2–4 sentences)
- [ ] First name + last initial (e.g. "Sarah M.") or full name if they consent
- [ ] Role / company (e.g. "Head of Operations, [Company]") — or just "Dublin" for private clients
- [ ] Approximate date of journey
- [ ] Written permission (WhatsApp message or email is sufficient)
- [ ] Profile photo (optional — falls back to initials if not provided)

Google review imports: if the customer has left a Google review, you can quote it with a
"Source: Google" badge. No separate permission needed for public reviews.

---

## 6. Third-Party Accounts to Create

| Service | Purpose | URL |
|---|---|---|
| Resend | Transactional email | resend.com |
| Twilio | SMS notifications | twilio.com |
| Google Analytics 4 | Traffic analytics | analytics.google.com |
| Google Business Profile | Local SEO + reviews | business.google.com |
| Cloudflare | Hosting + DNS | cloudflare.com (Pages/Workers) |
| WhatsApp Business | Professional WA profile | business.whatsapp.com |

---

## 7. Domain & DNS

- [ ] Domain registered: `vitalychauffeur.ie`
- [ ] Domain pointed to Cloudflare nameservers
- [ ] `www` CNAME → `vitalychauffeur.ie` (or Pages custom domain)
- [ ] HTTPS auto-provisioned via Cloudflare (automatic once DNS is set)
- [ ] Email MX records set for business email
- [ ] SPF / DKIM / DMARC records set (Resend provides these — follow their DNS guide)

---

## 8. Pre-Launch Functional Tests

Complete these on a real device (iPhone and Android recommended) before launch.

### Forms & CTAs
- [ ] Booking form submits and shows success state with reference number
- [ ] Booking form shows validation errors on bad input (empty required fields, bad email)
- [ ] Booking form error state shows WhatsApp fallback link
- [ ] Owner receives notification email with booking details
- [ ] Customer receives confirmation email with reference number
- [ ] Owner receives SMS notification
- [ ] Customer receives confirmation SMS
- [ ] All phone number `tel:` links open the phone dialler
- [ ] All WhatsApp `wa.me` links open WhatsApp with prefilled message
- [ ] Quote widget calculates prices for all popular routes
- [ ] Quote widget custom tab opens WhatsApp with route details prefilled

### Navigation & UX
- [ ] Mobile hamburger menu opens and closes
- [ ] Mobile menu closes when a nav link is tapped
- [ ] Header becomes opaque on scroll
- [ ] All anchor links scroll to the correct section with correct offset (not hidden under header)
- [ ] "Skip to main content" link works for keyboard navigation
- [ ] All images have descriptive `alt` text

### Cookie Consent & Analytics
- [ ] Cookie banner appears on first visit
- [ ] "Accept all" fires GA4 and sets cookie
- [ ] "Reject non-essential" does NOT fire GA4
- [ ] "Manage preferences" opens modal with individual toggles
- [ ] Returning visitor does not see banner again
- [ ] "Manage cookie preferences" link in footer re-opens the banner
- [ ] GA4 events fire in DebugView: `quote_submitted`, `phone_clicked`, `whatsapp_clicked`, `form_submitted`

### SEO & Performance
- [ ] `<title>` and `<meta name="description">` correct on all pages
- [ ] Canonical URL set correctly
- [ ] Open Graph preview correct (test with opengraph.xyz or LinkedIn post inspector)
- [ ] Schema.org JSON-LD validates with Google Rich Results Test
- [ ] Google PageSpeed Insights score ≥ 90 on mobile
- [ ] No console errors in production build

---

## 9. Post-Launch

- [ ] Submit sitemap to Google Search Console (`https://vitalychauffeur.ie/sitemap.xml`)
- [ ] Verify Google Business Profile ownership
- [ ] Test a real booking end-to-end
- [ ] Set up Cloudflare email routing or Workers email for contact form if needed
- [ ] Schedule first Google review request to a recent customer
