import { window, workspace, ExtensionContext, commands, Uri, Memento } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

import * as Compile from './compile';
import { showResults, showRating } from './serverInfo';
import { DecorationProvider } from "./marks";

let provider: DecorationProvider;
let storage: Memento;
let client: LanguageClient;

export function activate(context: ExtensionContext) {
    storage = context.workspaceState;

    provider = new DecorationProvider();
    context.subscriptions.push(
      window.registerFileDecorationProvider(provider)
    );

    let serverModule = `${__dirname}/../node_modules/pascalabcnet-lsp/out/server.js`
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions
        }
    };

    let clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'pascalabcnet' }],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        },
        outputChannelName: 'PascalABC.NET extension'
    };

    let compileAndRunCurrentTabCommand
        = commands.registerCommand('extension.pabcnet.compileAndRunCurrentTab', Compile.compileAndRunCurrentTab)
    let compileCurrentTabCommand
        = commands.registerCommand('extension.pabcnet.compileCurrentTab', Compile.compileCurrentTab)
    let showResultsCommand
        = commands.registerCommand('extension.pabcnet.showResults', showResults)
    let showRatingCommand
        = commands.registerCommand('extension.pabcnet.showRatings', showRating)
    let markFileCommand
        = commands.registerCommand("extension.pabcnet.markUnmarkSelectedFile", async (clickedFile: Uri, selectedFiles: Uri[]) => {
              provider.markOrUnmarkFiles(selectedFiles);
            }
          )

    let renameHandeFileCommand = workspace.onDidRenameFiles(async (rename) => {
        if (rename.files.length === 0) {
          return;
        }
  
        for (const file of rename.files) {
          provider.handleFileRename(file.oldUri, file.newUri);
        }
      })

    context.subscriptions.push(compileAndRunCurrentTabCommand);
    context.subscriptions.push(compileCurrentTabCommand);
    context.subscriptions.push(showResultsCommand);
    context.subscriptions.push(showRatingCommand);
    context.subscriptions.push(markFileCommand);
    context.subscriptions.push(renameHandeFileCommand);

    Compile.createTerminal();
    Compile.terminal.show();

    commands.executeCommand('workbench.action.terminal.clear')

    client = new LanguageClient(
        'pabcnet-server',
        'PascalABC.NET Server',
        serverOptions,
        clientOptions
    );

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

export const getStorage = () => {
    return storage;
};
