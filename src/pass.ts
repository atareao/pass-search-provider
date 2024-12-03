import Gio from "gi://Gio";

/*
 * Asynchronous programming with GJS
 * https://gjs.guide/guides/gjs/asynchronous-programming.html
 */
Gio._promisify(Gio.Subprocess.prototype, "communicate_utf8_async",
    "communicate_utf8_finish");

interface Response {
    status: boolean;
    message: string;
    value: string;
}

export default class Pass {
    static async getPass(name: string, cancellable: Gio.Cancellable | null) : Promise<Response> {
        const sub = Gio.Subprocess.new(
            ['pass', 'show', name],
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        );
        const [stdout, stderr] = await sub.communicate_utf8_async(null, cancellable);
        if(stderr) {
            console.error("[PSP]", stderr);
            return {
                status: false,
                message: stderr,
                value: "",
            };
        }
        return {
            status: true,
            message: `Copied "${name}" to clipboard`,
            value: stdout,
        };
    }
}
