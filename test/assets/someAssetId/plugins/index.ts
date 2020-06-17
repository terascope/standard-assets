import Tag from './tag';

export default class Plugin {
    init(): { tag: typeof Tag } {
        return {
            tag: Tag,
        };
    }
}
