import GLib from "gi://GLib";
import Gio from "gi://Gio";
import St from "gi://St";
import Shell from "gi://Shell";
import Clutter from 'gi://Clutter?version=15';
import { Extension, gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import { ResultMeta, SearchProvider} from "./gnome_defs.js"
import { Pass, PassImage }  from "./pixabay.js";
import {PassStoreFileTree, PasswordFile} from "./store_file_tree.js";



export default class PassSearchProvider<
    T extends Extension & { _settings: Gio.Settings | null },
> implements SearchProvider {
    _extension: T;
    _clipboard: St.Clipboard;
    _appIcon: Gio.Icon;
    _entryIcon: Gio.Icon;
    _passtoreFileTree: PassStoreFileTree;

    _pixabayClient: Pass;
    _timeoutId: any;
    _timeout: number;
    _results: Map<string, PassImage>;
    _messages: Map<string, Object>;
    app: Shell.App | null = null;

    constructor(extension: T) {
        this._extension = extension;
        this._clipboard = St.Clipboard.get_default();
        this._appIcon = Gio.ThemedIcon.new_with_default_fallbacks("password-app-symbolic");
        this._entryIcon = Gio.ThemedIcon.new_with_default_fallbacks("dialog-password-symbolic");
        this._passtoreFileTree = new PassStoreFileTree();
        this._results = new Map();
        this._timeout = 0;
        this._timeoutId = 0;
        this._messages = new Map<string, ResultMeta>();
        this._messages.set("__loading__", {id: "__loading__", name: _("Pass"), description: _("Loading images from Pass, please wait...")});
        this._messages.set("__error__", {id: "__error__", name: _("Pass"), description: _("Oops, an error occurred while searching.")});
        this._messages.set("__nothing_found__", {id: "__nothing_found__", name: _("Pass"), description: _("Oops, I didn't found what you are looking for")});
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

    activateResult(result: string, _terms: string[]){
        console.log("[PSP]", `activateResult(${result})`);
        const image = this._results.get(result);
        if(image !== undefined){
            GLib.spawn_command_line_async(`xdg-open ${image.pageURL}`);
        }
    }

    launchSearch(terms: string[]): void {
        console.log("[PSP]", `launchSearch([${terms}])`);
        
    }

    createResultObject(meta: ResultMeta): Clutter.Actor | null {
        console.log("[PSP]", `createResultObject(${meta})`);
        console.debug(`createResultObject(${meta.id})`);
        const selected = this._results.get(meta.id);
        if(selected){
            console.log("[PSP]", `selected ${meta.name}`);
            let actor = new Clutter.Actor();
            let gicon = Gio.icon_new_for_string(selected.previewURL);
            let icon = new St.Icon({gicon: gicon,
                                    style_class: 'youtube-icon'});
            icon.set_icon_size(150);
            actor.add_child(icon);
            return actor;
        }
        return null;
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
        await this._passtoreFileTree.init();
        if(terms.filter(term => term.length >= 2).length > 0){
            this._passtoreFileTree.find(terms);
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
        return this.getInitialResultSet(terms, cancellable);
    }

    filterResults(results: string[], maxResults: number) {
        console.log("[PSP]", `filterResults`);
        return results.slice(0, maxResults);
    }

    showMessage(identifier: string, callback: Function){
        console.log("[PSP]", `showMessage`);
        callback([identifier]);
    }
}
