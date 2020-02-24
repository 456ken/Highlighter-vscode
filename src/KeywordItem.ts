import * as vscode from 'vscode';
// import * as crypto from 'crypto';

/**
 *
 */
export class KeywordItem extends vscode.TreeItem {
	constructor(public label: string) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}
    readonly contextValue = "keyworditem";
    // readonly md5 = crypto.createHash('md5').update(this.label).digest('hex');
}
