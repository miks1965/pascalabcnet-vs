import path = require("path");
import {
  Uri,
  CancellationToken,
  FileDecorationProvider,
  FileDecoration,
  EventEmitter,
  Event,
  workspace,
  ThemeColor,
  FileType,
} from "vscode";
import { promises as fsPromises } from "fs";
import ignore from "ignore";
import { getStorage } from "./extension";


export class DecorationProvider implements FileDecorationProvider {
  private readonly _onDidChangeFileDecorations: EventEmitter<Uri | Uri[]> =
    new EventEmitter<Uri | Uri[]>();
  readonly onDidChangeFileDecorations: Event<Uri | Uri[]> =
    this._onDidChangeFileDecorations.event;
    public markedFiles: Set<string> = new Set<string>();

  constructor() {
    if (!this.loadMarkedFilesFromWSStorage()) {
      const config = workspace.getConfiguration("PascalABC.NET");
      config.autoloadFromScope;
    }
  }

  provideFileDecoration(uri: Uri, token: CancellationToken): FileDecoration {
    if (token.isCancellationRequested) {
      return {};
    }

    if (this.markedFiles.has(uri.fsPath)) {
      return {
        propagate: true,
        badge: "📌",
        tooltip: "This file is marked",
      };
    }
    return {};
  }

  public async markOrUnmarkFiles(uris: Uri[]) {
    uris.forEach(async (uri) => {
      const stat = await workspace.fs.stat(uri);
      switch (stat.type) {
        case FileType.Directory:
          const files = (await workspace.fs.readDirectory(uri)).map((tu) =>
            Uri.parse(`${uri}/${tu[0]}`)
          );
          return this.markOrUnmarkFiles(files);
        case FileType.File:
          const fPath = uri.fsPath;
          if (this.markedFiles.has(uri.fsPath)) {
            this.markedFiles.delete(fPath);
            getStorage().update(fPath, undefined);
          } else {
            this.markedFiles.add(fPath);
            getStorage().update(fPath, true);
          }
          this._onDidChangeFileDecorations.fire(uri);
          return;
        default:
          return;
      }
    });
  }

  async loadMarkedFiles(scopeUri: string, projectRootUri: string) {
    let patterns = (await asyncReadFile(scopeUri)) || [];
    const ig = ignore().add(patterns);
    let markedAbsPath = (await workspace.findFiles("**/*"))
      .map((uri) => path.relative(projectRootUri, uri.fsPath))
      .filter((relPath) => ig.ignores(relPath))
      .map((relPath) => Uri.file(path.resolve(projectRootUri, relPath)));
    this.markOrUnmarkFiles(markedAbsPath);
  }

  public handleFileRename(oldUri: Uri, newUri: Uri) {
    if (!this.markedFiles.has(oldUri.fsPath)) {
      return;
    }
    this.markedFiles.delete(oldUri.fsPath);
    getStorage().update(oldUri.fsPath, undefined);
    this.markedFiles.add(newUri.fsPath);
    getStorage().update(newUri.fsPath, true);
    this._onDidChangeFileDecorations.fire(newUri);
  }

  private loadMarkedFilesFromWSStorage(): boolean {
    if (!getStorage()) {
      return false;
    }
    const markedURIs = getStorage().keys();
    if (!markedURIs.length) {
      return false;
    }
    this.markOrUnmarkFiles(markedURIs.map((uri) => Uri.file(uri)));
    return true;
  }
}

async function asyncReadFile(path: string) {
  try {
    const contents = await fsPromises.readFile(path, "utf-8");

    const arr = contents.split(/\r?\n/);

    return arr;
  } catch (err) {
  }
}
