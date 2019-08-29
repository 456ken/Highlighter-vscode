'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MCHTreeDataProvider } from './MCHTree';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const MCHTreeDataProviderInstance = new MCHTreeDataProvider(context);
    let disposable = vscode.window.registerTreeDataProvider('keywordlist', MCHTreeDataProviderInstance);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('highlighter.add', () => MCHTreeDataProviderInstance.add());
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('highlighter.delete', offset => MCHTreeDataProviderInstance.delete(offset));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('keywordlist.add', offset => MCHTreeDataProviderInstance.add(offset));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('keywordlist.delete', offset => MCHTreeDataProviderInstance.delete(offset));
    context.subscriptions.push(disposable);
    disposable = vscode.window.onDidChangeVisibleTextEditors(editors => MCHTreeDataProviderInstance.refresh(editors));
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}