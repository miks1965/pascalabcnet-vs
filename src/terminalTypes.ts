import { commands, window, workspace } from 'vscode';

export enum TerminalType {
    CMD,
    PowerShell,
    Bash,
    Unknown
}

export function determineWindowsTerminalType(): TerminalType {
    var term: string = workspace.getConfiguration('terminal.integrated.shell').get('windows');
    if (term == null || term == '')
        term = workspace.getConfiguration('terminal.integrated.shellArgs').get('windows');
    if (term == null || term == '')
        term = workspace.getConfiguration('terminal.integrated.defaultProfile').get('windows');
    if (term == null || term == '')
        return TerminalType.Unknown

    switch (term.toLowerCase()) {
        case 'command prompt': return TerminalType.CMD
        case 'powershell': return TerminalType.PowerShell
        case 'git bash': return TerminalType.Bash
        default: return TerminalType.Unknown
    }  
}