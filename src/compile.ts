import { commands, window, workspace } from 'vscode';
import * as path from 'path';
import * as os from 'os'

const currentOs = os.platform()
const terminal = window.createTerminal('PascalABC.NET')

function compilerPath() {
    const path: string = workspace.getConfiguration('PascalABC.NET').get(`Путь к консольному компилятору`);
    
    return currentOs == 'win32'
    ? escape(path) 
    : path
}

function compile(pathToFile: string) {
    if (compilerPath() == '' || compilerPath() == undefined) {
        window.showErrorMessage('Путь к компилятору PascalABC.NET не указан', { title: 'Перейти в настройки', id: 'go' }).then((item) => { if (item.id == "go") goToSettings() })
        return;
    }

    var compileScript = `${compilerPath()} "${pathToFile}"`

    terminal.show()
    terminal.sendText(compileScript)
}

function compileAndRun(pathToFile: string) {
     if (compilerPath() == '' || compilerPath() == undefined) {
        window.showErrorMessage('Путь к компилятору PascalABC.NET не указан', { title: 'Перейти в настройки', id: 'go' }).then((item) => { if (item.id == "go") goToSettings() })
        return;
    }

    let monoPrefix = currentOs == 'win32' ? '' : 'mono ';
    let fileName = path.basename(pathToFile, '.pas')
    let directoryName = path.dirname(pathToFile)
    let executablePath = currentOs == 'win32' ? escape(`${directoryName}\\${fileName}.exe`) : escape(`"${directoryName}/${fileName}.exe"`)

    let compileAndExecuteScript = `${compilerPath()} "${pathToFile}"; ${monoPrefix}${executablePath}`

    terminal.show()
    terminal.sendText(compileAndExecuteScript)
}

function getCurrentOpenTabFilePath() {
    var activeEditor = window.activeTextEditor

    return activeEditor === null || activeEditor === void 0
        ? void 0
        : activeEditor.document.fileName;
}

function replaceAll(str: string, find: string, replace: string) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function escape(str: string) {
    return currentOs == 'win32' ? replaceAll(str, ' ', '` ') : replaceAll(str, ' ', '\ ');
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
