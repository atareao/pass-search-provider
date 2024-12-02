import Gio from "gi://Gio";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import PassSearchProvider from "./provider.js";
import { SearchProvider } from "./gnome_defs.js";

export default class PassSearchProviderExtension extends Extension {
    provider: SearchProvider | null = null;
    _settings: Gio.Settings | null = null;

    enable() {
        console.log("[PSP]", "Enable PassSearchProviderExtension");
        this._settings = this.getSettings();
        this.provider = new PassSearchProvider(this);
        Main.overview.searchController.addProvider(this.provider);
    }

    disable() {
        console.log("[PSP]", "Disable PassSearchProviderExtension");
        this._settings = null;
        if (this.provider) {
            Main.overview.searchController.removeProvider(this.provider);
            this.provider = null;
        }
    }
}

