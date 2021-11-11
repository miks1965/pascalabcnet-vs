import { commands, window, workspace } from 'vscode';
import * as path from 'path';
import * as os from 'os'

const currentOs = os.platform()

const terminal = getOrCreateTerminal()

function getOrCreateTerminal() {
    var foundTerminal = window.terminals.find((x) => x.name === 'PascalABC.NET');
    if (foundTerminal)
        return foundTerminal;
    else {
        return window.createTerminal('PascalABC.NET');
    }
}

function compile(pathToFile: string) {
    const PascalABCCompilerPath = workspace.getConfiguration('PascalABC.NET').get(`Путь к консольному компилятору`)

    if (PascalABCCompilerPath == '' || PascalABCCompilerPath == undefined) {
        window.showErrorMessage('Путь к компилятору PascalABC.NET не указан', { title: 'Перейти в настройки', id: 'go' }).then((item) => { if (item.id == "go") goToSettings() })
        return;
    }

    var compileScript = `${PascalABCCompilerPath} "${pathToFile}"`

    terminal.show()
    terminal.sendText(compileScript)
}

function compileAndRun(pathToFile: string) {
    const PascalABCCompilerPath = workspace.getConfiguration('PascalABC.NET').get(`Путь к консольному компилятору`)

    if (PascalABCCompilerPath == '' || PascalABCCompilerPath == undefined) {
        window.showErrorMessage('Путь к компилятору PascalABC.NET не указан', { title: 'Перейти в настройки', id: 'go' }).then((item) => { if (item.id == "go") goToSettings() })
        return;
    }

    var monoPrefix = currentOs == 'win32' ? '' : 'mono ';
    var fileName = path.basename(pathToFile, '.pas')
    var directoryName = path.dirname(pathToFile)
    var executablePath = `"${directoryName}/${fileName}.exe"`

    var compileAndExecuteScript = `${PascalABCCompilerPath} "${pathToFile}" && ${monoPrefix} ${executablePath}`

    terminal.show()
    terminal.sendText(compileAndExecuteScript)
}

function getCurrentOpenTabFilePath() {
    var activeEditor = window.activeTextEditor

    return activeEditor === null || activeEditor === void 0
        ? void 0
        : activeEditor.document.fileName;
}

function goToSettings() {
    commands.executeCommand('workbench.action.openSettings', 'PascalABC.NET.Путь к консольному компилятору')
}

export function compileCurrentTab() {
    compile(getCurrentOpenTabFilePath())
}

export function compileAndRunCurrentTab() {
    compileAndRun(getCurrentOpenTabFilePath())
}

exports.compileCurrentTab = compileCurrentTab
exports.compileAndRunCurrentTab = compileAndRunCurrentTab
