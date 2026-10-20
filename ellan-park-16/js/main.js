// main.js - starts the tour for 16 Ellan Park.
import { startTour } from '../../tour-kit/app.js';
import { buildModel, ROOMS, FLOOR_Y, ROOM_VIEW } from './house.js';
import { VIEWS, PROPERTY } from './content.js';

startTour({ buildModel, ROOMS, FLOOR_Y, ROOM_VIEW, VIEWS, PROPERTY, storageKey: 'ellan-park-16-prefs' });
