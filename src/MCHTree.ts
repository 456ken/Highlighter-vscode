import * as vscode from 'vscode';
import {localeString} from './i18n';

type ColorInfo = {
	name: string,
	code: string,
	icon: string
};

export class MCHTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	_onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | null> = new vscode.EventEmitter<vscode.TreeItem | null>();
	onDidChangeTreeData: vscode.Event<vscode.TreeItem | null> = this._onDidChangeTreeData.event;

	data: Highlighter[] = [];

	_colorset: ColorInfo[] = [
		{ name: 'red', code: '#FF0000', icon: this.context.asAbsolutePath('resources/red.svg') },
		{ name: 'green', code: '#00FF00', icon: this.context.asAbsolutePath('resources/green.svg') },
		{ name: 'blue', code: '#0000FF', icon: this.context.asAbsolutePath('resources/blue.svg') },
		{ name: 'yellow', code: '#FFFF00', icon: this.context.asAbsolutePath('resources/yellow.svg') },
		{ name: 'pink', code: '#FF00FF', icon: this.context.asAbsolutePath('resources/pink.svg') },
		{ name: 'cyan', code: '#00FFFF', icon: this.context.asAbsolutePath('resources/cyan.svg') },
	];
	ColorSet = {
		Red: this._colorset[0],
		Green: this._colorset[1],
		Blue: this._colorset[2],
		Yellow: this._colorset[3],
		Pink: this._colorset[4],
		Cyan: this._colorset[5],
	};

	delete(offset: vscode.TreeItem) {
		console.log(`Get value ${offset.label}.`);

		if (offset instanceof Highlighter) {
			offset.delete();

			this.data = this.data.filter(highlighter => highlighter !== offset);
			this.refresh();
		}
		else if (offset instanceof KeywordItem) {
			this.data.forEach(highlighter => {
				highlighter.keywordItems = highlighter.keywordItems.filter(keyworditem => keyworditem !== offset);
			});
			this.refresh();
		}
	}

	add(offset?: vscode.TreeItem) {
		if (!offset) {
			// Add the color of the highlighter
			vscode.window.showQuickPick(this._colorset.map(item => item.name)).then(select => {
				if (select !== undefined) {
					var colorinfo = this._colorset.filter(value => value.name === select)[0];
					if (this.data.findIndex(highlighter => highlighter.colortype === colorinfo) < 0) {
						this.data.push(new Highlighter(colorinfo, []));
						this.refresh();
					}
				}
			});
		}
		else if (offset instanceof Highlighter) {
			// Add a keyword.
			vscode.window.showInputBox({ placeHolder: "Input keyword." }).then(keyword => {
				if (keyword !== undefined) {
					offset.add(keyword);
					offset.refresh();
					this.refresh();
				}
			});
		}
	}

	refresh(editors?: vscode.TextEditor[]) {
		this._onDidChangeTreeData.fire();
		this.data.forEach(highlighter => highlighter.refresh(editors));
	}

	constructor(private context: vscode.ExtensionContext) {
		this.data = [
			new Highlighter(this.ColorSet.Green, [])
		];
	}
	getTreeItem(element: KeywordItem | Highlighter): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	getChildren(element?: KeywordItem | Highlighter | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
		if (!element) {
			return this.data;
		}
		else if (element instanceof Highlighter) {
			return element.keywordItems;
		}
		else {
			return [];
		}
	}
}

class Highlighter extends vscode.TreeItem {
	decorator: vscode.TextEditorDecorationType | undefined;
	colortype: ColorInfo;
	private children: KeywordItem[];

	constructor(colortype: ColorInfo, children: KeywordItem[]) {
		super(colortype.name, vscode.TreeItemCollapsibleState.Expanded);
		this.colortype = colortype;
		this.children = children;
		this.iconPath = colortype.icon;
	}

	get keywordItems() {
		return this.children;
	}
	set keywordItems(children: KeywordItem[]) {
		this.children = children;
		this.refresh();
	}

	add(keyword: string | KeywordItem) {
		if (keyword instanceof KeywordItem) {
			if (this.children.findIndex(value => value.label === keyword.label) < 0) {
				keyword.parent = this;
				this.children.push(keyword);
			}
		}
		else {
			if (this.children.findIndex(value => value.label === keyword) < 0) {
				this.children.push(new KeywordItem(keyword, this));
			}
		}
	}

	delete() {
		if (this.decorator !== undefined) {
			this.decorator.dispose();
		}
	}

	refresh(editors?: vscode.TextEditor[]) {
		//console.log(`Call refresh ${this.colortype.name} color!`);
		if (this.decorator !== undefined) {
			this.decorator.dispose();
		}

		this.decorator = vscode.window.createTextEditorDecorationType({
			overviewRulerColor: this.colortype.code,
			overviewRulerLane: vscode.OverviewRulerLane.Center,
			light: {
				backgroundColor: this.colortype.code + '55'
			},
			dark: {
				backgroundColor: this.colortype.code + 'AA'
			}
		});

		if (editors === undefined) {
			editors = vscode.window.visibleTextEditors;
		}

		let counter = 0;
		let limit = vscode.workspace.getConfiguration('multicolorhighlighter').get('upperlimit', 100000);
		editors.forEach(editor => {
			if (editor === undefined) {
				return;
			}
			const text = editor.document.getText();
			const targets: vscode.DecorationOptions[] = [];
			let match;
			this.children.forEach(keyworditem => {
				const regEx = new RegExp(keyworditem.label, 'g');
				while ((match = regEx.exec(text)) && counter < limit) {
					counter++;
					const startPos = editor.document.positionAt(match.index);
					const endPos = editor.document.positionAt(match.index + match[0].length);
					targets.push({ range: new vscode.Range(startPos, endPos) });
				}
				if (limit <= counter) {
					// Exit foreach loop.
					return;
				}
			});
			if (limit <= counter) {
				vscode.window.showErrorMessage(
					localeString('multicolorhighlighter.warning.upperlimit.1') +
					limit.toString() +
					localeString('multicolorhighlighter.warning.upperlimit.2'));
				return;
			}

			if (this.decorator !== undefined && 0 < targets.length) {
				editor.setDecorations(this.decorator, targets);
			}
		});
	}

	readonly contextValue = "highlighter";
}

class KeywordItem extends vscode.TreeItem {
	parent: Highlighter|undefined;

	constructor(public label: string, parent?:Highlighter) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.parent = parent;
	}

	readonly contextValue = "keyworditem";
}