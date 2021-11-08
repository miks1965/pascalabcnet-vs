import { window, workspace } from 'vscode';
import * as path from 'path';

const terminal = window.createTerminal('PascalABC.NET');

function compile(pathToFile: string) {
    const PascalABCCompilerPath = workspace.getConfiguration('PascalABC.NET').pathToCompiler

    var fileName = path.basename(pathToFile, '.pas');
    var directoryName = path.dirname(pathToFile);
    var executablePath = `${directoryName}/${fileName}.exe`;
    var compileAndExecuteScript = `${PascalABCCompilerPath} "${pathToFile}" && "${executablePath}"`;
    
    terminal.show()
    terminal.sendText(compileAndExecuteScript)
}

export function compileAndRunCurrentTab() {
    var _a;
    var currentlyOpenTabFilePath = (_a = window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.fileName;
    compile(currentlyOpenTabFilePath);
}

exports.compileAndRunCurrentTab = compileAndRunCurrentTab;
