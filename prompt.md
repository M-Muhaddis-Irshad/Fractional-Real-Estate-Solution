TASK: Update Existing Real Estate Platform — Replace Images, Redesign UI, Add New "Our Story" Page

CONTEXT: This is an EXISTING, already-deployed project (Fractional Real Estate module). 
Stack: React + Vite + Tailwind CSS + MUI (frontend), Node.js + Express (backend), MongoDB (database).
Do NOT scaffold a new project. First scan the existing codebase structure (components, pages, routes, theme/config files) and identify:
- Current image usage (placeholder text-based images, low-quality images, or hardcoded image URLs)
- Current theme/styling setup (Tailwind config, MUI theme file, global CSS)
- Current routing setup (React Router / Next.js routes) to know where to add the new page

=================================================================
PART 1 — REPLACE EXISTING IMAGES (STRICT RULES)
=================================================================
- Find and replace ALL placeholder/text-based/low-quality images currently in the project with REAL, professional, high-resolution images.
- Source from royalty-free professional stock libraries (Unsplash, Pexels, Pixabay) via their APIs or direct CDN links.
- Images must be relevant to real estate: modern buildings, apartments, skylines, property interiors, investment/finance visuals, handshake/deal imagery, happy homeowners, etc.
- STRICTLY AVOID: cartoonish images, clipart, watermarked stock photos, low-resolution/pixelated images, generic clichés, or anything unprofessional.
- Keep consistent aspect ratios, optimize images (WebP where possible), and add lazy loading.
- Add proper alt text to every image for accessibility/SEO.
- Preserve existing image component structure where possible — just swap the source, don't break layouts.

=================================================================
PART 2 — UPDATE/REDESIGN EXISTING UI (PROFESSIONAL STANDARD)
=================================================================
Update the CURRENT UI (do not rebuild from scratch) to feel like a premium fintech/proptech product (DAO PropTech / PropertyShare-level polish):
- Review and refine the existing color palette, typography scale, spacing, and border-radius/shadow conventions — update the Tailwind config / MUI theme file centrally so changes apply site-wide.
- Restyle existing MUI components via the theme/Tailwind overrides so they no longer look like default MUI — no default blue buttons, no generic Material look.
- Audit and fix responsiveness issues across mobile, tablet, and desktop breakpoints.
- Improve the existing navbar (sticky/clean, clear CTAs like "Invest Now", "List Your Property") and footer (organized sitemap links) — modify existing components, don't duplicate them.
- Add smooth micro-interactions (hover states, transitions, loading skeletons) to existing interactive elements.
- Maintain accessibility (contrast ratios, keyboard nav, ARIA labels).
- Apply changes consistently across ALL existing pages, not just new ones — check for style drift/inconsistency between pages.

=================================================================
PART 3 — ADD NEW "OUR STORY" / ABOUT PAGE (6–7 SECTIONS)
=================================================================
Create a new page/route (e.g., /our-story or /about) following the existing project's routing and component conventions. Add a link to it in the existing navbar and footer. Sections:

1. **Who We Are** — Platform intro, mission, what makes us different in fractional real estate investment.
2. **Our Purpose** — Why this platform exists (high entry barriers, lack of transparency, illiquidity of real estate, etc.)
3. **Our Roadmap** — Visual timeline (past milestones → current phase → future plans: new cities, new asset classes, mobile app, secondary market). Use a timeline/stepper component.
4. **How to Buy/Sell Property (Step-by-Step)**:
   - Buying: Sign up → KYC verification → Browse listings → Invest in fractions → Track ownership/returns → Exit/resell shares
   - Selling: List property → Verification & valuation → Fractionalization → Go live → Track investor funding
   Use icons/illustrations per step.
5. **Benefits for Users** — Grid/card layout: low minimum investment, diversification, passive rental income, transparency, liquidity via secondary market, professional property management, etc.
6. **Terms & Policies** — Summarized key points (risk disclosure, ownership rights, fees, exit policy) + link to full Terms & Conditions/Privacy Policy page.
7. **Customer Care / Support** — Contact options (live chat, email, phone), FAQs link, support hours, commitment to support.

Design notes:
- Alternate layout per section (image-left/text-right, then reversed) for visual rhythm.
- Use real, high-quality images matching each section's theme.
- End with a strong CTA section ("Ready to invest?" / "List your property today").
- Match the new page's styling to the updated global theme from Part 2 — it should look native to the site, not bolted on.

=================================================================
PART 4 — FINAL DELIVERABLE
=================================================================
- Test responsiveness across breakpoints, confirm no broken images/links, confirm no existing functionality was broken during the update.
- Provide a final summary of everything changed/added, written in Roman Urdu, explaining simply what was done in each part (image replacements, UI redesign, new Our Story page and its 7 sections).