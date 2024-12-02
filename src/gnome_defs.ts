import Gio from 'gi://Gio';
import GObject from '@girs/gobject-2.0';
import Clutter from 'gi://Clutter?version=15';

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


export interface ResultMeta {
    id: string;
    name: string;
    description?: string;
    clipboardText?: string;
    createIcon?: (size: number) => Clutter.Actor;
}

export interface SearchProvider {
    /**
    * The application of the provider.
    *
    * Applications will return a `Gio.AppInfo` representing themselves.
    * Extensions will usually return `null`.
    */
    get appInfo(): Gio.AppInfo | null;
    /**
    * Whether the provider offers detailed results.
    *
    * Applications will return `true` if they have a way to display more
    * detailed or complete results. Extensions will usually return `false`.
    */
    get canLaunchSearch(): boolean;
    /**
    * The unique ID of the provider.
    *
    * Applications will return their application ID. Extensions will usually
    * return their UUID.
    */
    get id(): string;
    /**
    * Launch the search result.
    *    
    * This method is called when a search provider result is activated.
    */
    activateResult(result: string, terms: string[]): void;
    /**
    * Launch the search provider.
    *
    * This method is called when a search provider is activated. A provider can
    * only be activated if the `appInfo` property holds a valid `Gio.AppInfo`
    * and the `canLaunchSearch` property is `true`.
    */
    launchSearch(terms: string[]): void;
    /**
    * Create a result object.
    *
    * This method is called to create an actor to represent a search result.
    */
    createResultObject(meta: ResultMeta): Clutter.Actor | null;
    /**
    * Get result metadata.
    *
    * This method is called to get a `ResultMeta` for each identifier.
    */
    getResultMetas(results: string[], cancellable: Gio.Cancellable): Promise<ResultMeta[]>;
    /**
    * Initiate a new search.
    *
    * This method is called to start a new search and should return a list of
    * unique identifiers for the results.
    */
    getInitialResultSet(terms: string[], cancellable: Gio.Cancellable): Promise<string[]>;
    /**
    * Refine the current search.
    *
    * This method is called to refine the current search results with
    * expanded terms and should return a subset of the original result set.
    *
    * Implementations may use this method to refine the search results more
    * efficiently than running a new search, or simply pass the terms to the
    * implementation of `getInitialResultSet
    */
    getSubsearchResultSet(results: string[], terms: string[], cancellable: Gio.Cancellable): Promise<string[]>;
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

