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
        console.log("[PSP]", "PassStoreFileTree init");
        let storePath = GLib.build_filenamev([GLib.get_home_dir(), ".password-store"]);
        console.log("[PSP]", `storePath: ${storePath}`);
        let storeRootDir = Gio.File.new_for_path(storePath);
        try{
            if(storeRootDir != null && storeRootDir.query_exists(null)){
                const results: Result[] = [];
                await this.enumerateGpgFiles(storeRootDir, results, cancellable);
                for (const result of results){
                    if(result != null && result.file != null){
                        let path = storeRootDir.get_relative_path(result.file)?.slice(0, -4); // remove .gpg part
                        const parent = result.file.get_parent();
                        if(path != undefined && parent != null){
                            let directory = storeRootDir.get_relative_path(parent);
                            let shortName = result.name.slice(0, -4);
                            console.log("[PSP]", `shortName: ${shortName}`);
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
        }catch(e){
            console.error("[PSP]", `Error: ${e}`);
        }
    }

    find(terms: string[]): string[] {
        console.log("[PSP]", `find([${terms}])`);
        console.log("[PSP]", `entries: ${this._entries}`)
        const found = this._entries.filter(f => terms.every(term => f.includes(term)));
        console.log("[PSP]", `found ${found}`);
        return found;
    }

    get(entry: string) {
        console.log("[PSP]", `find([${entry}])`);
        const file = this._files[entry];
        console.log("[PSP]", `file ${file}`);
        return file;
    }

    async enumerateGpgFiles(dir: Gio.File, results: Result[], cancellable: Gio.Cancellable): Promise<void>{
        const dirname = dir.get_basename();
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
                    console.log("[PSP]", `name: ${name}`);
                    console.log("[PSP]", `dirname: ${dirname}`);
                    const entry = `${dirname}/${name.replace(".gpg", "")}` 
                    console.log("[PSP]", `entry: ${entry}`);
                    results.push({name: entry, file: file});
                }
                else if (type == Gio.FileType.DIRECTORY && !info.get_is_hidden()){
                    await this.enumerateGpgFiles(file, results, cancellable);
                }
            }
        }
    }
}

