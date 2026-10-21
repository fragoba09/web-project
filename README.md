# web-project
My website project

## 3D house tours

Interactive isometric 3D models of three houses in Ramsey, listed from `tours.html`.
Each tour has the outside, every floor as a dollhouse cutaway, and every room:

- `ellan-park-16/`: [16 Ellan Park](https://koopsandco.com/property/ellan-park-ramsey-im8/), a semi with a garage/workshop.
- `ellan-park-22/`: [22 Ellan Park](https://deanwood.im/property/22-ellan-park-ramsey-isle-of-man/), a terrace with a rear extension.
- `laurys-avenue-19/`: [19 Laurys Avenue](https://www.zoopla.co.uk/property-history/19-laurys-avenue/ramsey/isle-of-man/im8-2he/65070128/),
  a detached bungalow with a sun room and a split-level deck.

For the Ellan Park houses, room sizes and positions follow the listing floor plans, and
finishes and furniture follow the listing photos. The Laurys Avenue listing's plan and photos
were not available, so that layout is reasoned from the description alone. Anything a listing
does not show (unphotographed rooms, plot size, roof pitch) is filled in and tagged *Inferred*
in the page.

Built with [three.js](https://threejs.org/) 0.160, loaded from jsDelivr, so there is no build step.
Serve the repo with any static server (for example `npx http-server .`) and open `/tours.html`.
Opening the files directly from disk will not work, because ES modules need HTTP.

- `tour-kit/`: the shared engine. `app.js` (camera, cutaway, UI), `model.js` (walls, doors,
  windows, floors, roof slabs), `furniture.js` (low-poly furniture), `kit.js` (materials,
  procedural textures, geometry helpers), `tour.css`.
- Each house folder: `js/house.js` (wall layout, stairs, roofs, garden, furnishings),
  `js/content.js` (scene list and room notes), `js/main.js` (starts the tour).
