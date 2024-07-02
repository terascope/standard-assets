import Tag from './tag.js';

export default class Plugin {
    init(): { tag: typeof Tag } {
        return {
            tag: Tag,
        };
    }
}
