import Attributor from './attributor';


function camelize(name: string): string {
  if (name.length === 0) return name;
  var parts = name.split('-');
  var rest = parts.slice(1).map(function(part) {
    if (part.length == 0) return part;
    return part[0].toUpperCase() + part.slice(1);
  }).join('');
  return parts[0] + rest;
}


class StyleAttributor extends Attributor {
  attrName: string;
  keyName: string;

  add(node: HTMLElement, value: string): void {
    node.style[camelize(this.keyName)] = value;
  }

  remove(node: HTMLElement): void {
    node.style[camelize(this.keyName)] = '';
    if (!node.getAttribute('style')) {
      node.removeAttribute('style');
    }
  }

  value(node: HTMLElement): string {
    return node.style[camelize(this.keyName)];
  }
}


export default StyleAttributor;
