
import Tag from './tag';

export default class Plugin {
    init() {
        return {
            tag: Tag,
        };
    }
}
