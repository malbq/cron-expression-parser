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

const p_minute = '[1-5]?\\d';
const p_hour = '(1?\\d|2[0-3])';
const p_day = '([1-2]?[1-9]|3[0-1])';
const p_month = '([1-9]|1[0-2])';
const p_weekday = '[0-6]';

const p_value = '$$';

const p_single = `${p_value}`;
const p_every = `\\*`;
const p_every_step = `\\*/${p_value}`;
const p_list = `${p_value}(,${p_value})+`;
const p_range = `${p_value}-${p_value}`;
const p_range_step = `${p_value}-${p_value}/${p_value}`;

const pattern = `^((?<rangeStep>${p_range_step})|(?<range>${p_range})|(?<list>${p_list})|(?<everyStep>${p_every_step})|(?<every>${p_every})|(?<single>${p_single}))$`;

const minuteExp = new RegExp(pattern.replaceAll(p_value, p_minute));
const hourExp = new RegExp(pattern.replaceAll(p_value, p_hour));
const dayExp = new RegExp(pattern.replaceAll(p_value, p_day));
const monthExp = new RegExp(pattern.replaceAll(p_value, p_month));
const weekdayExp = new RegExp(pattern.replaceAll(p_value, p_weekday));

export const baseExp = /^\S+ \S+ \S+ \S+ \S+$/;

export function getSchedules(cronExp) {
  if (baseExp.exec(cronExp) === null) {
    throwWrongPatternError(cronExp);
  }

  const [minute, hour, day, month, weekday] = cronExp.split(' ');

  let minuteComponents,
    hourComponents,
    dayComponents,
    monthComponents,
    weekdayComponents;
  try {
    minuteComponents = parse(minute, minuteExp, 'minute');
    hourComponents = parse(hour, hourExp, 'hour');
    dayComponents = parse(day, dayExp, 'day');
    monthComponents = parse(month, monthExp, 'month');
    weekdayComponents = parse(weekday, weekdayExp, 'weekday');
  } catch (err) {
    console.error(err);
    throwWrongPatternError(cronExp);
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

export function parse(str, exp, name) {
  const result = exp.exec(str);
  if (result === null) {
    throw new Error();
  }

  let components = [];

  if (result.groups.single) {
    components.push({ [name]: parseInt(result.groups.single) });
  }
  if (result.groups.list) {
    const values = result.groups.list.split(',');
    values.forEach((value) => {
      components.push({ [name]: parseInt(value) });
    });
  }
  if (result.groups.range) {
    const [start, end] = result.groups.range
      .split('-')
      .map((strValue) => parseInt(strValue));
    for (let value = start; value <= end; value += 1) {
      components.push({ [name]: value });
    }
  }
  if (result.groups.rangeStep) {
    const [start, end, step] = result.groups.rangeStep
      .split(/[-\/]/)
      .map((strValue) => parseInt(strValue));
    for (let value = start; value <= end; value += step) {
      components.push({ [name]: value });
    }
  }
  if (result.groups.everyStep) {
    const [, step] = result.groups.everyStep
      .split('/')
      .map((strValue) => parseInt(strValue));
    for (let value = 0; value <= MAX[name]; value += step) {
      components.push({ [name]: value });
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
