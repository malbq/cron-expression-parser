function combine(array1, array2) {
  return array1.flatMap(item1 => array2.map(item2 => ({ ...item1, ...item2 })));
}

console.log(combine([{ h: 1 }, {h:2}], [{ m: 1 }]));