// content.js - scene list and the text shown beside each scene for 19 Laurys Avenue.
// The floor plan and photos were not available, so every size here is an
// estimate from the model; the listing description supplies the rest.

export const PROPERTY = {
  name: '19 Laurys Avenue',
  place: 'Ramsey, Isle of Man IM8 2HE',
  price: '£319,950',
  facts: ['Detached bungalow', '3 bedrooms', '2 bathrooms', '2 receptions'],
  source: 'https://www.zoopla.co.uk/property-history/19-laurys-avenue/ramsey/isle-of-man/im8-2he/65070128/',
  agent: 'Zoopla',
  related: [
    { label: 'Also in Ramsey: 16 Ellan Park', href: '../ellan-park-16/' },
    { label: '22 Ellan Park', href: '../ellan-park-22/' },
  ],
};

const room = (id, room, title, az, extra) => ({ id, kind: 'room', room, title, az, el: 36, ...extra });
const est = 'estimate, no floor plan';

export const VIEWS = [
  {
    id: 'front', kind: 'exterior', group: 'Outside', title: 'Front & driveway', az: -62, el: 30,
    box: [[-8.0, -0.2, -2.0], [9.6, 5.4, 14.4]],
    labels: [
      { text: 'Front door', pos: [-0.4, 1.5, 3.7], go: 'hallway' },
      { text: 'Bedroom 1', pos: [0, 2.3, 10.2], go: 'bedroom-1' },
      { text: 'Kitchen', pos: [6.9, 2.3, 12.4], go: 'kitchen' },
      { text: 'Driveway', pos: [-3.8, 0.1, 13.2] },
      { text: 'Oil tank', pos: [10.8, 1.75, 13.4] },
    ],
    info: {
      eyebrow: 'Outside · front',
      summary: 'A detached, white-rendered bungalow in a cul-de-sac in Ramsey, with a large driveway along one side and a lawn in front.',
      listing: ['Detached extended bungalow, freehold', 'Popular cul-de-sac close to Ramsey\'s amenities and schools', 'Large driveway with parking for two or more vehicles', 'uPVC double glazing throughout', 'Oil-fired central heating'],
      photos: [],
      inferred: ['The listing photos and floor plan could not be reached, so the shape of the house, the hipped roof and the white render are a best guess', 'Drive and front garden sizes', 'The neighbouring bungalows are simplified', 'The cars are there for scale only'],
    },
  },
  {
    id: 'rear', kind: 'exterior', group: 'Outside', title: 'Sun room & deck', az: 118, el: 30,
    box: [[8.4, -1.1, -1.8], [18.5, 5.4, 14.2]],
    labels: [
      { text: 'Sun room', pos: [12.4, 2.4, 4.7], go: 'sun-room' },
      { text: 'Kitchen', pos: [9.0, 2.3, 11.0], go: 'kitchen' },
      { text: 'Lounge', pos: [9.0, 2.6, 0.6], go: 'lounge' },
      { text: 'Upper deck', pos: [14.0, 0.1, 3.0] },
      { text: 'Lower deck', pos: [16.6, -0.4, 1.4] },
      { text: 'Retaining wall', pos: [12.4, -0.5, 12.0] },
    ],
    info: {
      eyebrow: 'Outside · rear',
      summary: 'The sun room opens onto an upper deck at floor level, which steps down to a lower deck and then to the lawn.',
      listing: ['Sun room added by the owner in 2018', 'Extensive split-level raised deck', 'South-facing rear garden'],
      photos: [],
      inferred: ['Deck sizes and the drop of about a metre to the lawn', 'A stone retaining wall where the garden steps down', 'French doors from the sun room to the deck', 'Sun-room roof type and its two roof lights'],
    },
  },
  {
    id: 'garden', kind: 'exterior', group: 'Outside', title: 'South-facing garden', az: -150, el: 32,
    box: [[12.0, -1.1, -1.8], [29.0, 2.6, 14.2]],
    labels: [
      { text: 'Lawn', pos: [22.5, -0.9, 6.0] },
      { text: 'Timber shed', pos: [27.2, 1.5, 11.8] },
      { text: 'Steps down', pos: [17.9, -0.6, 3.0] },
      { text: 'Upper deck', pos: [13.9, 0.1, 8.6] },
    ],
    info: {
      eyebrow: 'Outside · garden',
      summary: 'A lawned garden below the deck, enclosed by fencing, with a timber shed at the far end.',
      listing: ['South-facing rear garden', 'Timber shed'],
      photos: [],
      inferred: ['Garden length of about 11 m beyond the deck', 'Shed size and position', 'Fencing, planting and the tree'],
    },
  },
  {
    id: 'floor-plan', kind: 'floor', floor: 0, group: 'Floor plan', title: 'Floor plan', az: -135, el: 58,
    box: [[-0.4, -0.3, -0.4], [12.6, 2.7, 12.8]],
    info: {
      eyebrow: 'Floor plan · single storey',
      dims: { imp: '≈ 1,260 ft²', met: '≈ 117 m²', note: est },
      summary: 'Everything is on one level. The bedrooms run along the front off an L-shaped hall; the lounge, sun room and kitchen are at the back, facing the garden.',
      listing: ['Three bedrooms, the main one with an en-suite shower room', 'Family bathroom', 'Two reception rooms: the lounge and the sun room', 'The lounge opens into the sun room, which leads to the kitchen'],
      photos: [],
      inferred: ['The whole layout. The listing names the rooms and how the lounge, sun room and kitchen connect, but gives no plan', 'A small utility room for the boiler, between the bathroom and the sun room', 'Ceiling height of 2.4 m'],
    },
  },
  room('hallway', 'hall', 'Hall', 120, {
    group: 'Rooms',
    info: {
      dims: { imp: '≈ 14\'1" × 5\'3" + corridor', met: '≈ 4.3 × 1.6 m', note: est },
      summary: 'The front door opens into a hall that turns along a corridor to the bedrooms, bathroom and kitchen.',
      listing: [],
      photos: [],
      inferred: ['An L-shaped hall that reaches every room without passing through another', 'Glazed doors to the lounge and kitchen', 'A composite front door with an obscure side light'],
    },
  }),
  room('lounge', 'lounge', 'Lounge', -45, {
    group: 'Rooms',
    info: {
      dims: { imp: '≈ 14\'5" × 13\'1"', met: '≈ 4.4 × 4.0 m', note: est },
      summary: 'A spacious lounge with a woodburner, open to the sun room along most of its back wall.',
      listing: ['Spacious lounge', 'Woodburning stove', 'Opens into the sun room'],
      photos: [],
      inferred: ['A stone chimney breast on the gable wall, with the chimney stack above', 'The wide opening to the sun room, where the old back wall was', 'Furniture'],
    },
  }),
  room('sun-room', 'sun', 'Sun room', -110, {
    group: 'Rooms',
    info: {
      dims: { imp: '≈ 23\'0" × 10\'6"', met: '≈ 7.0 × 3.2 m', note: est },
      summary: 'The 2018 addition across the back of the house: a bright second reception room between the lounge, the kitchen and the deck.',
      listing: ['Sun room added by the owner in 2018', 'Second reception room', 'Opens from the lounge and leads to the kitchen'],
      photos: [],
      inferred: ['Rendered dwarf walls with large uPVC windows on three sides', 'French doors to the deck', 'A seating area and a dining table'],
    },
  }),
  room('kitchen', 'kitchen', 'Kitchen', -135, {
    group: 'Rooms',
    info: {
      dims: { imp: '≈ 16\'5" × 13\'1"', met: '≈ 5.0 × 4.0 m', note: est },
      summary: 'A generous modern kitchen at the back corner, with room for a table and a door through to the sun room.',
      listing: ['Modern, generous kitchen', 'Integrated gas hob, oven and extractor hood', 'Integrated fridge freezer and dishwasher', 'Plumbing for a washing machine'],
      photos: [],
      inferred: ['Grey handleless units with pale worktops', 'The run layout, with the sink under a side window', 'A gas hob in a house heated by oil suggests bottled gas; the listing does not say'],
    },
  }),
  room('utility', 'utility', 'Utility room', 45, {
    group: 'Rooms',
    info: {
      dims: { imp: '≈ 7\'3" × 4\'7"', met: '≈ 2.2 × 1.4 m', note: est },
      summary: 'A small room off the kitchen for the boiler and storage.',
      listing: ['Oil-fired central heating', 'New boiler fitted about two years before the sale'],
      photos: [],
      inferred: ['This room is not in the listing. It fills the space between the bathroom and the sun room, and houses the boiler with a flue through the roof'],
    },
  }),
  room('bathroom', 'bath', 'Bathroom', -135, {
    group: 'Rooms',
    info: {
      dims: { imp: '≈ 8\'2" × 7\'3"', met: '≈ 2.5 × 2.2 m', note: est },
      summary: 'The family bathroom, off the corridor in the middle of the house.',
      listing: ['Family bathroom, one of two bathrooms'],
      photos: [],
      inferred: ['A bath with a shower over it, a WC and a vanity basin', 'No window, so an extractor fan'],
    },
  }),
  room('bedroom-1', 'bed1', 'Bedroom 1', -135, {
    group: 'Rooms',
    info: {
      dims: { imp: '≈ 14\'1" × 12\'6"', met: '≈ 4.3 × 3.8 m', note: est },
      summary: 'The main bedroom, at the front corner by the drive, with its own shower room.',
      listing: ['Main bedroom with an en-suite shower room'],
      photos: [],
      inferred: ['Size, position and furniture'],
    },
  }),
  room('en-suite', 'ensuite', 'En-suite', -135, {
    group: 'Rooms',
    info: {
      dims: { imp: '≈ 6\'7" × 5\'11"', met: '≈ 2.0 × 1.8 m', note: est },
      summary: 'A shower room in the corner of the main bedroom.',
      listing: ['En-suite shower room'],
      photos: [],
      inferred: ['A corner shower cubicle, a WC and a vanity basin', 'An obscure-glazed window in the gable'],
    },
  }),
  room('bedroom-2', 'bed2', 'Bedroom 2', -45, {
    group: 'Rooms',
    info: {
      dims: { imp: '≈ 14\'1" × 8\'10"', met: '≈ 4.3 × 2.7 m', note: est },
      summary: 'A double bedroom at the front, on the other side of the hall from the main bedroom.',
      listing: ['One of three bedrooms'],
      photos: [],
      inferred: ['Size, position and furniture'],
    },
  }),
  room('bedroom-3', 'bed3', 'Bedroom 3', -135, {
    group: 'Rooms',
    info: {
      dims: { imp: '≈ 11\'2" × 10\'2"', met: '≈ 3.4 × 3.1 m', note: est },
      summary: 'The third bedroom, between the hall and the main bedroom, set up here as a guest room with a desk.',
      listing: ['One of three bedrooms'],
      photos: [],
      inferred: ['Size, position and furniture'],
    },
  }),
];
