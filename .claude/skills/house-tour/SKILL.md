---
name: house-tour
description: Build an interactive isometric 3D tour of a house from a property listing link (floor plans, photos and description), reusing this repo's tour-kit engine. Use when given a listing URL and asked for a 3D tour, model or visualisation of the house.
argument-hint: <listing URL> [notes]
---

Build an interactive isometric 3D tour of the house at this listing, the same way as the
existing tours in this repo (`ellan-park-16/`, `ellan-park-22/`, `laurys-avenue-19/`):

$ARGUMENTS

Anything after the link is extra notes from me (for example "add this garden studio at the
back" or "it's the left-hand semi"). Fill missing information by reasoning, and don't stop to
ask questions unless the listing can't be reached at all.

## 1. Gather the evidence first

- Read the listing page: description, key facts, price, room dimensions, the floor plan for
  every floor, and every photo. Download the floor plans and photos and look at each one.
- If the site blocks you (403, Cloudflare "Just a moment", a dead page), try the agent's own
  website, other portals (Rightmove, Zoopla, OnTheMarket, PrimeLocation, local agents), the
  web archive and the image CDN URLs. If nothing works, tell me what was blocked, ask once for
  screenshots of the floor plan and photos, and carry on from whatever text you can find.
- Before modelling, make a short brief for yourself: rooms and dimensions per floor, which
  room each photo shows and what it shows (finishes, furniture, fittings), and the gaps you
  will have to infer.

## 2. Model the house

- A new folder named after the address (like `laurys-avenue-19/`) with `index.html`, `js/house.js` (walls, stairs, roofs, plot,
  furnishings), `js/content.js` (scenes and room notes) and `js/main.js`, built on `tour-kit/`.
  Copy the structure of the closest existing tour. Add new furniture, materials or geometry to
  the kit rather than to the house, and check the earlier tours still look the same.
- Metres, y up, x from the front wall to the back, z across the house. Rooms to scale from the
  plan dimensions, cross-checked against the overall footprint. If the plan is "not to scale"
  and the floors disagree, reconcile them and say so.
- Real openings: windows, doors with their swing, French or sliding doors, open archways.
  Outside walls about 0.25-0.3 m thick, inside walls about 0.1 m. Defaults when unknown:
  2.4 m ceilings, 2.0 m doors, 0.9 m sills and worktops.
- Stairs that fit both floor plans. Roof shape and pitch from the photos (gable, hip, lean-to,
  dormers), plus chimneys, porches, extensions and conservatories.
- The plot: drive, garden, patio, deck, fences or hedges, shed, with simplified neighbouring
  houses for context. Cars only for scale.
- Furnish every room. Photographed rooms match the photos (colours, finishes, furniture and
  where it stands); other rooms get plausible furniture. Keep doors clear of furniture.
- Tag every object with a label and a source: Floor plan, Listing (named in the description),
  Photos, or Inferred. Anything I ask you to add that isn't part of the property gets its own
  tag, such as Proposed. Limit the legend to the tags the tour uses.

## 3. Scenes and page

- Scenes: front, rear and garden (more if the plot is interesting), one cutaway plan per
  floor, and one scene per room, each with a camera angle that faces the room's main features
  so the walls nearest the camera drop away.
- Each scene's panel: dimensions in feet and inches and in metres ("≈" when estimated), a
  one-line summary, "From the listing", "Seen in the photos", "Filled in by reasoning", and the
  inventory of everything in the scene with its source.
- Fill in `PROPERTY` (name, place, price, facts, source link) and cross-link the new tour with
  the others through `related`. Add it to `tours.html` and the README.

## 4. Check the work

- Serve the repo and screenshot every scene in headless Chromium, on desktop and at phone width
  in dark mode. Look at every screenshot and fix what is wrong: furniture through walls or
  doors, the wrong walls cut away, labels overlapping, objects blocking the view. There should
  be no console errors.

## 5. Deliver

- Commit and push to my working branch, then publish the tour as a private Artifact (a flat
  copy of the page, `tour-kit/` and the house's `js/`) and give me the link. Republish the
  other tours if their cross-links changed.
- End with a short summary: what came from the listing, what you inferred, and what extra
  material (floor plan, photos) would make it more accurate.
