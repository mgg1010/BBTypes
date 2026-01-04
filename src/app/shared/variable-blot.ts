import Quill from 'quill';

const Embed = Quill.import('blots/embed') as any;

export class VariableBlot extends Embed {
    static blotName = 'variable';
    static tagName = 'span';
    static className = 'chip';

    static create(value: any) {
        const node = super.create(value);
        node.innerHTML = value.name;
        node.setAttribute('data-variable', JSON.stringify(value));
        // Explicitly adding class to be safe against Quill version quirks
        node.classList.add('chip');
        node.contentEditable = 'false';
        return node;
    }

    static value(node: any) {
        const data = node.getAttribute('data-variable');
        return data ? JSON.parse(data) : null;
    }
}
