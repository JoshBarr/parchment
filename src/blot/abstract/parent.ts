import Blot, { Position } from './blot';
import LinkedList from '../../collection/linked-list';
import { ShadowParent } from './shadow';
import * as Registry from '../../registry';


class ParentBlot extends Blot implements ShadowParent {
  static blotName = 'parent';

  domNode: HTMLElement;
  parent: ParentBlot;
  children: LinkedList<Blot>;

  constructor(value) {
    super(value);
    this.children = new LinkedList<Blot>();
    this.build();
  }

  appendChild(other: Blot): void {
    this.insertBefore(other);
  }

  build(): void {
    var childNodes = Array.prototype.slice.call(this.domNode.childNodes);
    this.children.empty();
    // Need to be reversed for if DOM nodes already in order
    childNodes.reverse().forEach((node) => {
      var child = Registry.create(node);
      if (child != null) {
        this.insertBefore(child, this.children.head);
      } else if (node.parentNode != null) {
        node.parentNode.removeChild(node);
      }
    });
  }

  deleteAt(index: number, length: number): void {
    if (index === 0 && length === this.getLength()) {
      this.remove();
    } else {
      this.children.forEachAt(index, length, function(child, offset, length) {
        child.deleteAt(offset, length);
      });
    }
  }

  findPath(index: number, inclusive: boolean = false): Position[] {
    var length = this.getLength();
    var [child, offset] = this.children.find(index, inclusive);
    if (child == null) {
      child = this.children.tail;
      offset = child.getLength();
    }
    var pos: Position[] = [{
      blot: this,
      offset: index - offset
    }];
    return pos.concat(child.findPath(offset, inclusive));
  }

  format(name: string, value: any): void {
    if (!value && name === this.statics.blotName) {
      this.unwrap();
    } else {
      super.format(name, value);
    }
  }

  formatAt(index: number, length: number, name: string, value: any): void {
    this.children.forEachAt(index, length, function(child, offset, length) {
      child.formatAt(offset, length, name, value);
    });
  }

  getDescendants<T>(type: any): T[];
  getDescendants<T>(index: number, length: number, type: any): T[];
  getDescendants<T>(index: any, length?: number, type?: any): T[] {
    if (typeof length !== 'number') {
      type = index;
      index = 0;
      length = this.getLength();
    }
    var descendants = [];
    this.children.forEachAt(index, length, function(child) {
      if (child instanceof type) {
        descendants.push(child);
      } else if (child instanceof ParentBlot) {
        descendants = descendants.concat(child.getDescendants<T>(type));
      }
    });
    return descendants;
  }

  getFormat(): Object {
    return {};
  }

  getLength(): number {
    return this.children.reduce(function(memo, child) {
      return memo + child.getLength();
    }, 0);
  }

  insertAt(index: number, value: string, def?: any): void {
    var [child, offset] = this.children.find(index);
    if (child) {
      child.insertAt(offset, value, def);
    } else {
      let blot = (def == null) ? Registry.create('text', value) : Registry.create(value, def);
      this.insertBefore(blot);
    }
  }

  insertBefore(childBlot: Blot, refBlot?: Blot): void {
    if (childBlot.parent != null) {
      childBlot.parent.children.remove(childBlot);
    }
    this.children.insertBefore(childBlot, refBlot);
    if (refBlot != null) {
      var refDomNode = refBlot.domNode;
    }
    if (childBlot.next == null || childBlot.domNode.nextSibling != refDomNode) {
      this.domNode.insertBefore(childBlot.domNode, refDomNode);
    }
    childBlot.parent = this;
  }

  moveChildren(targetParent: ParentBlot, refNode?: Blot): void {
    this.children.forEach((child) => {
      targetParent.insertBefore(child, refNode);
    });
  }

  replace(name: string, value: any): ParentBlot {
    if (name === this.statics.blotName && this.getFormat[name] === value) {
      return this;
    }
    // Implementation very similar to shadow.replace() but vitally important moveChildren
    // happens before remove() for proper merge
    var replacement = Registry.create(name, value);
    this.parent.insertBefore(replacement, this.next);
    this.moveChildren(replacement);
    this.remove();
    return replacement;
  }

  split(index: number, force: boolean = false): Blot {
    if (!force) {
      if (index === 0) return this;
      if (index === this.getLength()) return this.next;
    }
    var after = <ParentBlot>this.clone();
    this.parent.insertBefore(after, this.next);
    this.children.forEachAt(index, this.getLength(), function(child, offset, length) {
      var child = <Blot>child.split(offset, force);
      if (child) {
        after.appendChild(child);
      }
    });
    return after;
  }

  unwrap(): void {
    this.moveChildren(this.parent, this.next);
    this.remove();
  }
}


export default ParentBlot;
