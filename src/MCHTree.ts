import * as vscode from 'vscode';

export class MCHTreeDataProvider implements vscode.TreeDataProvider<KeywordItem> {
	onDidChangeTreeData?: vscode.Event<KeywordItem | null | undefined> | undefined;

	data: KeywordItem[];

	constructor() {
		this.data = [
			new LineMarker('yellow', '#FFFF00', [
				new KeywordItem('vscode'),
				new KeywordItem('undefined')]),
			new LineMarker('pink', '#FF00FF', [
				new KeywordItem('return'),
				new KeywordItem('new')])
		];
	}
	getTreeItem(element: KeywordItem | LineMarker): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(element?: KeywordItem | LineMarker | undefined): vscode.ProviderResult<KeywordItem[]> {
		if (!element) {
			return this.data;
		}
		else if (element instanceof LineMarker) {
			return element.children;
		}
		else {
			return [];
		}
	}
}

class LineMarker extends vscode.TreeItem {
	children: KeywordItem[] | undefined;

	constructor(label: string, colorcode: string, children: KeywordItem[]) {
		super(label, vscode.TreeItemCollapsibleState.Expanded);
		this.children = children;
	}

	contextValue = "linemarker";
}

class KeywordItem extends vscode.TreeItem {
	constructor(label: string) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}

	contextValue = "keyworditem";
}
