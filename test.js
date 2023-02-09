import assert from 'node:assert';
import { getSchedules } from './index.js';

[
  ['0 * * * *', [{ minute: 0 }]],
  ['* 0 * * *', [{ hour: 0 }]],
  ['* * 1 * *', [{ day: 1 }]],
  ['* * * 1 *', [{ month: 1 }]],
  ['* * * * 0', [{ weekday: 0 }]],
  ['0 0 1 1 0', [
    { weekday: 0, month: 1, day: 1, hour: 0, minute: 0 }
  ]],
  ['0,30 * * * *', [
    { minute: 0 },
    { minute: 30 }
  ]],
  ['* 0,1,2 * * *', [
    { hour: 0 },
    { hour: 1 },
    { hour: 2 }
  ]],
  ['0,30 0,1 * * *', [
    { hour: 0, minute: 0 },
    { hour: 0, minute: 30 },
    { hour: 1, minute: 0 },
    { hour: 1, minute: 30 }
  ]],
  ['0,30 0,1 1,2 * *', [
    { day: 1, hour: 0, minute: 0 },
    { day: 1, hour: 0, minute: 30 },
    { day: 1, hour: 1, minute: 0 },
    { day: 1, hour: 1, minute: 30 },
    { day: 2, hour: 0, minute: 0 },
    { day: 2, hour: 0, minute: 30 },
    { day: 2, hour: 1, minute: 0 },
    { day: 2, hour: 1, minute: 30 }
  ]],
  ['0-9 * * * *', [
    { minute: 0 },
    { minute: 1 },
    { minute: 2 },
    { minute: 3 },
    { minute: 4 },
    { minute: 5 },
    { minute: 6 },
    { minute: 7 },
    { minute: 8 },
    { minute: 9 }
  ]],
  ['0-9/2 * * * *', [
    { minute: 0 },
    { minute: 2 },
    { minute: 4 },
    { minute: 6 },
    { minute: 8 }
  ]],
  ['* */2 * * *', [
    { hour: 0 },
    { hour: 2 },
    { hour: 4 },
    { hour: 6 },
    { hour: 8 },
    { hour: 10 },
    { hour: 12 },
    { hour: 14 },
    { hour: 16 },
    { hour: 18 },
    { hour: 20 },
    { hour: 22 },
  ]],
].forEach(([expression, schedule]) => {
  assert.deepEqual(getSchedules(expression), schedule)
});

console.log('All tests passed');
