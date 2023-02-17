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

const valuePatterns = {
  minute: '[1-5]?\\d',
  hour: '(1?\\d|2[0-3])',
  day: '([1-2]?[1-9]|3[0-1])',
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

export const cronRegExp = new RegExp(
  `^${fieldPatterns.minute} ${fieldPatterns.hour} ${fieldPatterns.day} ${fieldPatterns.month} ${fieldPatterns.weekday}$`
);

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
  } catch (err) {
    console.error(err);
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

  if (
    weekdayComponents.length === 0 &&
    dayComponents.length === 0 &&
    monthComponents.length === 0
  ) {
    schedules.push(...combine(hourComponents, minuteComponents));
  }
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

export function extract(result, field) {
  const components = [];

  const single = result.groups[`${field}Single`];
  const list = result.groups[`${field}List`];
  const range = result.groups[`${field}Range`];
  const rangeStep = result.groups[`${field}RangeStep`];
  const everyStep = result.groups[`${field}EveryStep`];

  if (single) {
    components.push({ [field]: parseInt(single) });
  } else if (list) {
    const values = list.split(',');
    values.forEach((value) => {
      components.push({ [field]: parseInt(value) });
    });
  } else if (range) {
    const [start, end] = range.split('-').map((strValue) => parseInt(strValue));
    for (let value = start; value <= end; value += 1) {
      components.push({ [field]: value });
    }
  } else if (rangeStep) {
    const [start, end, step] = rangeStep
      .split(/[-\/]/)
      .map((strValue) => parseInt(strValue));
    for (let value = start; value <= end; value += step) {
      components.push({ [field]: value });
    }
  } else if (everyStep) {
    const [, step] = everyStep.split('/').map((strValue) => parseInt(strValue));
    for (let value = 0; value <= MAX[field]; value += step) {
      components.push({ [field]: value });
    }
  }

  return components;
}

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
