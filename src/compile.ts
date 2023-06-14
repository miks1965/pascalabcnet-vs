import { commands, Terminal, window, workspace } from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { TerminalType, determineWindowsTerminalType } from './terminalTypes';
import { exec } from 'child_process';

const currentOs = os.platform()
export let terminal: Terminal;

export function createTerminal() {
    const terminalName = 'PascalABC.NET';

    // Checking if the terminal is already open
    for (const terminal of window.terminals) {
        if (terminal.name === terminalName) {
            return;
        }
    }

    terminal = window.createTerminal(terminalName);
}

let terminalKind = currentOs == 'win32' ? determineWindowsTerminalType() : TerminalType.Bash

function checkTerminalValidity() {
    if (currentOs != 'win32')
        return true;

    terminalKind = determineWindowsTerminalType()
    if (terminalKind != TerminalType.Unknown)
        return true

    window.showErrorMessage('Выбран неподдерживаемый тип терминала. Выберите в настройках Command Prompt, PowerShell или Git Bash, после чего VSCode будет перезапущен.',
        { title: 'Перейти в настройки', id: 'go' }).then((item) => { if (item.id == "go") goToTerminalSettings() })
    return false
}

function getCompilerPath() {
    const path: string = workspace.getConfiguration('PascalABC.NET').get(`Путь к консольному компилятору`);

    return escape(path)
}

function getExeDelete() {
    const needDelete: boolean = workspace.getConfiguration('PascalABC.NET').get(`Удалять EXE файл после выполнения`);

    return needDelete
}

function getPdbDelete() {
    const needDelete: boolean = workspace.getConfiguration('PascalABC.NET').get(`Удалять PDB файл после выполнения`);

    return needDelete
}

function getDebugMode() {
    const debugMode: boolean = workspace.getConfiguration('PascalABC.NET').get(`Компилировать DEBUG версию`);

    return debugMode
}

function getStandalone() {
    const standaloneMode: boolean = workspace.getConfiguration('PascalABC.NET').get(`Запуск программы в отдельном окне`);

    return standaloneMode
}


function getCompileCommand(pathToFile: string, execute: boolean) {
    let commandSeparator = getCommandSeparator()
    let monoPrefix = currentOs == 'win32' ? '' : 'mono ';
    let fileName = path.basename(pathToFile, '.pas')
    let directoryName = path.dirname(pathToFile)
    let executablePath = currentOs == 'win32' ? escape(`${directoryName}\\${fileName}.exe`) : escape(`"${directoryName}/${fileName}.exe"`)
    let pdbPath = currentOs == 'win32' ? escape(`${directoryName}\\${fileName}.pdb`) : escape(`"${directoryName}/${fileName}.pdb"`)

    const compilerPath = getCompilerPath();
    const needDeleteExe = getExeDelete();
    const needDeletePdb = getPdbDelete();
    const debugMode = getDebugMode();
    const standaloneMode = getStandalone();


    if (compilerPath == '' || compilerPath == undefined) {
        window.showErrorMessage('Путь к компилятору PascalABC.NET не указан', { title: 'Перейти в настройки', id: 'go' }).then((item) => { if (item.id == "go") goToCompilerSettings() })
        return;
    }

    let compileScript;

    if (currentOs == 'win32') {
        if (terminalKind == TerminalType.PowerShell) {
            compileScript = `& "${compilerPath}"`
            if (debugMode) {
                compileScript += ` debug=1`
            }
            else {
                compileScript += ` debug=0`
            }
            compileScript += ` "${pathToFile}"`;
            if (execute) {
                if (standaloneMode) {
                    compileScript += `${commandSeparator} if(Test-Path "${executablePath}") {start powershell -wait {"${executablePath}"; pause}}`
                }
                else {
                    compileScript += `${commandSeparator} if(Test-Path "${executablePath}") {& "${executablePath}"}`
                }
            }

            if (needDeleteExe) {
                compileScript += `${commandSeparator} Remove-Item -Path "${executablePath}" -erroraction silentlycontinue`
            }
            if (needDeletePdb && debugMode) {
                compileScript += `${commandSeparator} Remove-Item -Path "${pdbPath}" -erroraction silentlycontinue`
            }
        }
        else {
            compileScript = `"${compilerPath}"`;
            if (debugMode) {
                compileScript += ` debug=1`
            }
            else {
                compileScript += ` debug=0`
            }
            compileScript += ` "${pathToFile}"`;
            if (execute) {
                if (standaloneMode) {
                    compileScript += `${commandSeparator} IF EXIST "${executablePath}" (start /wait cmd /c "${executablePath}" ^& pause)`
                }
                else {
                    compileScript += `${commandSeparator} IF EXIST "${executablePath}" ("${executablePath}")`
                }
            }

            if (needDeleteExe) {
                compileScript += `${commandSeparator} del "${executablePath}" 2>nul`
            }
            if (needDeletePdb && debugMode) {
                compileScript += `${commandSeparator} del "${pdbPath}" 2>nul`
            }
        }
    }
    else {
        compileScript = `${compilerPath}`
        if(debugMode) {
            compileScript += ` debug=1`
        }
        else {
            compileScript += ` debug=0`
        }
        compileScript += ` "${pathToFile}"`;
        if (execute) {
            if (standaloneMode) {
                compileScript += `${commandSeparator} if [ -f "${executablePath}" ]; then ( gnome-terminal -e "${executablePath}; read -p 'Нажмите Enter, чтобы закрыть окно...'" ) fi`
            }
            else {
                compileScript += `${commandSeparator} if [ -f "${executablePath}" ]; then ( ${monoPrefix}"${executablePath}" ) fi`
            }
        }

        if (needDeleteExe) {
            compileScript += `${commandSeparator} rm -f "${executablePath}"`
        }
        if (needDeletePdb && debugMode) {
            compileScript += `${commandSeparator} rm -f "${pdbPath}"`
        }
    }

    return compileScript
}

function compile(pathToFile: string) {
    if (!checkTerminalValidity())
        return;

    window.activeTextEditor.document.save();

    let compileScript = getCompileCommand(pathToFile, false);

    createTerminal()
    terminal.show()
    terminal.sendText(compileScript)
}

function compileAndRun(pathToFile: string) {
    if (!checkTerminalValidity())
        return;

    window.activeTextEditor.document.save();

    let compileAndExecuteScript = getCompileCommand(pathToFile, true)

    createTerminal()
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
    commands.executeCommand('workbench.action.openSettings', 'terminal.integrated.defaultProfile.windows')
}

export function compileCurrentTab() {
    compile(getCurrentOpenTabFilePath())
}

export function compileAndRunCurrentTab() {
    compileAndRun(getCurrentOpenTabFilePath())
}

exports.compileCurrentTab = compileCurrentTab
exports.compileAndRunCurrentTab = compileAndRunCurrentTab
