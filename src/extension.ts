import { workspace, ExtensionContext, commands, window } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

import * as Compile from './compile';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    // The server is implemented in node
    let serverModule = `${__dirname}/../node_modules/pascalabcnet-lsp/out/server.js`
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    };

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'pascalabcnet' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        },
        outputChannelName: 'PascalABC.NET extension'
    };

    let compileAndRunCurrentTabCommand
        = commands.registerCommand('extension.pabcnet.compileAndRunCurrentTab', Compile.compileAndRunCurrentTab)
    let compileCurrentTabCommand
        = commands.registerCommand('extension.pabcnet.compileCurrentTab', Compile.compileCurrentTab)

    context.subscriptions.push(compileAndRunCurrentTabCommand);
    context.subscriptions.push(compileCurrentTabCommand);

    Compile.createTerminal();
    Compile.terminal.show();

    // To avoid duplicating first command
    commands.executeCommand('workbench.action.terminal.clear')

    // Create the language client and start the client.
    client = new LanguageClient(
        'pabcnet-server',
        'PascalABC.NET Server',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
