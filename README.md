# cron-expression-parser

Parser de expressões cron de **5 campos**:

```text
minuto  hora  dia-do-mês  mês  dia-da-semana
```

## Uso

```js
import { getSchedules, combine, cronRegExp, extract } from 'cron-expression-parser';

getSchedules('0 0 1 * *');
// → [{ month: 1, day: 1, hour: 0, minute: 0 }, … { month: 12, day: 1, hour: 0, minute: 0 }]
```

### API pública

| Export | Descrição |
| --- | --- |
| `getSchedules(expression)` | Parseia a expressão e devolve a lista de schedules |
| `combine(a, b)` | Produto cartesiano de componentes (filtra dias inválidos no mês) |
| `cronRegExp` | RegExp da expressão completa |
| `extract(match, field)` | Expande um campo a partir do match da regexp |

## O que aceita

- Números nos intervalos: minuto `0–59`, hora `0–23`, dia `1–31`, mês `1–12`, weekday `0–6` (domingo–sábado)
- `*` (todos), `*/n` (passo), listas `a,b`, intervalos `a-b`, intervalos com passo `a-b/n`
- Quando **dia-do-mês** e **dia-da-semana** estão ambos restritos (não são `*`), o disparo segue `crontab(5)` (Vixie/cronie): casa se **qualquer** um dos dois campos casar (OR)
- Datas impossíveis no calendário (ex.: `0 0 30 2 *`) são sintaxe válida e devolvem **lista vazia**

## O que não aceita

- Nomes de dia/mês (`MON`, `JAN`, …)
- Macros (`@daily`, `@hourly`, …)
- Extensões `L`, `W`, `#`
- Campo de segundos (6 campos) ou ano
- Weekday `7` (use `0` para domingo)
- Zeros à esquerda (`08`) e step `0`

Expressões inválidas lançam `Error` com mensagem `Wrong pattern: …`.

## Formato da saída

Cada item é um objeto com as chaves presentes na restrição:

```js
{ minute, hour }                 // só tempo
{ weekday, hour, minute }        // dia da semana
{ month, day, hour, minute }     // data no calendário
```

Exemplos:

```js
getSchedules('30 8 * * 1');
// → [{ weekday: 1, hour: 8, minute: 30 }]

getSchedules('0 0 15 3 *');
// → [{ month: 3, day: 15, hour: 0, minute: 0 }]

getSchedules('0 0 1 * 1');
// → [{ weekday: 1, hour: 0, minute: 0 }, { month: 1, day: 1, … }, …]
//    (OR: toda segunda OU todo dia 1)

getSchedules('0 0 30 2 *');
// → []  // 30 de fevereiro não existe
```

## Testes

```bash
npm test
```
