import GLib from "gi://GLib";
import Gio from "gi://Gio";

/*
 * Asynchronous programming with GJS
 * https://gjs.guide/guides/gjs/asynchronous-programming.html
 */
Gio._promisify(Gio.File.prototype, "enumerate_children_async",
    "enumerate_children_finish");

export interface PasswordFile {
    shortName: string;
    directory: string;
    file: Gio.File;
}
export interface Result {
    name: string;
    file: Gio.File;
}

export default class PassStoreFileTree {
    _entries: string[];
    _files: any;

    constructor() {
        this._entries = [];
        this._files = {};
    }
    async init(cancellable: Gio.Cancellable){
        let storePath = GLib.build_filenamev([GLib.get_home_dir(), ".password-store"]);
        let storeRootDir = Gio.File.new_for_path(storePath);
        if(!storeRootDir != null && storeRootDir.query_exists()){
            for (const result of await this.enumerateGpgFiles(storeRootDir, [], cancellable)) {
                if(result != null && result.file != null){
                    let path = storeRootDir.get_relative_path(result.file)?.slice(0, -4); // remove .gpg part
                    const parent = result.file.get_parent();
                    if(path != undefined && parent != null){
                        let directory = storeRootDir.get_relative_path(parent);
                        let shortName = result.name.slice(0, -4);
                        this._entries.push(path)
                        this._files[path] = {
                            shortName: shortName,
                            directory: directory,
                            file: result.file
                        };
                    }
                }
            }
        }

    }

    find(terms: string[]) {
        return this._entries.filter(f => terms.every(term => f.includes(term)));
    }

    get(entry: string) {
        return this._files[entry];
    }

    async enumerateGpgFiles(dir: Gio.File, original: Result[], cancellable: Gio.Cancellable): Promise<Result[]>{
        const found = [];
        found.push(...original);
        let enumerator = await dir.enumerate_children_async(
            'standard::name,standard::type',
            Gio.FileQueryInfoFlags.NONE,
            GLib.PRIORITY_DEFAULT,
            cancellable
        );
        let info;
        while ((info = enumerator.next_file(null))) {
            let type = info.get_file_type();
            let name = info.get_name();
            let file = enumerator.get_child(info);
            if (file != null){
                if (type == Gio.FileType.REGULAR && name.endsWith('.gpg')) {
                    found.push({name: name, file: file});
                }
                else if (type == Gio.FileType.DIRECTORY && !info.get_is_hidden()){
                    await this.enumerateGpgFiles(file, found, cancellable);
                }
            }
        }
        return found;
    }
}

