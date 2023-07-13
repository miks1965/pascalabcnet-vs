import * as vscode from 'vscode';
import { workspace } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';

import { getCurrentOpenTabFilePath, getLogin } from './compile';


function readAndTrimFileContents(filename: string): string {
  const buffer = fs.readFileSync(filename);
  const decodedContents = iconv.decode(buffer, 'win1251');
  const trimmedContents = decodedContents.trim();
  return trimmedContents;
}

function getLink() {
    const link: string = workspace.getConfiguration('PascalABC.NET').get(`Задачник: Ссылка на ЮФУ сервер`);

    return link
}

function getGroup() {
  const link: string = workspace.getConfiguration('PascalABC.NET').get(`Задачник: Группа`);

  return link
}

export function showResults() {
    const panel = vscode.window.createWebviewPanel(
      'webview',
      'Results',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    const link = getLink() + '/index.php'
    const groupName = getGroup().replace('\s+', '+')
    let pathToFile = getCurrentOpenTabFilePath()
    let directoryName = path.dirname(pathToFile)
    const lessonName = readAndTrimFileContents(path.join(directoryName, 'lightpt.dat'));

    let linkAddition = '';
    if (groupName && lessonName) {
      linkAddition = `?groupName=${groupName}&lessonName=${lessonName}&template=on`;
    }

    panel.webview.html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Webview</title>
        <style>
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #fafafa;
          }

          .container {
            height: 100%;
          }
        </style>
      </head>
      <body>
        <div class="container">
	        <iframe src="${link + linkAddition}" height=100% width=100%></iframe>
        </div>
      </body>
    </html>
    `;
}

export function showRating() {
  const panel = vscode.window.createWebviewPanel(
    'webview',
    'Rating',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  const link = getLink() + '/rating.php'
  const groupName = getGroup().replace('\s+', '+')
  const pupilFIO = getLogin().replace('\s+', '+')

  let linkAddition = '';
  if (groupName && pupilFIO) {
    linkAddition = `?groupName=${groupName}&pupilFIO=${pupilFIO}`;
  }

  panel.webview.html = `
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Webview</title>
      <style>
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          background-color: #fafafa;
        }

        .container {
          height: 100%;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <iframe src="${link + linkAddition}" height=100% width=100%></iframe>
      </div>
    </body>
  </html>
  `;
}
