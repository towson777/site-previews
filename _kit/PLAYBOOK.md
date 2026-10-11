# Mock-up playbook

Every mock-up must be as good as the three showcase sites in `_kit/reference/`:

| Folder | Business type | The idea in one line |
| --- | --- | --- |
| `reference/sdt/` | Heating and plumbing | Heating made tangible: the page warms from blue to peach as a dial climbs from 12 to 21°C |
| `reference/tambury-park/` | Café | Come in and sit down: a collage, a zoom into the room, a live "open now" status and table booking |
| `reference/kellys/` | Hair salon | Editorial calm: a giant wordmark, drifting photos, a clear price list and a booking drawer |

They are the quality bar. Before designing anything, open all three in the headless browser at 1440 and 390 wide, scroll through them, and take screenshots at several scroll positions. Read the last `<script>` block of each to see how its signature scene is built. A mock-up that would look cheaper sitting next to them is not finished.

## What makes them work

1. **One idea.** Each site is built around a single concept you can say in a sentence, taken from what the business actually does. Decide yours before writing any code.
2. **Type with character.** One display face used big (hero 64–160px, set with `clamp()`), one clean text face. Self-hosted woff2. Pairings used: Archivo with condensed widths; Fraunces with Figtree; Bodoni Moda with Jost. Don't default to Inter, Roboto, Poppins, Montserrat or Open Sans.
3. **A palette from the business.** Take it from the logo when there is one. One dark, one light, one accent, used in big confident blocks, not just on buttons.
4. **A hero that isn't a template.** Full-bleed photo with type over it; giant type with photos drifting behind; a collage; a split that breaks the grid. The default "headline on the left, rounded photo on the right" layout is not allowed.
5. **One signature scroll moment.** A pinned, scrubbed scene tied to the business (cookbook below). Exactly one; everything else is quiet reveals.
6. **A feature that looks like it works.** Something about how customers actually buy: a quote wizard, a booking drawer, a postcode checker, menu or price tabs. It runs all the way to a confirmation screen and sends nothing.
7. **Quiet, purposeful motion.** Headline lines rise in on load, section titles reveal word by word, images open from a clip, slight parallax, counters, review ribbons that drift and speed up with scroll. Never bouncy, never everything at once.
8. **Finish.** The header hides on the way down and comes back on the way up. Hover and focus states on everything you can click. A phone layout that's designed, not just stacked. Fully usable with reduced motion.

## The engine (`_kit/js/`)

Copy all four files into `<slug>/assets/js/` (the mock-up must stay self-contained) and load them with `defer`, in this order: `gsap.min.js`, `ScrollTrigger.min.js`, `lenis.min.js`, `concept.js`, then your own script.

Put this in the `<head>`, before any CSS that hides things:

```html
<script>(function(d){if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.documentElement.classList.add('motion');setTimeout(function(){if(!d.documentElement.classList.contains('ready'))d.documentElement.classList.remove('motion')},3000)}})(document)</script>
```

and these rules in your CSS, so nothing flashes before the engine starts:

```css
html.motion:not(.ready) .hero h1 .ln>span{transform:translateY(105%)}
html.motion:not(.ready) [data-intro]{opacity:0}
.hero h1 .ln{display:block;overflow:hidden}
.top{transition:transform .5s cubic-bezier(.2,.8,.2,1)} .top.away{transform:translateY(-100%)}
```

Then in your script: `var api = ConceptSite.init();` and build your signature scene inside `if (api.motion) { ... }` using `gsap` and `ScrollTrigger`. Use `gsap.matchMedia()` to give phones a simpler version.

| Markup | What happens |
| --- | --- |
| `<header class="top">` | Hides on scroll down, returns on scroll up |
| `.hero h1 .ln > span` (one `.ln` per line) | Headline lines rise in on load |
| `.hero .bg img` | Slow zoom-out on load, then parallax |
| `[data-intro]` | Fades up just after the headline |
| `[data-reveal]` | Fades up when scrolled into view (batched) |
| `[data-split]` on a heading | Words rise one by one |
| `[data-clip]` on an image frame | Opens from an inset clip as you scroll |
| `[data-parallax]` on an `<img>` in an `overflow:hidden` frame | Gentle parallax (make the image about 116% tall) |
| `[data-count="356"]` | Counts up from 0 |
| `[data-marquee]`, `.strip .track`, `.rv-row` | Endless ribbon. Put the content in twice; `data-dir="-1"` reverses it, `data-speed` sets the pace |

`api.fakeForm(formId, doneId)` gives a form required-field checks and shows the done panel without sending anything.

## Signature moment cookbook

Pick the one that fits, or invent a better one from the business's own idea.

- **Heating and plumbing:** a temperature dial climbs as the page warms (see SDT).
- **Bathrooms and kitchens:** a before-and-after wipe driven by scroll; tiles laying in sequence.
- **Electrician:** a dark house or room lights up section by section as you scroll; a circuit line draws itself down the page.
- **Decorator:** colour washes across a room photo; a paint-swatch fan opens.
- **Roofer:** the roof line draws itself and tiles stack.
- **Gardener or landscaper:** a lawn mows itself in stripes; the garden changes through the seasons.
- **Fencing:** panels slide into place along a line.
- **Cleaner:** a grime layer wipes away as you scroll.
- **Removals:** a van crosses the page as boxes tick off.
- **Locksmith:** a key turns and the lock opens.
- **Café or food:** zoom from the street into the room (see Tambury Park).
- **Salon or beauty:** a giant wordmark with drifting photos; a service list where the photo follows the cursor (see Kelly's).

## Feature cookbook

Every feature looks real, sends nothing, and ends on a confirmation screen with a reference number such as `Q-4821`.

- **Quote wizard:** what's the job, then postcode, then photos (a file picker that shows thumbnails), then contact details, with a progress bar.
- **Booking drawer:** service, then day and time (next 14 days, some slots taken), then details. Label times "Example availability".
- **Postcode checker:** type a postcode, get "Yes, we cover SO53" or "Give us a call" using the coverage field.
- **Price or menu tabs:** only with prices from the lead document.
- **Open now status:** only with hours from the lead document.
- **Before-and-after slider:** only with a genuine before-and-after pair of photos.

Illustrative details inside a demo (time slots, reference numbers) are fine. Facts are not: never invent prices, hours, guarantees or anything else about the business.

## Fonts

Self-host. Get the font from npm, for example `npm pack @fontsource-variable/fraunces` (or `@fontsource/<family>` for static weights), take the latin `.woff2` file from `package/files/`, put it in `<slug>/assets/fonts/`, and declare it with `@font-face` and `font-display: swap`. Don't link Google Fonts: the headless browser can't load them here, so your screenshots would show the wrong font, and it adds a third-party request.

## Copy rules

**The headline**
- 2 to 6 words. Specific, plain, calm. No exclamation marks, puns or rhymes.
- It must say something only this business could say: their specialism, their method, their place, a detail customers keep praising in reviews, how long they've been at it. Only use what the lead document supports.
- The competitor test: if a rival across town could use the line unchanged, rewrite it.
- Never put review counts, ratings, prices or VAT in a headline. Ratings and review counts belong in a small proof line or strip near the hero.
- Process: write ten options, cross out any that fail the test, choose the shortest one that's still specific. Record the shortlist in the art-direction comment.
- Lines we don't want: "Plumbing and heating, done properly." "Southampton's top-rated electrician." "Paintwork that earns 531 reviews."
- The kind we do want, when the facts support them: "Kitchens painted by hand." (a decorator known for hand-painted kitchens) "Forty years of clean edges." (a decorator with 40 years in the trade) "Two of us. Every tile." (a two-person bathroom team).

**Never write anywhere on the site:** VAT or VAT registration status; "done properly", "done right", "you can trust", "trusted", "your local", "no job too small", "quality you can rely on", "second to none", "look no further", "peace of mind", "we've got you covered", "professional and reliable", "affordable", "one-stop shop", "for all your … needs", "transform your", "elevate", "bespoke solutions", "passion for".

**Body copy:** British English, short sentences, concrete detail. Paraphrase listings; never paste them.

## Process

1. Study the references as above.
2. Write an art-direction brief as an HTML comment at the top of `index.html`: the idea in a sentence; palette (hex); type pairing; hero layout; signature moment; feature; headline shortlist and the pick.
3. Build.
4. Review, up to three rounds. Screenshot at 1440 and 390 wide at the top and at several scroll positions, including the middle of the signature scene. Put them next to the reference screenshots and go through the checklist. Fix what fails.

## Checklist

- [ ] It would sit next to the three references without looking cheaper
- [ ] The hero isn't the two-column template; the headline is 6 words or fewer, passes the competitor test, and has no review counts, ratings, prices or VAT
- [ ] No VAT and none of the banned phrases anywhere on the page
- [ ] The intended fonts show in the screenshots
- [ ] The signature scene works on desktop and has a simpler phone version
- [ ] The feature works all the way to its confirmation screen
- [ ] No sideways scrolling at 390 wide; tap targets at least 44px; text contrast AA
- [ ] With reduced motion, everything is visible and usable
- [ ] Every fact can be traced to the lead document
- [ ] Preview banner and `noindex` present; forms send nothing
- [ ] Images WebP and under 300 KB each; whole page under about 3 MB
