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

    context.subscriptions.push(
        // 
        vscode.window.registerTreeDataProvider('keywordlist', MCHTreeDataProviderInstance),
        //
        vscode.commands.registerCommand('mch.AddColor', () => MCHTreeDataProviderInstance.add()),
        vscode.commands.registerCommand('mch.DeleteColor', offset => MCHTreeDataProviderInstance.delete(offset)),
        vscode.commands.registerCommand('mch.AddKeyword', offset => MCHTreeDataProviderInstance.add(offset)),
        vscode.commands.registerCommand('mch.DeleteKeyword', offset => MCHTreeDataProviderInstance.delete(offset)),
        vscode.commands.registerCommand('mch.ChangeColor', offset => MCHTreeDataProviderInstance.change(offset)),
        vscode.commands.registerCommand('mch.SaveList', () => MCHTreeDataProviderInstance.save()),
        vscode.commands.registerCommand('mch.SetCurrent', offset => MCHTreeDataProviderInstance.changeActive(offset)),
        vscode.commands.registerCommand('mch.AddSelection', () => MCHTreeDataProviderInstance.setSelect()),
        vscode.commands.registerCommand('mch.HideShow', highlighter => MCHTreeDataProviderInstance.hideshow(highlighter)),
        vscode.commands.registerCommand('mch.EditKeyword', keyword => MCHTreeDataProviderInstance.edit(keyword)),
        vscode.commands.registerCommand('mch.ToggleColorRed', () => MCHTreeDataProviderInstance.toggle('Red')),
        vscode.commands.registerCommand('mch.ToggleColorGreen', () => MCHTreeDataProviderInstance.toggle('Green')),
        vscode.commands.registerCommand('mch.ToggleColorBlue', () => MCHTreeDataProviderInstance.toggle('Blue')),
        vscode.commands.registerCommand('mch.ToggleColorYellow', () => MCHTreeDataProviderInstance.toggle('Yellow')),
        vscode.commands.registerCommand('mch.ToggleColorPink', () => MCHTreeDataProviderInstance.toggle('Pink')),
        vscode.commands.registerCommand('mch.ToggleColorCyan', () => MCHTreeDataProviderInstance.toggle('Cyan')),
        // Internal commands. Undefined in package.json.
        MCHTreeDataProviderInstance.onDidChangeTreeData(() => MCHTreeDataProviderInstance.autosave()),
        // Events which fires when some action occurs.
        vscode.window.onDidChangeVisibleTextEditors(editors => MCHTreeDataProviderInstance.refresh(editors)),
        vscode.window.onDidChangeTextEditorSelection(() => MCHTreeDataProviderInstance.refresh()),
        vscode.workspace.onDidChangeConfiguration(() => MCHTreeDataProviderInstance.refresh()),
    );

    // 
    MCHTreeDataProviderInstance.refresh();
}

// this method is called when your extension is deactivated
export function deactivate() {
    // vscode.window.showInformationMessage("extensinon deactivate.");

    //
    vscode.commands.executeCommand('mch.AutoSave');
}