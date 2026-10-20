// content.js - scene list and the text shown beside each scene for 22 Ellan Park.
// Dimensions are quoted from the Metropix floor plan in the listing.

export const PROPERTY = {
  name: '22 Ellan Park',
  place: 'Ramsey, Isle of Man IM8 3NS',
  price: '£339,950',
  facts: ['Terraced', '3 bedrooms', 'Bathroom + WC', '1,096 ft² · 101.9 m²'],
  source: 'https://deanwood.im/property/22-ellan-park-ramsey-isle-of-man/',
  agent: 'DeanWood',
  related: [{ label: 'Also on Ellan Park: No. 16', href: '../ellan-park-16/' }],
};

const room = (id, room, title, az, extra) => ({ id, kind: 'room', room, title, az, el: 36, ...extra });

export const VIEWS = [
  {
    id: 'front', kind: 'exterior', group: 'Outside', title: 'Front & driveway', az: -118, el: 28,
    box: [[-8.4, -0.2, -2.2], [7.8, 7.8, 8.6]],
    labels: [
      { text: 'Kitchen', pos: [0, 2.35, 1.95], go: 'kitchen' },
      { text: 'Hall', pos: [-0.75, 2.95, 4.95], go: 'hallway' },
      { text: 'Bedroom 1', pos: [0, 4.95, 1.8], go: 'bedroom-1' },
      { text: 'Bathroom', pos: [0, 4.95, 4.65], go: 'bathroom' },
      { text: 'Driveway', pos: [-3.6, 0.1, 3.9] },
    ],
    info: {
      eyebrow: 'Outside · front',
      summary: 'A painted terraced house in a quiet road close to Ramsey town centre, with a block-paved driveway across the whole frontage.',
      listing: ['Three-bedroom terraced family home', 'Generous driveway with ample off-road parking', 'Electric vehicle charging point', 'Freehold, with gas central heating', 'Close to Ramsey town centre, shops, schools and amenities'],
      photos: ['Pale grey render with anthracite windows and front door', 'Small gabled canopy over the front door', 'Block-paved drive between weathered timber fences'],
      inferred: ['Drive depth of about 6.4 m and the road layout', 'Roof pitch of about 25°', 'The neighbouring houses are simplified and mirrored', 'The car is there for scale only'],
    },
  },
  {
    id: 'rear', kind: 'exterior', group: 'Outside', title: 'South-facing garden', az: 116, el: 31,
    box: [[6.9, -0.4, -1.0], [23.0, 7.4, 7.3]],
    labels: [
      { text: 'Living room', pos: [11.5, 2.2, 2.3], go: 'living-room' },
      { text: 'Back door', pos: [11.5, 3.35, 5.4] },
      { text: 'Bedroom 2', pos: [7.35, 4.95, 1.8], go: 'bedroom-2' },
      { text: 'Bedroom 3', pos: [7.35, 4.95, 5.05], go: 'bedroom-3' },
      { text: 'Patio', pos: [11.9, -0.2, 4.4] },
      { text: 'Lawn', pos: [16.5, -0.2, 2.6] },
      { text: 'Swing', pos: [14.2, 2.15, 1.9] },
      { text: 'Garden studio', pos: [21.0, 2.95, 1.81], go: 'garden-studio' },
    ],
    info: {
      eyebrow: 'Outside · rear',
      summary: 'A long, south-facing garden behind the living-room extension, with a patio, a path down one side and a lawn.',
      listing: ['Good-sized south-facing rear garden', 'Ideal for outdoor dining, entertaining and summer barbecues'],
      photos: ['Single-storey extension with French doors', 'Navy cottage-style back door under a small gable', 'Artificial lawn, concrete side path and timber fencing', 'Garden swing and a storage box'],
      inferred: ['Garden length of about 11 m', 'Extension roof pitch and eaves height'],
      proposed: ['A garden studio in the far corner, across the lawn from the side path'],
    },
  },
  {
    id: 'garden-studio', kind: 'exterior', group: 'Outside', title: 'Garden studio', az: -62, el: 30,
    box: [[17.4, -0.4, -0.2], [22.6, 3.0, 4.6]],
    labels: [
      { text: 'Garden studio', pos: [21.0, 2.95, 1.81] },
      { text: 'Side path', pos: [18.6, -0.2, 5.7] },
    ],
    info: {
      eyebrow: 'Outside · proposed addition',
      dims: { imp: '9\'10" × 7\'4"', met: '3.02 × 2.23 m', note: 'external footprint' },
      summary: 'A Shire Superlap garden studio at the far end of the garden, across the lawn from the side path, with its doors facing the house. It is not part of the property.',
      proposed: [
        'Shire 10 × 7 ft Superlap garden studio, £2,989 on B&Q\'s website (diy.com)',
        'Apex roof: 2.13 m to the eaves, 2.55 m to the ridge',
        'Glazed double doors (1.42 × 1.81 m) and two opening windows on the long side',
        'Inside: 2.88 × 2.09 m, about 6 m² of floor',
      ],
      inferred: ['Honey-stained cladding, anthracite trim and a felt roof, as in the product photos', 'Set about 0.35 m in from the back and side fences, on a slab base', 'The swing has moved nearer the house so the studio doors can open'],
    },
  },
  {
    id: 'ground-floor', kind: 'floor', floor: 0, group: 'Floors', title: 'Ground floor', az: -135, el: 55,
    box: [[-0.3, -0.4, -0.3], [11.7, 2.7, 6.6]],
    info: {
      eyebrow: 'Floor plan · ground',
      dims: { imp: '651 ft²', met: '60.4 m²' },
      summary: 'The front door opens into a hall with the stairs and a WC. The kitchen is at the front, the dining room in the middle and the living room in the rear extension.',
      listing: ['Kitchen, separate dining room and rear living room', 'Downstairs WC'],
      photos: ['The living room is one step down from the dining room'],
      inferred: ['Ceiling height of 2.4 m', 'The hall is not dimensioned on the plan, so its size is scaled from the drawing'],
    },
  },
  {
    id: 'first-floor', kind: 'floor', floor: 1, group: 'Floors', title: 'First floor', az: -135, el: 55,
    box: [[-0.3, 2.4, -0.3], [7.7, 5.3, 6.6]],
    info: {
      eyebrow: 'Floor plan · first',
      dims: { imp: '446 ft²', met: '41.4 m²' },
      summary: 'Two doubles, a single and the family bathroom around a small landing, with a storage cupboard.',
      listing: ['Three bedrooms', 'Family bathroom'],
      photos: [],
      inferred: ['The plan labels every bedroom "Bedroom", so they are numbered here by size'],
    },
  },
  room('kitchen', 'kitchen', 'Kitchen', 45, {
    group: 'Ground floor',
    info: {
      dims: { imp: '12\'0" × 11\'10"', met: '3.66 × 3.61 m' },
      summary: 'A bright kitchen at the front of the house, open to the dining room.',
      listing: ['Separate kitchen', 'Light and airy accommodation'],
      photos: ['Duck-egg blue shaker units with glazed wall cabinets', 'Light oak worktops and white metro tiles', 'White ceramic sink with a brass tap under the front window', 'Stainless range cooker under a chimney hood', 'Freestanding fridge freezer and a tall vertical radiator'],
      inferred: ['Exact run lengths and appliance positions'],
    },
  }),
  room('hallway', 'hall', 'Hall & stairs', -150, {
    group: 'Ground floor',
    info: {
      dims: { imp: '≈ 6\'7" × 7\'3"', met: '≈ 2.0 × 2.2 m', note: 'scaled from the plan' },
      summary: 'The entrance hall, with the stairs rising along the party wall and doors to the WC and kitchen.',
      listing: [],
      photos: ['Grey carpeted stairs with a white slatted screen', 'Under-stairs cupboard', 'Column radiator by the front door and a round brass mirror', 'Light oak-effect floor'],
      inferred: ['A straight 13-riser flight rising towards the back, over the WC. This fits both floor plans', 'The kitchen doorway has no door, as drawn on the plan'],
    },
  }),
  room('wc', 'wc', 'Downstairs WC', -135, {
    group: 'Ground floor',
    info: {
      dims: { imp: '6\'6" × 3\'5"', met: '1.98 × 1.04 m' },
      summary: 'A cloakroom WC tucked under the stairs, behind the hall.',
      listing: ['Downstairs WC'],
      photos: ['White metro tiles with dark grout under a deep green wall', 'Vessel basin on a tiled shelf, brass taps and a round brass mirror', 'Wall-hung WC'],
      inferred: ['The stairs pass overhead, so one end has a sloping ceiling'],
    },
  }),
  room('dining-room', 'dining', 'Dining room', -45, {
    group: 'Ground floor',
    info: {
      dims: { imp: '17\'9" × 9\'10"', met: '5.41 × 3.00 m' },
      summary: 'The middle room of the house, between the kitchen and the living room.',
      listing: ['Separate dining room', 'Flexible layout, for example a home office'],
      photos: ['White marble fire surround with a TV above', 'Arched alcove shelving either side', 'Glazed double doors and an arched internal window to the living room', 'Herringbone oak table with tan chairs, also used as a desk'],
      inferred: ['The plan does not say whether the fireplace is in working order'],
    },
  }),
  room('living-room', 'living', 'Living room', -135, {
    group: 'Ground floor',
    info: {
      dims: { imp: '18\'8" × 12\'7"', met: '5.69 × 3.84 m' },
      summary: 'The rear extension: a wide room opening onto the garden.',
      listing: ['Living room to the rear, overlooking the garden', 'An ideal space to relax or entertain'],
      photos: ['French doors and a separate door to the garden', 'Taupe velvet corner sofa, glass coffee table and mustard accents', 'Panelled walls with a dado rail and brass wall lights', 'One step down from the dining room'],
      inferred: ['Furniture positions are approximate'],
    },
  }),
  room('landing', 'landing', 'Landing', -135, {
    group: 'First floor',
    info: {
      dims: { imp: '≈ 5\'7" × 8\'2"', met: '≈ 1.7 × 2.5 m', note: 'scaled from the plan' },
      summary: 'The top of the stairs, with doors to the three bedrooms, the bathroom and a storage cupboard.',
      listing: [],
      photos: ['Beige carpet and a white spindle balustrade', 'White six-panel doors'],
      inferred: ['The storage cupboard is shown with shelving'],
    },
  }),
  room('bedroom-1', 'bed1', 'Bedroom 1', 45, {
    group: 'First floor',
    info: {
      dims: { imp: '11\'8" × 10\'5"', met: '3.56 × 3.18 m' },
      summary: 'The largest bedroom, at the front of the house.',
      listing: ['One of three bedrooms'],
      photos: [],
      inferred: ['There is no photo of this room. It is furnished as a main bedroom with a double bed and wardrobe', 'Carpet assumed to match the other bedrooms'],
    },
  }),
  room('bedroom-2', 'bed2', 'Bedroom 2', -45, {
    group: 'First floor',
    info: {
      dims: { imp: '10\'11" × 10\'4"', met: '3.32 × 3.15 m' },
      summary: 'A second double at the back, overlooking the garden.',
      listing: ['One of three bedrooms'],
      photos: ['Double bed with a mirrored bedside chest', 'TV in the alcove beside the chimney breast', 'Pink accent chair and a brass mirror'],
      inferred: ['Matched to this room by the chimney breast, which sits over the dining-room fireplace'],
    },
  }),
  room('bedroom-3', 'bed3', 'Bedroom 3', -135, {
    group: 'First floor',
    info: {
      dims: { imp: '8\'2" × 7\'5"', met: '2.48 × 2.27 m' },
      summary: 'The smallest bedroom, at the back, currently a dressing room.',
      listing: ['One of three bedrooms'],
      photos: ['Two-tone pink and white walls', 'Mirrored dressing table under the window', 'Large ornate floor mirror and a white wardrobe'],
      inferred: ['Furniture positions are approximate'],
    },
  }),
  room('bathroom', 'bath', 'Bathroom', 135, {
    group: 'First floor',
    info: {
      dims: { imp: '8\'1" × 7\'10"', met: '2.46 × 2.39 m' },
      summary: 'The family bathroom at the front, over the hall.',
      listing: ['Family bathroom'],
      photos: ['Warm beige large-format tiles', 'Bath with a frosted screen and handheld shower', 'Wall-hung WC and basin, with a round brass mirror', 'Tiled ledge under the window'],
      inferred: ['Fixture positions read from a single photo'],
    },
  }),
];
