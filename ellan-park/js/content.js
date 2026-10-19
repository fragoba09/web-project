// content.js - scene list and the text shown beside each scene.
// Dimensions are quoted from the Giraffe360 floor plans in the listing.

export const PROPERTY = {
  name: '16 Ellan Park',
  place: 'Ramsey, Isle of Man IM8 3NS',
  price: '£339,950',
  facts: ['Semi-detached', '3 bedrooms', '1 bathroom', '961 ft² · 89.5 m²'],
  source: 'https://koopsandco.com/property/ellan-park-ramsey-im8/',
  agent: 'Koops & Co',
};

export const PROVENANCE = {
  plan: { label: 'Floor plan', hint: 'Position or size taken from the floor plan' },
  listing: { label: 'Listing', hint: 'Named in the listing description' },
  photo: { label: 'Photos', hint: 'Seen in the listing photos' },
  inferred: { label: 'Inferred', hint: 'Not shown in the listing; filled in by reasoning' },
};

const room = (id, room, title, az, extra) => ({ id, kind: 'room', room, title, az, el: 36, ...extra });

export const VIEWS = [
  {
    id: 'front', kind: 'exterior', group: 'Outside', title: 'Front & driveway', az: -112, el: 29,
    box: [[-8.6, -0.2, -4.6], [7.7, 9.2, 8.2]],
    labels: [
      { text: 'Porch', pos: [-0.95, 2.75, 0.95], go: 'porch' },
      { text: 'Lounge bay', pos: [-0.35, 2.45, 4.5], go: 'lounge' },
      { text: 'Garage / workshop', pos: [3.2, 3.4, -1.4], go: 'garage' },
      { text: 'Bedroom 3', pos: [0, 4.95, 1.0], go: 'bedroom-3' },
      { text: 'Bedroom 1', pos: [0, 4.95, 4.5], go: 'bedroom-1' },
      { text: 'Driveway', pos: [-5.0, 0.1, -1.6] },
      { text: 'Front garden', pos: [-4.0, 0.1, 4.4] },
    ],
    info: {
      eyebrow: 'Outside · front',
      summary: 'A pebble-dashed semi on a quiet cul-de-sac at the edge of Ramsey town centre, with a gabled porch, a front bay and a single-storey garage/workshop to the side.',
      listing: ['Semi-detached home in a quiet cul-de-sac', 'Front garden and driveway', 'uPVC double glazing and gas central heating', 'Short drive to Ramsey beach, Mooragh Park and the local schools'],
      photos: ['Grey pebble-dash render under a dark tiled roof', 'Gabled porch with a white uPVC door', 'Garage with white glazed patio doors and a lean-to roof', 'Tall conifer hedge on the drive side, timber fencing on the lawn side'],
      inferred: ['Plot width and depth, and the road layout', 'Roof pitch of about 32° and the chimney position', 'The car is there for scale only', 'The attached neighbour is simplified and mirrored'],
    },
  },
  {
    id: 'rear', kind: 'exterior', group: 'Outside', title: 'Rear garden', az: 118, el: 33,
    box: [[5.6, -0.2, -4.6], [19.6, 8.6, 7.0]],
    labels: [
      { text: 'Dining kitchen', pos: [7.25, 2.4, 3.6], go: 'kitchen' },
      { text: 'Rear hallway', pos: [7.25, 2.3, 0.75], go: 'hallway' },
      { text: 'Bedroom 2', pos: [7.25, 4.95, 4.8], go: 'bedroom-2' },
      { text: 'Bathroom', pos: [7.25, 4.95, 2.15], go: 'bathroom' },
      { text: 'Garage door', pos: [6.2, 2.4, -0.9], go: 'garage' },
      { text: 'Patio', pos: [8.8, 0.1, 0.6] },
      { text: 'Lawn', pos: [14.0, 0.1, 2.0] },
      { text: 'Shed', pos: [17.4, 2.5, -2.6] },
    ],
    info: {
      eyebrow: 'Outside · rear',
      summary: 'An enclosed garden behind the house: a paved patio off the kitchen and garage, a lawn and a shed at the far end.',
      listing: ['Enclosed rear garden, suitable for children and pets', 'Garage/workshop reached from the garden by a uPVC door', 'uPVC door from the rear hallway'],
      photos: ['Paved patio with a rattan dining set and a timber bench', 'Striped lawn with planted borders', 'Grey garden shed at the end of a paved path', 'Green-painted fence panels and bunting'],
      inferred: ['Garden depth of about 11 m', 'Shed size and exact border widths'],
    },
  },
  {
    id: 'ground-floor', kind: 'floor', floor: 0, group: 'Floors', title: 'Ground floor', az: -135, el: 52,
    box: [[-2.3, -0.2, -2.9], [7.4, 2.7, 6.5]],
    info: {
      eyebrow: 'Floor plan · ground',
      dims: { imp: '572 ft²', met: '53.2 m²', note: 'including the garage' },
      summary: 'The porch opens into a through lounge, which is open to the dining kitchen. The rear hallway holds the stairs and the garden door, and the garage sits alongside.',
      listing: ['Porch, lounge, dining kitchen and rear hallway', 'Garage/workshop/hobbies room', 'Stairs rise from the rear hallway'],
      photos: [],
      inferred: ['Ceiling height of 2.4 m', 'Wall thicknesses (27 cm outside, 10 to 15 cm inside)'],
    },
  },
  {
    id: 'first-floor', kind: 'floor', floor: 1, group: 'Floors', title: 'First floor', az: -135, el: 52,
    box: [[-0.4, 2.4, -0.4], [7.6, 5.3, 6.6]],
    info: {
      eyebrow: 'Floor plan · first',
      dims: { imp: '389 ft²', met: '36.3 m²' },
      summary: 'Three bedrooms and the bathroom open off a small landing at the top of the stairs.',
      listing: ['Two double bedrooms and a single', 'Family bathroom'],
      photos: [],
      inferred: ['The small enclosed space between the landing and bathroom is shown as a linen cupboard'],
    },
  },
  room('porch', 'porch', 'Porch', 50, {
    group: 'Ground floor',
    info: {
      dims: { imp: '5\'4" × 4\'5"', met: '1.63 × 1.37 m' },
      summary: 'A bright entrance porch with windows on both sides.',
      listing: ['uPVC front door with twin side windows', 'Laminate wood-effect flooring', 'Wall-mounted light and coat hooks', 'Inner door to the lounge'],
      photos: ['Pale grey walls and grey wood-effect floor'],
      inferred: ['Shoe rack and doormat', 'Ceiling height of about 2.3 m under the porch roof'],
    },
  }),
  room('lounge', 'lounge', 'Lounge', 135, {
    group: 'Ground floor',
    info: {
      dims: { imp: '9\'9" × 18\'11"', met: '2.98 × 5.78 m' },
      summary: 'A through room from the front bay to the kitchen, arranged around a log burner.',
      listing: ['Feature bay window to the front', 'Log-burning stove on a tiled hearth', 'Laminate wood-effect flooring', 'Open access to the dining kitchen'],
      photos: ['Floral wallpaper on the chimney breast, with an octagonal mirror', 'Blush velvet sofa and a floral sofa', 'TV on a pine unit, low bookcase and a digital piano', 'Venetian blinds and grey curtains'],
      inferred: ['Furniture positions are approximate', 'Bay depth of about 50 cm'],
    },
  }),
  room('kitchen', 'kitchen', 'Dining kitchen', 135, {
    group: 'Ground floor',
    info: {
      dims: { imp: '11\'6" × 19\'1"', met: '3.52 × 5.83 m' },
      summary: 'A long kitchen with a dining area by the garden windows, open to the lounge across a counter.',
      listing: ['Cream wall and base units', 'Stainless single sink and drainer', 'Space for an American-style fridge freezer', 'Plumbing for a washing machine and space for a tumble dryer', 'Large Kenwood electric range cooker with five-ring hob, double oven and extractor hood', 'uPVC windows overlooking the rear garden', 'Laminate wood flooring and countertop lighting', 'Sliding door to the rear hallway'],
      photos: ['Deep green walls above the units', 'Dining table for four with ladder-back chairs', 'Pink roller blinds', 'A sloped ceiling in the corner where the stairs pass overhead'],
      inferred: ['Exact run lengths and appliance order', 'The sink sits on the counter facing the lounge, where the floor plan draws it'],
    },
  }),
  room('hallway', 'hall', 'Rear hallway & stairs', -25, {
    group: 'Ground floor',
    info: {
      dims: { imp: '2\'5" × 3\'0"', met: '0.76 × 0.93 m' },
      summary: 'A small lobby at the back of the house, with the stairs and the door to the garden.',
      listing: ['uPVC door to the garden', 'High-level cupboard housing the fuse board', 'Stairs to the first floor'],
      photos: ['Geometric wallpaper on the stair wall'],
      inferred: ['A straight 13-riser flight rising towards the front. This matches both floor plans and the low-headroom area under the stairs', 'Laminate flooring carried through from the kitchen'],
    },
  }),
  room('garage', 'garage', 'Garage / workshop', -135, {
    group: 'Ground floor',
    info: {
      dims: { imp: '17\'3" × 7\'9"', met: '5.28 × 2.36 m' },
      summary: 'A heated single-storey room beside the house that could be a garage, workshop, gym or studio.',
      listing: ['uPVC door from the rear garden', 'Patio doors to the front', 'Recessed lighting, laminate flooring, power and heating', 'Large built-in cupboard housing the gas boiler'],
      photos: ['Lean-to roof and white patio doors, seen from outside'],
      inferred: ['There are no interior photos. It is shown as a workshop with a gym corner', 'Recessed lights are not drawn, because ceilings are left off'],
    },
  }),
  room('landing', 'landing', 'Landing', 45, {
    group: 'First floor',
    info: {
      dims: { imp: '6\'7" × 8\'3"', met: '2.02 × 2.52 m' },
      summary: 'The top of the stairs, with doors to all three bedrooms and the bathroom.',
      listing: ['Stairs lead up from the rear hallway'],
      photos: ['Teal walls and geometric wallpaper', 'White radiator cover with a lamp', 'Carpet on the stairs and landing'],
      inferred: ['The small room beside the bathroom is shown as a linen cupboard'],
    },
  }),
  room('bedroom-1', 'bed1', 'Bedroom 1', 135, {
    group: 'First floor',
    info: {
      dims: { imp: '11\'2" × 10\'6"', met: '3.42 × 3.22 m' },
      summary: 'The main double bedroom, at the front of the house.',
      listing: ['Double bedroom with front-aspect views', 'Laminate wood flooring'],
      photos: ['Navy feature wall around the window', 'Blue toile wallpaper on the chimney breast', 'White wardrobe and drawers, alcove shelving'],
      inferred: ['Bed position', 'The chimney breast stacks over the lounge fireplace'],
    },
  }),
  room('bedroom-2', 'bed2', 'Bedroom 2', -135, {
    group: 'First floor',
    info: {
      dims: { imp: '10\'10" × 10\'5"', met: '3.33 × 3.18 m' },
      summary: 'A second double overlooking the garden, currently set up as a home office.',
      listing: ['Double bedroom with rear garden views', 'Laminate flooring', 'Suits a guest room, children\'s room or home office'],
      photos: ['Desk and office chair by the window', 'Grey sofa bed', 'Soft grey textured wallpaper'],
      inferred: ['Furniture layout'],
    },
  }),
  room('bedroom-3', 'bed3', 'Bedroom 3', 135, {
    group: 'First floor',
    info: {
      dims: { imp: '7\'3" × 8\'1"', met: '2.23 × 2.49 m' },
      summary: 'A single room at the front, currently used as a dressing room.',
      listing: ['Single bedroom with front aspect', 'Suits a single bedroom, nursery or dressing room'],
      photos: ['Sage green walls', 'Dressing table with a lit mirror, drawers and a clothes rail'],
      inferred: ['Furniture layout'],
    },
  }),
  room('bathroom', 'bath', 'Bathroom', -45, {
    group: 'First floor',
    info: {
      dims: { imp: '7\'7" × 8\'1"', met: '2.32 × 2.48 m' },
      summary: 'A family bathroom with a P-shaped shower bath under an opaque window.',
      listing: ['P-shaped bath with shower over and glazed screen', 'Tiled surrounds', 'WC and wash hand basin with vanity cupboard', 'Heated towel rail and extractor fan', 'Tile-effect vinyl flooring', 'Opaque uPVC window'],
      photos: ['Grey large-format tiles and a teal accent wall', 'Boxed-in pipework behind the WC'],
      inferred: ['Basin position, taken from the floor-plan symbol', 'A raised plinth where the stairs pass under the floor'],
    },
  }),
];
