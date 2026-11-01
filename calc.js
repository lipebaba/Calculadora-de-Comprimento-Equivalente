/* Motor independente da interface. Valores em metros, sem arredondamento intermediário. */
function calculate(items, diameter, data) {
  if (!Number.isInteger(diameter) || diameter < 0 || diameter >= data.diameters.length) throw Error('Diâmetro inválido.');
  let accessories = 0, straight = 0;
  const lines = items.map(item => {
    const c = data.components.find(c => c.id === item.id);
    if (!c) throw Error('Componente não encontrado.');
    const isStraight = c.name === 'Trecho Reto';
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 1000000 || (!isStraight && !Number.isInteger(item.quantity))) throw Error('Informe uma quantidade válida (até 1.000.000).');
    const unit = c.values[diameter], total = unit * item.quantity;
    if (isStraight) straight += total; else accessories += total;
    return {...item, component:c, unit, total, isStraight};
  });
  return {lines, accessories, straight, total:accessories + straight};
}
if (typeof module !== 'undefined') module.exports = {calculate};
