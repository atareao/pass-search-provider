import "@girs/gjs";
import "@girs/gobject";
import "@girs/gjs/dom";
import "@girs/soup-3.0";
import "@girs/clutter-15";
import "@girs/st-15";
import "@girs/gnome-shell/ambient";
import "@girs/gnome-shell/extensions/global";
import { AppSearchProvider } from "resource:///org/gnome/shell/ui/appDisplay.js";
import {
    Extension,
    ExtensionMetadata,
} from "resource:///org/gnome/shell/extensions/extension.js";
import Gio from 'gi://Gio';
import Shell from "gi://Shell";
import GObject from '@girs/gobject-2.0';
import Clutter from 'gi://Clutter?version=15';

/*
declare module "resource:///org/gnome/shell/ui/main.js" {
    export module overview {
        export module searchController {
            export function addProvider(provider: AppSearchProvider): void;
            export function removeProvider(provider: AppSearchProvider): void;
        }
    }
}
*/

declare const global: Global,
    imports: any,
    _: (args: string) => string;

interface Global {
    log(msg: string): void;
    display: Meta.Display;
}

declare namespace Meta {
    interface Display extends GObject.Object {
        get_focus_window(): Meta.Window | null;
    }

    interface Window extends Clutter.Actor {
        minimized: Readonly<boolean>;
        activate(time: number): void;
    }
}

declare module "resource:///org/gnome/shell/extensions/extension.gg" {
    export class Extension {
        constructor(metadata: ExtensionMetadata);
        enable(): void;
        disable(): void;
        get uuid(): string;
        get application(): Shell.App | null;
    }
}

declare module "resource:///org/gnome/shell/ui/appDisplay.js" {
    export interface ResultMeta {
        id: string;
        name: string;
        description?: string;
        createIcon: (size: number) => unknown;
    }

    //export class AppSearchProvider {
    export class AppSearchProvider2 {
        constructor(extension: Extension);

        /**
         * Launch the search result.
         */
        activateResult(result: string, terms: string[]): void;

        /**
         *  Get result metadata.
         */
        getResultMetas(
            results: string[],
            cancellable: Gio.Cancellable,
        ): Promise<ResultMeta[]>;

        /**
         * Initiate a new search.
         *
         * This method is called to start a new search and should return a list of
         * unique identifiers for the results.
         *
         * If cancellable is triggered, this method should throw an error.
         */
        getInitialResultSet(
            terms: string[],
            cancellable: Gio.Cancellable,
        ): Promise<string[]>;

        /**
         * Refine the current search.
         *
         * This method is called to refine the current search results with
         * expanded terms and should return a subset of the original result set.
         *
         * Implementations may use this method to refine the search results more
         * efficiently than running a new search, or simply pass the terms to the
         * implementation of `getInitialResultSet()`.
         *
         * If cancellable is triggered, this method should throw an error.
         */
        getSubsearchResultSet(
            results: string[],
            terms: string[],
            cancellable: Gio.Cancellable,
        ): Promise<string[]>;

        /**
         * Filter the current search.
         *
         * This method is called to truncate the number of search results.
         *
         * Implementations may use their own criteria for discarding results, or
         * simply return the first n-items.
         */
        filterResults(results: string[], maxResults: number): string[];
    }
}

