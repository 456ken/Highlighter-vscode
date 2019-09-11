import * as vscode from 'vscode';
import {localeString} from './i18n';

type ColorInfo = {
	name: string,
	code: string,
	icon: string
};


/** Node's relation of Multi Color Highlighter.
 * KeywordList
 * + Highlighter
 *   + KeywordItem
 */
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


	/**
	 * 
	 * @param offset 
	 */
	change(offset: vscode.TreeItem) {
		console.log(`Get value ${offset.label}.`);

		vscode.window.showQuickPick(this._colorset.map(item => item.name)).then(select => {
			if (select === undefined) {
				return;
			}
			var selectcolorinfo = this._colorset.filter(value => value.name === select)[0];
			// Search highlighter having a keyword.
			var beforehighlighter: Highlighter | undefined;
			if (offset instanceof Highlighter) {
				beforehighlighter = offset;
				// Delete before highlighter to move new it.
				this.delete(beforehighlighter);
			}
			else if (offset instanceof KeywordItem) {
				beforehighlighter = this.data.find(value => {
					return (0 <= value.keywordItems.indexOf(<KeywordItem>offset));
				});
			}
			if (beforehighlighter === undefined) {
				return;
			}

			// Prepare moving keywords.
			var keywordItems: KeywordItem[] | undefined;
			if (offset instanceof Highlighter) {
				keywordItems = beforehighlighter.keywordItems;
			}
			else if (offset instanceof KeywordItem) {
				keywordItems = [<KeywordItem>offset];
			}
			if (keywordItems === undefined) {
				return;
			}

			// Get a color to add keywords.
			var newhighlighter = this.data.find(value => {
				return (value.colortype === selectcolorinfo);
			});
			if (newhighlighter !== undefined) {
				Highlighter.moveTo(keywordItems, newhighlighter);
			}
			else {
				newhighlighter = new Highlighter(selectcolorinfo, []);
				this.data.push(newhighlighter);
				Highlighter.moveTo(keywordItems, newhighlighter);
			}
			this.refresh();
		});
	}

	/**
	 * 
	 * @param offset 
	 */
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

	/**
	 * 
	 * @param offset 
	 */
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

	/**
	 * 
	 * @param editors 
	 */
	refresh(editors?: vscode.TextEditor[]) {
		this._onDidChangeTreeData.fire();
		this.data.forEach(highlighter => highlighter.refresh(editors));
	}

	/**
	 * 
	 * @param context 
	 */
	constructor(private context: vscode.ExtensionContext) {
		this.data = [
			new Highlighter(this.ColorSet.Green, [])
		];
	}

	/**
	 * 
	 * @param element 
	 */
	getTreeItem(element: KeywordItem | Highlighter): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	/**
	 * 
	 * @param element 
	 */
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

/**
 * 
 */
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

	static moveTo(keyworditems: KeywordItem[], to: Highlighter) {
		keyworditems.forEach(keyworditem => {
			if (keyworditem.parent !== undefined) {
				var beforeParent = keyworditem.parent;
				if (beforeParent !== undefined) {
					beforeParent.remove(keyworditem);
				}
				to.add(keyworditem);
			}
		});
	}

	remove(keyworditem: KeywordItem) {
		var index = this.children.findIndex(value => value === keyworditem);
		if (0 <= index) {
			this.children.splice(index, 1);
		}
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

		// Define color.
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

		// If target text editors aren't inputted, all visible editors are targeted.
		if (editors === undefined) {
			editors = vscode.window.visibleTextEditors;
		}

		// Set decoration to text editors.
		let counter = 0;
		let limit = vscode.workspace.getConfiguration('multicolorhighlighter').get('upperlimit', 100000);
		editors.forEach(editor => {
			if (editor === undefined) {
				return;
			}
			const text = editor.document.getText();
			const targets: vscode.DecorationOptions[] = [];
			let match: number = -1;
			this.children.forEach(keyworditem => {
				while (0 <= (match = text.indexOf(keyworditem.label, match + 1)) && counter < limit) {
					counter++;
					const startPos = editor.document.positionAt(match);
					const endPos = editor.document.positionAt(match + keyworditem.label.length);
					targets.push({range: new vscode.Range(startPos, endPos)});
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

/**
 * 
 */
class KeywordItem extends vscode.TreeItem {
	parent: Highlighter | undefined;

	constructor(public label: string, parent?: Highlighter) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.parent = parent;
	}

	readonly contextValue = "keyworditem";
}