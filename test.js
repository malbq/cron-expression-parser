import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { combine, getSchedules } from './index.js';

function hoursMinutes(hours, minutes) {
  const out = [];
  for (const hour of hours) {
    for (const minute of minutes) {
      out.push({ hour, minute });
    }
  }
  return out;
}

function range(start, end, step = 1) {
  const out = [];
  for (let value = start; value <= end; value += step) {
    out.push(value);
  }
  return out;
}

function assertWrongPattern(expression) {
  assert.throws(
    () => getSchedules(expression),
    (err) =>
      err instanceof Error && err.message === `Wrong pattern: ${expression}`
  );
}

describe('combine', () => {
  it('returns empty for empty inputs', () => {
    assert.deepEqual(combine([], []), []);
  });
});

describe('getSchedules — casos existentes (18)', () => {
  it('* * * * *', () => {
    assert.deepEqual(
      getSchedules('* * * * *'),
      hoursMinutes(range(0, 23), range(0, 59))
    );
  });

  it('0 * * * *', () => {
    assert.deepEqual(
      getSchedules('0 * * * *'),
      range(0, 23).map((hour) => ({ hour, minute: 0 }))
    );
  });

  it('* 0 * * *', () => {
    assert.deepEqual(
      getSchedules('* 0 * * *'),
      range(0, 59).map((minute) => ({ hour: 0, minute }))
    );
  });

  it('0 0 28-31 2 *', () => {
    assert.deepEqual(getSchedules('0 0 28-31 2 *'), [
      { month: 2, day: 28, hour: 0, minute: 0 },
      { month: 2, day: 29, hour: 0, minute: 0 },
    ]);
  });

  it('0 0 28-31 4 *', () => {
    assert.deepEqual(getSchedules('0 0 28-31 4 *'), [
      { month: 4, day: 28, hour: 0, minute: 0 },
      { month: 4, day: 29, hour: 0, minute: 0 },
      { month: 4, day: 30, hour: 0, minute: 0 },
    ]);
  });

  it('0 0 31 * *', () => {
    assert.deepEqual(getSchedules('0 0 31 * *'), [
      { month: 1, day: 31, hour: 0, minute: 0 },
      { month: 3, day: 31, hour: 0, minute: 0 },
      { month: 5, day: 31, hour: 0, minute: 0 },
      { month: 7, day: 31, hour: 0, minute: 0 },
      { month: 8, day: 31, hour: 0, minute: 0 },
      { month: 10, day: 31, hour: 0, minute: 0 },
      { month: 12, day: 31, hour: 0, minute: 0 },
    ]);
  });

  it('0 0 1 * *', () => {
    assert.deepEqual(
      getSchedules('0 0 1 * *'),
      range(1, 12).map((month) => ({ month, day: 1, hour: 0, minute: 0 }))
    );
  });

  it('0 0 * 1,2,4 *', () => {
    const expected = [];
    for (const month of [1, 2, 4]) {
      const maxDay = month === 2 ? 29 : month === 4 ? 30 : 31;
      for (let day = 1; day <= maxDay; day += 1) {
        expected.push({ month, day, hour: 0, minute: 0 });
      }
    }
    assert.deepEqual(getSchedules('0 0 * 1,2,4 *'), expected);
  });

  it('0 * * * 1', () => {
    assert.deepEqual(
      getSchedules('0 * * * 1'),
      range(0, 23).map((hour) => ({ weekday: 1, hour, minute: 0 }))
    );
  });

  it('0 0 1 1 0', () => {
    assert.deepEqual(getSchedules('0 0 1 1 0'), [
      { weekday: 0, hour: 0, minute: 0 },
      { month: 1, day: 1, hour: 0, minute: 0 },
    ]);
  });

  it('0,30 * * * *', () => {
    assert.deepEqual(
      getSchedules('0,30 * * * *'),
      hoursMinutes(range(0, 23), [0, 30])
    );
  });

  it('* 0,1,2 * * *', () => {
    assert.deepEqual(
      getSchedules('* 0,1,2 * * *'),
      hoursMinutes([0, 1, 2], range(0, 59))
    );
  });

  it('0,30 0,1 * * *', () => {
    assert.deepEqual(getSchedules('0,30 0,1 * * *'), [
      { hour: 0, minute: 0 },
      { hour: 0, minute: 30 },
      { hour: 1, minute: 0 },
      { hour: 1, minute: 30 },
    ]);
  });

  it('0,30 0,1 1,2 1 *', () => {
    assert.deepEqual(getSchedules('0,30 0,1 1,2 1 *'), [
      { month: 1, day: 1, hour: 0, minute: 0 },
      { month: 1, day: 1, hour: 0, minute: 30 },
      { month: 1, day: 1, hour: 1, minute: 0 },
      { month: 1, day: 1, hour: 1, minute: 30 },
      { month: 1, day: 2, hour: 0, minute: 0 },
      { month: 1, day: 2, hour: 0, minute: 30 },
      { month: 1, day: 2, hour: 1, minute: 0 },
      { month: 1, day: 2, hour: 1, minute: 30 },
    ]);
  });

  it('0-9 0 * * *', () => {
    assert.deepEqual(
      getSchedules('0-9 0 * * *'),
      range(0, 9).map((minute) => ({ hour: 0, minute }))
    );
  });

  it('0-9/2 1 * * *', () => {
    assert.deepEqual(getSchedules('0-9/2 1 * * *'), [
      { hour: 1, minute: 0 },
      { hour: 1, minute: 2 },
      { hour: 1, minute: 4 },
      { hour: 1, minute: 6 },
      { hour: 1, minute: 8 },
    ]);
  });

  it('10 */2 * * *', () => {
    assert.deepEqual(
      getSchedules('10 */2 * * *'),
      range(0, 22, 2).map((hour) => ({ hour, minute: 10 }))
    );
  });

  it('*/10 */2 * * *', () => {
    assert.deepEqual(
      getSchedules('*/10 */2 * * *'),
      hoursMinutes(range(0, 22, 2), range(0, 50, 10))
    );
  });
});

describe('limites válidos por campo', () => {
  it('aceita minuto 0 e 59', () => {
    assert.deepEqual(getSchedules('0 0 * * *'), [{ hour: 0, minute: 0 }]);
    assert.deepEqual(getSchedules('59 0 * * *'), [{ hour: 0, minute: 59 }]);
  });

  it('aceita hora 0 e 23', () => {
    assert.deepEqual(getSchedules('0 0 * * *'), [{ hour: 0, minute: 0 }]);
    assert.deepEqual(getSchedules('0 23 * * *'), [{ hour: 23, minute: 0 }]);
  });

  it('aceita dia 1, 10, 20 e 31', () => {
    assert.deepEqual(getSchedules('0 0 1 1 *'), [
      { month: 1, day: 1, hour: 0, minute: 0 },
    ]);
    assert.deepEqual(getSchedules('0 0 10 1 *'), [
      { month: 1, day: 10, hour: 0, minute: 0 },
    ]);
    assert.deepEqual(getSchedules('0 0 20 1 *'), [
      { month: 1, day: 20, hour: 0, minute: 0 },
    ]);
    assert.deepEqual(getSchedules('0 0 31 1 *'), [
      { month: 1, day: 31, hour: 0, minute: 0 },
    ]);
  });

  it('aceita mês 1 e 12', () => {
    assert.deepEqual(getSchedules('0 0 1 1 *'), [
      { month: 1, day: 1, hour: 0, minute: 0 },
    ]);
    assert.deepEqual(getSchedules('0 0 1 12 *'), [
      { month: 12, day: 1, hour: 0, minute: 0 },
    ]);
  });

  it('aceita weekday 0 e 6', () => {
    assert.deepEqual(getSchedules('0 0 * * 0'), [
      { weekday: 0, hour: 0, minute: 0 },
    ]);
    assert.deepEqual(getSchedules('0 0 * * 6'), [
      { weekday: 6, hour: 0, minute: 0 },
    ]);
  });
});

describe('entradas inválidas', () => {
  it('rejeita fora dos limites de cada campo', () => {
    for (const expression of [
      '60 0 * * *',
      '0 24 * * *',
      '0 0 0 * *',
      '0 0 32 * *',
      '0 0 1 0 *',
      '0 0 1 13 *',
      '0 0 * * 7',
      '-1 0 * * *',
    ]) {
      assertWrongPattern(expression);
    }
  });

  it('rejeita nomes, macros e extensões não suportadas', () => {
    for (const expression of [
      '0 0 * * MON',
      '0 0 1 JAN *',
      '@daily',
      '0 0 L * *',
      '0 0 1W * *',
      '0 0 * * 1#2',
      '0 0 0 1 * *',
      '30 0 0 * * *',
    ]) {
      assertWrongPattern(expression);
    }
  });

  it('rejeita step zero', () => {
    assertWrongPattern('*/0 * * * *');
    assertWrongPattern('0-10/0 * * * *');
  });
});

describe('steps em campos 1-based (dia, mês)', () => {
  it('0 0 */2 * * começa no dia 1 (sem dia 0)', () => {
    const schedules = getSchedules('0 0 */2 * *');
    assert.equal(
      schedules.some((item) => item.day === 0),
      false
    );
    assert.deepEqual(
      schedules.filter((item) => item.month === 1).map((item) => item.day),
      range(1, 31, 2)
    );
  });

  it('0 0 1 */2 * começa no mês 1 (sem mês 0)', () => {
    assert.deepEqual(
      getSchedules('0 0 1 */2 *').map((item) => item.month),
      range(1, 11, 2)
    );
  });

  it('*/2 em minuto e hora continua começando em 0', () => {
    assert.deepEqual(
      getSchedules('*/15 0 * * *').slice(0, 4),
      [
        { hour: 0, minute: 0 },
        { hour: 0, minute: 15 },
        { hour: 0, minute: 30 },
        { hour: 0, minute: 45 },
      ]
    );
    assert.deepEqual(
      getSchedules('0 */6 * * *').map((item) => item.hour),
      [0, 6, 12, 18]
    );
  });
});

describe('dia do mês OR dia da semana (crontab(5))', () => {
  it('ambos restritos: une schedules de weekday e de day/month', () => {
    assert.deepEqual(getSchedules('0 0 1 * 1'), [
      { weekday: 1, hour: 0, minute: 0 },
      ...range(1, 12).map((month) => ({
        month,
        day: 1,
        hour: 0,
        minute: 0,
      })),
    ]);
  });

  it('só weekday restrito: não gera day/month', () => {
    assert.deepEqual(getSchedules('0 0 * * 1'), [
      { weekday: 1, hour: 0, minute: 0 },
    ]);
  });

  it('só day restrito: não gera weekday', () => {
    assert.deepEqual(
      getSchedules('0 0 15 * *'),
      range(1, 12).map((month) => ({
        month,
        day: 15,
        hour: 0,
        minute: 0,
      }))
    );
  });
});

describe('datas impossíveis', () => {
  it('aceita sintaxe e retorna lista vazia para 30/31 em meses curtos', () => {
    assert.deepEqual(getSchedules('0 0 30 2 *'), []);
    assert.deepEqual(getSchedules('0 0 31 2 *'), []);
    assert.deepEqual(getSchedules('0 0 31 4 *'), []);
    assert.deepEqual(getSchedules('0 0 31 6 *'), []);
    assert.deepEqual(getSchedules('0 0 31 9 *'), []);
    assert.deepEqual(getSchedules('0 0 31 11 *'), []);
  });
});

describe('package exports (self-reference)', () => {
  it('import by package name exposes the public API', async () => {
    const api = await import('cron-expression-parser');
    assert.equal(typeof api.getSchedules, 'function');
    assert.equal(typeof api.combine, 'function');
    assert.equal(typeof api.extract, 'function');
    assert.ok(api.cronRegExp instanceof RegExp);
    assert.deepEqual(api.getSchedules('0 0 1 1 *'), [
      { month: 1, day: 1, hour: 0, minute: 0 },
    ]);
    assert.deepEqual(api.combine([{ hour: 1 }], [{ minute: 30 }]), [
      { hour: 1, minute: 30 },
    ]);
  });
});
