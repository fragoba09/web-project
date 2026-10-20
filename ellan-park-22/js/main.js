// main.js - starts the tour for 22 Ellan Park.
import { startTour } from '../../tour-kit/app.js';
import { buildModel, ROOMS, FLOOR_Y, ROOM_VIEW } from './house.js';
import { VIEWS, PROPERTY } from './content.js';

startTour({
  buildModel, ROOMS, FLOOR_Y, ROOM_VIEW, VIEWS, PROPERTY,
  storageKey: 'ellan-park-22-prefs',
  provenance: { proposed: { label: 'Proposed', hint: 'Not part of the property: a planned addition' } },
});
