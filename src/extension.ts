'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MCHTreeDataProvider } from './MCHTree';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // vscode.window.showInformationMessage("extensinon activate.");

    const MCHTreeDataProviderInstance = new MCHTreeDataProvider(context);
    let disposable = vscode.window.registerTreeDataProvider('keywordlist', MCHTreeDataProviderInstance);
    context.subscriptions.push(disposable);

    // 
    disposable = vscode.commands.registerCommand('mch.AddColor', () => MCHTreeDataProviderInstance.add());
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('mch.DeleteColor', offset => MCHTreeDataProviderInstance.delete(offset));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('mch.AddKeyword', offset => MCHTreeDataProviderInstance.add(offset));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('mch.DeleteKeyword', offset => MCHTreeDataProviderInstance.delete(offset));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('mch.ChangeColor', offset => MCHTreeDataProviderInstance.change(offset));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('mch.SaveList', () => MCHTreeDataProviderInstance.save());
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('mch.SetCurrent', offset => MCHTreeDataProviderInstance.changeActive(offset));
    context.subscriptions.push(disposable);
    
    // 
    disposable = vscode.window.onDidChangeVisibleTextEditors(editors => MCHTreeDataProviderInstance.refresh(editors));
    context.subscriptions.push(disposable);
    disposable = vscode.window.onDidChangeTextEditorSelection(() => MCHTreeDataProviderInstance.refresh());
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('mch.AddSelection', () => MCHTreeDataProviderInstance.setSelect());
    context.subscriptions.push(disposable);
    disposable = vscode.workspace.onDidChangeConfiguration(() => MCHTreeDataProviderInstance.refresh());
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('mch.HideShow', highlighter => MCHTreeDataProviderInstance.hideshow(highlighter));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('mch.EditKeyword', keyword => MCHTreeDataProviderInstance.edit(keyword));

    //
    disposable = vscode.commands.registerCommand('mch.ToggleColorRed', offset => MCHTreeDataProviderInstance.toggle('Red'));
    disposable = vscode.commands.registerCommand('mch.ToggleColorGreen', offset => MCHTreeDataProviderInstance.toggle('Green'));
    disposable = vscode.commands.registerCommand('mch.ToggleColorBlue', offset => MCHTreeDataProviderInstance.toggle('Blue'));
    disposable = vscode.commands.registerCommand('mch.ToggleColorYellow', offset => MCHTreeDataProviderInstance.toggle('Yellow'));
    disposable = vscode.commands.registerCommand('mch.ToggleColorPink', offset => MCHTreeDataProviderInstance.toggle('Pink'));
    disposable = vscode.commands.registerCommand('mch.ToggleColorCyan', offset => MCHTreeDataProviderInstance.toggle('Cyan'));

    // 
    MCHTreeDataProviderInstance.refresh();
}

// this method is called when your extension is deactivated
export function deactivate() {
    // vscode.window.showInformationMessage("extensinon deactivate.");
}