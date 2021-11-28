import { commands, window, workspace } from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { TerminalType, determineWindowsTerminalType } from './terminalTypes';

const currentOs = os.platform()
const terminal = window.createTerminal('PascalABC.NET')

let terminalKind = currentOs == 'win32' ? determineWindowsTerminalType() : TerminalType.Bash

function checkTerminalValidity() {
    if (currentOs != 'win32')
        return true;

    terminalKind = determineWindowsTerminalType()
    if (terminalKind != TerminalType.Unknown)
        return true

    window.showErrorMessage('Выбран неподдерживаемый тип терминала. Выберите в настройках Command Prompt, PowerShell или Git Bash и перезапустите VSCode', 
        { title: 'Перейти в настройки', id: 'go' }).then((item) => { if (item.id == "go") goToTerminalSettings() })
    return false
}

function getCompilerPath() {
    const path: string = workspace.getConfiguration('PascalABC.NET').get(`Путь к консольному компилятору`);

    return escape(path)
}

function compile(pathToFile: string) {
    if (!checkTerminalValidity)
        return;
    
    const compilerPath = getCompilerPath()

    if (compilerPath == '' || compilerPath == undefined) {
        window.showErrorMessage('Путь к компилятору PascalABC.NET не указан', { title: 'Перейти в настройки', id: 'go' }).then((item) => { if (item.id == "go") goToCompilerSettings() })
        return;
    }

    var compileScript =  currentOs == 'win32' && terminalKind != TerminalType.PowerShell 
        ? `"${compilerPath}" "${pathToFile}"`
        : `${compilerPath} "${pathToFile}"`

    terminal.show()
    terminal.sendText(compileScript)
}

function compileAndRun(pathToFile: string) {
    if (!checkTerminalValidity())
        return;
    
    const compilerPath = getCompilerPath()

    if (compilerPath == '' || compilerPath == undefined) {
        window.showErrorMessage('Путь к компилятору PascalABC.NET не указан', { title: 'Перейти в настройки', id: 'go' }).then((item) => { if (item.id == "go") goToCompilerSettings() })
        return;
    }

    let monoPrefix = currentOs == 'win32' ? '' : 'mono ';
    let fileName = path.basename(pathToFile, '.pas')
    let directoryName = path.dirname(pathToFile)
    let commandSeparator = getCommandSeparator()
    let executablePath = currentOs == 'win32' ? escape(`${directoryName}\\${fileName}.exe`) : escape(`"${directoryName}/${fileName}.exe"`)

    let compileAndExecuteScript = currentOs == 'win32' && terminalKind != TerminalType.PowerShell 
        ? `"${compilerPath}" "${pathToFile}"${commandSeparator} "${monoPrefix}${executablePath}"` 
        : `${compilerPath} "${pathToFile}"${commandSeparator} ${monoPrefix}${executablePath}`

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
    switch (terminalKind) {
        case TerminalType.PowerShell: 
            return replaceAll(str, ' ', '` ')
        case TerminalType.Bash: 
            return replaceAll(str, ' ', '\ ')
        default: 
            return str
    }
}

function getCommandSeparator() {
    switch (terminalKind) {
        case TerminalType.PowerShell: 
            return ';'
        case TerminalType.CMD:
        case TerminalType.Bash: 
            return ' &&'
    }
}

function goToCompilerSettings() {
    commands.executeCommand('workbench.action.openSettings', 'PascalABC.NET.Путь к консольному компилятору')
}

function goToTerminalSettings() {
    commands.executeCommand('workbench.action.openSettings', 'terminal.integrated.defaultProfile')
}

export function compileCurrentTab() {
    compile(getCurrentOpenTabFilePath())
}

export function compileAndRunCurrentTab() {
    compileAndRun(getCurrentOpenTabFilePath())
}

exports.compileCurrentTab = compileCurrentTab
exports.compileAndRunCurrentTab = compileAndRunCurrentTab
