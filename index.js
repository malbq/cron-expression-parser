import assert from 'node:assert'

const mi = '[1-5]?\d'
const h = '(1?\d|2[0-3])'
const d = '([1-2]?\d|3[0-1])'
const mo = '([1-9]|1[0-2])'
const wd = '[0-6]'

const p = '(\*|($$,?)+|\*\/$$|$$-$$)'

export const cronExpressionPattern = /^([\d,]+) ([\d,]+) \* \* \*$/

export function getSchedules(cron) {
  const match = cronExpressionPattern.exec(cron)

  if (match === null) {
    throw new Error(`Wrong pattern: ${cron}`)
  }

  const minutes = match[1].split(',')
  console.log(minutes)
  const hours = match[2].split(',')
  
  let schedules = hours.map(hour => ({
    hour: parseInt(hour),
    minute: parseInt(minute)
  }))

  return schedules
}

function combine(array1, array2) {
  return array1.flatMap(item1 => array2.map(item2 => `${item1}${item2}`))
}

[
  ['0 0 * * *', [
    { hour: 0, minute: 0 }
  ]],
  ['0,30 0 * * *', [
    { hour: 0, minute: 0 },
    { hour: 0, minute: 30 }
  ]],
  ['0 0,1 * * *', [
    { hour: 0, minute: 0 },
    { hour: 1, minute: 0 }
  ]],
  ['0,30 0,1 * * *', [
    { hour: 0, minute: 0 },
    { hour: 0, minute: 30 },
    { hour: 1, minute: 0 },
    { hour: 1, minute: 30 }
  ]],
  ['0 0 1 1 *', [
    { month: 1, day: 1, hour: 0, minute: 0 }
  ]],
  ['0 0 * * 0', [
    { weekday: 0, hour: 0, minute: 0 }
  ]],
].forEach(([expression, schedule]) => {
  assert.deepEqual(getSchedules(expression), schedule)
})
