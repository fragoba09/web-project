# web-project
My website project

## 3D house tour

`ellan-park/` is an interactive isometric 3D model of
[16 Ellan Park, Ramsey](https://koopsandco.com/property/ellan-park-ramsey-im8/):
the exterior, both gardens, each floor as a dollhouse cutaway, and all ten rooms.

- Room sizes and positions follow the listing's floor plans; finishes and furniture
  follow the listing photos. Anything not shown (the garage interior, plot size,
  roof pitch) is filled in and tagged *Inferred* in the page.
- Built with [three.js](https://threejs.org/) 0.160, loaded from jsDelivr, so there is no build step.
  Serve the repo with any static server (for example `npx http-server .`) and open
  `/ellan-park/`. Opening the file directly from disk will not work, because ES modules need HTTP.
- Code: `js/house.js` (walls, roofs, stairs, garden, furnishings), `js/furniture.js`
  (low-poly furniture), `js/kit.js` (materials, procedural textures, geometry helpers),
  `js/content.js` (scene list and room notes), `js/app.js` (camera, cutaway, UI).
