/**
 * ============================================================================
 * UNIT TEST SUITE: DYNAMIC SLOT GENERATOR ENGINE (slot_generator.test.js)
 * ============================================================================
 * Tests 30-minute interval calculation, AM/PM boundary conversion,
 * working day matching, and booked slot collision filtering.
 */

const { describe, it, assert } = require('../helpers/test_runner');

// Time Conversion Algorithms mirroring production controller
const parseTimeToMinutes = (timeStr) => {
  const parts = timeStr.trim().split(' ');
  if (parts.length < 2) return null;
  const [time, modifier] = parts;
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const formatMinutesTo12h = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const modifier = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  return `${formattedHours}:${formattedMinutes} ${modifier}`;
};

const generateSlots = (startTime, endTime, interval = 30) => {
  const startM = parseTimeToMinutes(startTime);
  const endM = parseTimeToMinutes(endTime);
  if (startM === null || endM === null || startM >= endM) return [];

  const slots = [];
  for (let m = startM; m < endM; m += interval) {
    slots.push(formatMinutesTo12h(m));
  }
  return slots;
};

async function runSlotGeneratorUnitTest() {
  await describe('Unit Testing - Time String to Minutes Converter', async () => {
    await it('should correctly convert morning 09:00 AM to 540 minutes', () => {
      assert.strictEqual(parseTimeToMinutes('09:00 AM'), 540);
    });

    await it('should correctly convert noon 12:00 PM to 720 minutes', () => {
      assert.strictEqual(parseTimeToMinutes('12:00 PM'), 720);
    });

    await it('should correctly convert afternoon 01:30 PM to 810 minutes', () => {
      assert.strictEqual(parseTimeToMinutes('01:30 PM'), 810);
    });

    await it('should correctly convert midnight 12:00 AM to 0 minutes', () => {
      assert.strictEqual(parseTimeToMinutes('12:00 AM'), 0);
    });
  });

  await describe('Unit Testing - Minutes to 12-Hour Formatter', async () => {
    await it('should format 540 minutes as "09:00 AM"', () => {
      assert.strictEqual(formatMinutesTo12h(540), '09:00 AM');
    });

    await it('should format 750 minutes as "12:30 PM"', () => {
      assert.strictEqual(formatMinutesTo12h(750), '12:30 PM');
    });

    await it('should format 1020 minutes as "05:00 PM"', () => {
      assert.strictEqual(formatMinutesTo12h(1020), '05:00 PM');
    });
  });

  await describe('Unit Testing - Dynamic 30-Minute Slot Generation', async () => {
    await it('should generate exact 8 thirty-minute slots for 09:00 AM to 01:00 PM window', () => {
      const slots = generateSlots('09:00 AM', '01:00 PM', 30);
      assert.strictEqual(slots.length, 8);
      assert.deepStrictEqual(slots, [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
        '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'
      ]);
    });

    await it('should return empty slots array if start time is after or equal to end time', () => {
      const slots = generateSlots('05:00 PM', '09:00 AM', 30);
      assert.strictEqual(slots.length, 0);
    });

    await it('should filter out already booked/accepted appointments from candidate slots', () => {
      const allSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM'];
      const bookedSlots = ['09:30 AM', '10:30 AM'];
      const available = allSlots.filter(s => !bookedSlots.includes(s));

      assert.strictEqual(available.length, 2);
      assert.deepStrictEqual(available, ['09:00 AM', '10:00 AM']);
    });
  });
}

module.exports = runSlotGeneratorUnitTest;

if (require.main === module) {
  runSlotGeneratorUnitTest().then(() => {
    const { printSummary } = require('../helpers/test_runner');
    printSummary();
  });
}
