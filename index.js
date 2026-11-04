const MIN = {
  minute: 0,
  hour: 0,
  day: 1,
  month: 1,
  weekday: 0,
};

const MAX = {
  minute: 59,
  hour: 23,
  day: 31,
  month: 12,
  weekday: 6,
};

const MAX_DAY_BY_MONTH = {
  1: 31,
  2: 29,
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31,
};

// Numeric ranges per field (no leading zeros, no names).
const valuePatterns = {
  minute: '([0-9]|[1-5][0-9])',
  hour: '([0-9]|1[0-9]|2[0-3])',
  day: '([1-9]|[12][0-9]|3[01])',
  month: '([1-9]|1[0-2])',
  weekday: '[0-6]',
};

const typePatterns = {
  Single: `#`,
  Every: `\\*`,
  EveryStep: `\\*/#`,
  List: `#(,#)+`,
  Range: `#-#`,
  RangeStep: `#-#/#`,
};

const fieldPatterns = {};

Object.entries(valuePatterns).forEach(([field, valuePattern]) => {
  fieldPatterns[field] =
    '(' +
    Object.entries(typePatterns)
      .map(([type, typePattern]) => `(?<${field}${type}>${typePattern})`)
      .join('|')
      .replaceAll('#', valuePattern) +
    ')';
});

/**
 * Full-string regexp for a 5-field cron expression:
 * minute hour day month weekday
 */
export const cronRegExp = new RegExp(
  `^${fieldPatterns.minute} ${fieldPatterns.hour} ${fieldPatterns.day} ${fieldPatterns.month} ${fieldPatterns.weekday}$`
);

/**
 * Parse a 5-field cron expression into schedule objects.
 *
 * Day-of-month and day-of-week follow crontab(5) (Vixie/cronie):
 * if both are restricted (not `*`), a schedule matches when EITHER
 * field matches (OR). If only one is restricted, that field alone applies.
 *
 * Impossible calendar dates (e.g. `0 0 30 2 *`) are accepted as valid
 * syntax and yield an empty array.
 *
 * @param {string} cronExpression
 * @returns {Array<Record<string, number>>}
 */
export function getSchedules(cronExpression) {
  const result = cronRegExp.exec(cronExpression);
  if (result === null) {
    throwWrongPatternError(cronExpression);
  }

  let minuteComponents,
    hourComponents,
    dayComponents,
    monthComponents,
    weekdayComponents;
  try {
    minuteComponents = extract(result, 'minute');
    hourComponents = extract(result, 'hour');
    dayComponents = extract(result, 'day');
    monthComponents = extract(result, 'month');
    weekdayComponents = extract(result, 'weekday');
  } catch {
    throwWrongPatternError(cronExpression);
  }

  if (minuteComponents.length === 0) {
    for (let minute = MIN.minute; minute <= MAX.minute; minute += 1) {
      minuteComponents.push({ minute });
    }
  }

  if (hourComponents.length === 0) {
    for (let hour = MIN.hour; hour <= MAX.hour; hour += 1) {
      hourComponents.push({ hour });
    }
  }

  if (monthComponents.length > 0 && dayComponents.length === 0) {
    for (let day = MIN.day; day <= MAX.day; day += 1) {
      dayComponents.push({ day });
    }
  }

  if (dayComponents.length > 0 && monthComponents.length === 0) {
    for (let month = MIN.month; month <= MAX.month; month += 1) {
      monthComponents.push({ month });
    }
  }

  const schedules = [];

  // Neither day-of-month nor weekday nor month restricted → time-only schedules.
  if (
    weekdayComponents.length === 0 &&
    dayComponents.length === 0 &&
    monthComponents.length === 0
  ) {
    schedules.push(...combine(hourComponents, minuteComponents));
  }

  // crontab(5): when both DOM and DOW are restricted, fire on OR of the two.
  if (weekdayComponents.length > 0) {
    schedules.push(
      ...combine(weekdayComponents, combine(hourComponents, minuteComponents))
    );
  }
  if (dayComponents.length > 0 || monthComponents.length > 0) {
    schedules.push(
      ...combine(
        monthComponents,
        combine(dayComponents, combine(hourComponents, minuteComponents))
      )
    );
  }

  return schedules;
}

function throwWrongPatternError(expression) {
  throw new Error(`Wrong pattern: ${expression}`);
}

/**
 * Expand one cron field match group into component objects.
 * @param {RegExpExecArray} result
 * @param {'minute'|'hour'|'day'|'month'|'weekday'} field
 */
export function extract(result, field) {
  const components = [];

  const single = result.groups[`${field}Single`];
  const list = result.groups[`${field}List`];
  const range = result.groups[`${field}Range`];
  const rangeStep = result.groups[`${field}RangeStep`];
  const everyStep = result.groups[`${field}EveryStep`];

  if (single) {
    components.push({ [field]: parseInt(single, 10) });
  } else if (list) {
    const values = list.split(',');
    values.forEach((value) => {
      components.push({ [field]: parseInt(value, 10) });
    });
  } else if (range) {
    const [start, end] = range.split('-').map((strValue) => parseInt(strValue, 10));
    for (let value = start; value <= end; value += 1) {
      components.push({ [field]: value });
    }
  } else if (rangeStep) {
    const [start, end, step] = rangeStep
      .split(/[-\/]/)
      .map((strValue) => parseInt(strValue, 10));
    if (!Number.isFinite(step) || step < 1) {
      throw new Error(`Invalid step in ${field}: ${rangeStep}`);
    }
    for (let value = start; value <= end; value += step) {
      components.push({ [field]: value });
    }
  } else if (everyStep) {
    const [, step] = everyStep.split('/').map((strValue) => parseInt(strValue, 10));
    if (!Number.isFinite(step) || step < 1) {
      throw new Error(`Invalid step in ${field}: ${everyStep}`);
    }
    // Fields whose natural minimum is 1 (day, month) must not emit 0.
    for (let value = MIN[field]; value <= MAX[field]; value += step) {
      components.push({ [field]: value });
    }
  }

  return components;
}

/**
 * Cartesian product of two component arrays, dropping impossible day/month pairs.
 * @param {Array<Record<string, number>>} array1
 * @param {Array<Record<string, number>>} array2
 */
export function combine(array1, array2) {
  const _array1 = array1.length > 0 ? array1 : [{}];
  const _array2 = array2.length > 0 ? array2 : [{}];
  return _array1
    .flatMap((item1) =>
      _array2.map((item2) => {
        if (
          item1.month !== undefined &&
          item2.day > MAX_DAY_BY_MONTH[item1.month]
        ) {
          return {};
        }
        if (
          item2.month !== undefined &&
          item1.day > MAX_DAY_BY_MONTH[item2.month]
        ) {
          return {};
        }
        return { ...item1, ...item2 };
      })
    )
    .filter((item) => Object.keys(item).length > 0);
}
