import GLib from "gi://GLib";
import Gio from "gi://Gio";
import St from "gi://St";
import Clutter from 'gi://Clutter?version=15';
import { Extension, gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as main from "resource:///org/gnome/shell/ui/main.js";
import { ResultMeta, SearchProvider} from "./gnome_defs.js"
import PassStoreFileTree from "./store_file_tree.js";
import Pass from "./pass.js";



export default class PassSearchProvider<
    T extends Extension & { _settings: Gio.Settings | null },
> implements SearchProvider {
    _extension: T;
    _clipboard: St.Clipboard;
    _appIcon: Gio.Icon;
    _entryIcon: Gio.Icon;
    _passtoreFileTree: PassStoreFileTree;

    constructor(extension: T) {
        this._extension = extension;
        this._clipboard = St.Clipboard.get_default();
        this._appIcon = Gio.ThemedIcon.new_with_default_fallbacks("password-app-symbolic");
        this._entryIcon = Gio.ThemedIcon.new_with_default_fallbacks("dialog-password-symbolic");
        this._passtoreFileTree = new PassStoreFileTree();
    }

    get appInfo(): Gio.AppInfo | null {
        return null;
    }

    get canLaunchSearch(): boolean {
        return false;
    }

    get id(): string{
        return this._extension.uuid;
    }

    async activateResult(entry: string, _terms: string[]){
        console.log("[PSP]", `activateResult(${entry})`);
        const response = await Pass.getPass(entry, null);
        if(response.status){
            this._clipboard.set_text(St.ClipboardType.CLIPBOARD, response.value);
        }
        main.notify("Pass", response.message);
    }

    launchSearch(terms: string[]): void {
        console.log("[PSP]", `launchSearch([${terms}])`);
    }

    createResultObject(meta: ResultMeta): Clutter.Actor | null {
        console.log("[PSP]", `createResultObject(${meta})`);
        console.debug(`createResultObject(${meta.id})`);
        console.log("[PSP]", `selected ${meta.name}`);
        const actor = new Clutter.Actor();
        actor.add_child(new St.Icon({
            gicon: this._entryIcon,
            icon_size: 150,
        }));
        return actor;
    }

    async getResultMetas(results: string[], cancellable: Gio.Cancellable) : Promise<ResultMeta[]> {
        console.log("[PSP]", `getResultMetas(${results})`);
        return new Promise((resolve, reject) => {
            const cancelledId = cancellable.connect(
                () => reject(Error('Operation Cancelled')));

            const resultMetas: ResultMeta[] = [];

            for(const identifier of results){
                // TODO: check for messages that don't exist, show generic error message
                let meta = this._passtoreFileTree.get(identifier);
                if (meta){
                    //console.log("[PSP]", "Id: " + meta.id);
                    //console.log("[PSP]", "Url: " + meta.previewURL);
                    resultMetas.push({
                        id: `${meta.id}`,
                        name: meta.shortName,
                        description : meta.directory,
                        createIcon: (size) => {
                            console.log(size);
                            const actor = new Clutter.Actor(); 
                            const gicon = Gio.icon_new_for_string(meta.previewURL);
                            const icon = new St.Icon({
                                gicon: gicon,
                                icon_size: size,
                            });
                            actor.add_child(icon);
                            return actor;
                        },
                    });
                }
            }

            cancellable.disconnect(cancelledId);
            if (!cancellable.is_cancelled())
                resolve(resultMetas);
        });
    }


    async getInitialResultSet(terms: string[], cancellable: Gio.Cancellable) : Promise<string[]> {
        console.log("[PSP]", `getInitialResultSet([${terms}])`);
        await this._passtoreFileTree.init(cancellable);
        if(terms.filter(term => term.length >= 2).length > 0){
            return this._passtoreFileTree.find(terms);
        }else{
            return [];
        }
    }

    async getSubsearchResultSet(previousResults: string[], terms: string[], cancellable: Gio.Cancellable): Promise<string[]>{
        console.log("[PSP]", `getSubsearchResultSet`);
        console.log("[PSP]", `previousResults: ${previousResults}`);
        console.log("[PSP]", `terms: ${terms}`);
        if (cancellable.is_cancelled()){
            throw Error('Search Cancelled');
        }
        if(terms.filter(term => term.length >= 2).length > 0){
            return this._passtoreFileTree.find(terms);
        }else{
            return [];
        }
    }

    filterResults(results: string[], maxResults: number) {
        console.log("[PSP]", `filterResults`);
        return results.slice(0, maxResults);
    }
}
