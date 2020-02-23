import * as vscode from 'vscode';
import { localeString } from './i18n';
import { isArray } from 'util';

type ColorInfo = {
	name: string,
	code: string,
	icon: string
};

interface SaveList {
	color: string;
	keyword: string[];
}

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
		{ name: 'Red', code: '#FF0000', icon: this.context.asAbsolutePath('resources/red.svg') },
		{ name: 'Green', code: '#00FF00', icon: this.context.asAbsolutePath('resources/green.svg') },
		{ name: 'Blue', code: '#0000FF', icon: this.context.asAbsolutePath('resources/blue.svg') },
		{ name: 'Yellow', code: '#FFFF00', icon: this.context.asAbsolutePath('resources/yellow.svg') },
		{ name: 'Pink', code: '#FF00FF', icon: this.context.asAbsolutePath('resources/pink.svg') },
		{ name: 'Cyan', code: '#00FFFF', icon: this.context.asAbsolutePath('resources/cyan.svg') },
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
	 * @param arg0 
	 */
	toggle(color: string) {
		if (vscode.window.activeTextEditor === undefined) {
			return;
		}
		// Get selecting keyword.
		let region: vscode.Selection = vscode.window.activeTextEditor.selection;
		if (region.isEmpty) {
			return;
		}
		let keyword = vscode.window.activeTextEditor.document.getText(region);

		// Check keyword existence.
		let deleteOperation: boolean = false;
		this.data.forEach(highlighter => {
			const found = highlighter.keywordItems.find(value => value.label === keyword);
			if (found !== undefined && highlighter.colortype.name.toLowerCase() === color.toLowerCase()) {
				highlighter.remove(found);
				deleteOperation = true;
			}
			else if (found !== undefined) {
				highlighter.remove(found);
			}
		});
		if (deleteOperation) {
			this.refresh();
			return;
		}

		// Add keyword to target highlighter.
		let highlighter = this.data.find(highlighter => highlighter.colortype.name.toLowerCase() === color.toLowerCase());
		if (highlighter === undefined) {
			var colorinfo = this._colorset.filter(value => value.name.toLowerCase() === color.toLowerCase())[0];
			highlighter = new Highlighter(colorinfo, []);
			this.data.push(highlighter);
		}
		if (highlighter === undefined) {
			return;
		}
		highlighter.add(keyword);

		this.refresh();
	}

	/**
	 * 
	 */
	setSelect() {
		this.data.forEach(highlighter => {
			if (highlighter.isactive) {
				this.toggle(highlighter.colortype.name);
				return;
			}
		});
	}

	/**
	 * 
	 * @param target Highlighter
	 */
	changeActive(target: Highlighter) {
		var found: boolean = false;
		this.data.forEach(highlighter => {
			if (target === highlighter) {
				found = true;
				highlighter.isactive = true;
				return;
			}
		});
		if (found) {
			this.data.forEach(highlighter => {
				if (target !== highlighter) {
					highlighter.isactive = false;
				}
			});
			this.refresh();
		}
	}

	/**
	 * Save the keywordlist to workspace settings.json.
	 */
	save() {
		var config = vscode.workspace.getConfiguration("multicolorhighlighter");
		var savelist: SaveList[] = [];
		this.data.forEach(highlighter => {
			savelist.push(<SaveList>{
				color: highlighter.colortype.name,
				keyword: highlighter.keywordItems.map(keyworditem => keyworditem.label)
			});
		});

		config.update("savelist", savelist, vscode.ConfigurationTarget.Workspace).then(
			() => vscode.window.showInformationMessage(localeString("multicolorhighlighter.information.done")),
			(reason) => vscode.window.showErrorMessage(localeString("multicolorhighlighter.error") + "\n" + reason)
		);
	}

	/**
	 * Load the keywordlist from workspace settings.json.
	 */
	load(): boolean {
		const mchconfig = vscode.workspace.getConfiguration("multicolorhighlighter");
		if (mchconfig === undefined) {
			return false;
		}

		if (mchconfig.has("savelist") === false) {
			return false;
		}

		const savelist = <SaveList[]>mchconfig.get("savelist");
		const implementsSaveList = function (params: any): params is SaveList[] {
			return (params !== null &&
				typeof params === "object" &&
				isArray(params) &&
				1 <= params.length &&
				typeof params[0].color === "string" &&
				typeof params[0].keyword === "object" &&
				isArray(params[0].keyword) &&
				typeof params[0].keyword[0] === "string");
		};
		if (!implementsSaveList(savelist)) {
			return false;
		}

		savelist.forEach(obj => {
			let highlighter = new Highlighter(this._colorset.filter(value => value.name.toLowerCase() === obj.color.toLowerCase())[0], []);
			obj.keyword.forEach(key => highlighter.add(key));
			this.data.push(highlighter);
		});

		return true;
	}

	/**
	 * 
	 * @param offset 
	 */
	change(offset: vscode.TreeItem) {
		console.log(`Get value ${offset.label}.`);

		// Select color in QuickPick.
		vscode.window.showQuickPick(this._colorset.map(item => item.name)).then(select => {
			if (select === undefined) {
				return;
			}

			var wasActive = false;
			var targetItems: KeywordItem[] = [];
			if (offset instanceof Highlighter) {
				// backup and create new instance.
				(<Highlighter>offset).keywordItems.forEach(keyword => targetItems.push(new KeywordItem(keyword.label)));
				// delete selected instance.
				this.data = this.data.filter(highlighter => highlighter.colortype !== (<Highlighter>offset).colortype);
				if ((<Highlighter>offset).isactive) {
					wasActive = true;
				}
				(<Highlighter>offset).delete();
			}
			else if (offset instanceof KeywordItem) {
				// backup and create new instance.
				targetItems.push(new KeywordItem((<KeywordItem>offset).label));
				// delete selected instance.
				this.data.forEach(highlighter => {
					highlighter.keywordItems = highlighter.keywordItems.filter(keyword => keyword.label !== (<KeywordItem>offset).label);
				});
			}

			var selectcolorinfo = this._colorset.filter(value => value.name === select)[0];
			// Get a color to add keywords.
			var newhighlighter = this.data.find(value => {
				return (value.colortype === selectcolorinfo);
			});
			if (newhighlighter === undefined) {
				newhighlighter = new Highlighter(selectcolorinfo, []);
				this.data.push(newhighlighter);
			}

			targetItems.forEach(keyword => {
				if (newhighlighter !== undefined) {
					newhighlighter.add(keyword);
				}
			});
			if (newhighlighter !== undefined && wasActive) {
				this.changeActive(newhighlighter);
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
					var colorinfo = this._colorset.filter(value => value.name.toLowerCase() === select.toLowerCase())[0];
					if (this.data.findIndex(highlighter => highlighter.colortype === colorinfo) < 0) {
						var newhighlighter = new Highlighter(colorinfo, []);
						this.data.push(newhighlighter);
						this.changeActive(newhighlighter);

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
		// vscode.window.showInformationMessage('MCHTreeDataProvider constractor.');

		var result = this.load();
		if (!result) {
			this.data.push(new Highlighter(this.ColorSet.Green, []));
		}

		this.changeActive(this.data[0]);
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
	isactive: boolean;
	private children: KeywordItem[];

	constructor(colortype: ColorInfo, children: KeywordItem[]) {
		super(colortype.name, vscode.TreeItemCollapsibleState.Expanded);
		this.colortype = colortype;
		this.children = children;
		this.iconPath = colortype.icon;
		this.isactive = false;
	}

	get keywordItems() {
		return this.children;
	}
	set keywordItems(children: KeywordItem[]) {
		this.children = children;
		this.refresh();
	}

	clear() {
		this.children = [];
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
				this.children.push(keyword);
			}
		}
		else if (typeof keyword === 'string' && 0 < keyword.length) {
			if (this.children.findIndex(value => value.label === keyword) < 0) {
				this.children.push(new KeywordItem(keyword));
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
		var decbrightnessdark: number = vscode.workspace.getConfiguration('multicolorhighlighter').get('brightness.dark', 85);
		if (decbrightnessdark === undefined) {
			decbrightnessdark = 85;
		}
		var brightnessdark: string = Math.abs(decbrightnessdark).toString(16).toUpperCase();

		var decbrightnesslight: number = vscode.workspace.getConfiguration('multicolorhighlighter').get('brightness.light', 85);
		if (decbrightnesslight === undefined) {
			decbrightnesslight = 85;
		}
		var brightnesslight: string = Math.abs(decbrightnesslight).toString(16).toUpperCase();

		this.decorator = vscode.window.createTextEditorDecorationType({
			overviewRulerColor: this.colortype.code,
			overviewRulerLane: vscode.OverviewRulerLane.Center,
			borderWidth: '1px',
			borderRadius: '2px',
			borderStyle: 'solid',
			light: {
				backgroundColor: this.colortype.code + brightnesslight,
				borderColor: this.colortype.code
			},
			dark: {
				backgroundColor: this.colortype.code + brightnessdark,
				borderColor: this.colortype.code
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
			if (limit === undefined) {
				limit = 100000;
			}
			const text = editor.document.getText();
			const targets: vscode.DecorationOptions[] = [];
			let match: number = -1;
			this.children.forEach(keyworditem => {
				while (0 <= (match = text.indexOf(keyworditem.label, match + 1)) && counter < limit) {
					counter++;
					const startPos = editor.document.positionAt(match);
					const endPos = editor.document.positionAt(match + keyworditem.label.length);
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

		// 
		this.description = this.isactive ? "active" : "";
	}

	readonly contextValue = "highlighter";
}

/**
 * 
 */
class KeywordItem extends vscode.TreeItem {
	constructor(public label: string) {
		super(label, vscode.TreeItemCollapsibleState.None);
	}

	readonly contextValue = "keyworditem";
}