// main.js - starts the tour for 19 Laurys Avenue.
import { startTour } from '../../tour-kit/app.js';
import { buildModel, ROOMS, FLOOR_Y, ROOM_VIEW } from './house.js';
import { VIEWS, PROPERTY } from './content.js';

startTour({
  buildModel, ROOMS, FLOOR_Y, ROOM_VIEW, VIEWS, PROPERTY,
  storageKey: 'laurys-avenue-19-prefs',
  sources: ['listing', 'inferred'],
});
