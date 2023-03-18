import * as vscode from 'vscode';
import { localeString } from './i18n';
import { Highlighter } from './Highlighter';
import { KeywordItem } from './KeywordItem';

export type ColorInfo = {
	name: string,
	code: string,
	icon: string,
	hideicon: string
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
		{ name: 'Red'   , code: '#FF0000', icon: this.context.asAbsolutePath('resources/red.svg'), hideicon: this.context.asAbsolutePath('resources/transparence.svg') },
		{ name: 'Green' , code: '#00FF00', icon: this.context.asAbsolutePath('resources/green.svg'), hideicon: this.context.asAbsolutePath('resources/transparence.svg') },
		{ name: 'Blue'  , code: '#0000FF', icon: this.context.asAbsolutePath('resources/blue.svg'), hideicon: this.context.asAbsolutePath('resources/transparence.svg') },
		{ name: 'Yellow', code: '#FFFF00', icon: this.context.asAbsolutePath('resources/yellow.svg'), hideicon: this.context.asAbsolutePath('resources/transparence.svg') },
		{ name: 'Pink'  , code: '#FF00FF', icon: this.context.asAbsolutePath('resources/pink.svg'), hideicon: this.context.asAbsolutePath('resources/transparence.svg') },
		{ name: 'Cyan'  , code: '#00FFFF', icon: this.context.asAbsolutePath('resources/cyan.svg'), hideicon: this.context.asAbsolutePath('resources/transparence.svg') },
	];
	colorSet = {
		red: this._colorset[0],
		green: this._colorset[1],
		blue: this._colorset[2],
		yellow: this._colorset[3],
		pink: this._colorset[4],
		cyan: this._colorset[5],
	};

	/**
	 * 
	 */
    hideshow(target: Highlighter) {
		var found: boolean = false;
		const highlighter = this.data.find(highlighter => target === highlighter);
		if (highlighter === undefined) {
			return;
		}
		highlighter.turnonoff();
		this.refresh();
	}
	
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
			if (highlighter.isActive) {
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
				highlighter.isActive = true;
				return;
			}
		});
		if (found) {
			this.data.forEach(highlighter => {
				if (target !== highlighter) {
					highlighter.isActive = false;
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
			() => vscode.window.showInformationMessage(localeString('multicolorhighlighter.information.done')),
			(reason) => vscode.window.showErrorMessage(localeString('multicolorhighlighter.error') + "\n" + reason)
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
		const implementsSaveList = (params: any): boolean => {
			if (params === null ||
				typeof params !== 'object' ||
				!Array.isArray(params) ||
				params.length < 1)
			{
				return false;
			}
			for (const param of params) {
				if (typeof param.color !== "string" ||
					typeof param.keyword !== "object" ||
					!Array.isArray(param.keyword))
				{
					return false;
				}
				for (const keyword of param.keyword)
				{
					if (typeof keyword !== "string") {
						return false;
					}
				}
			}

			return true;
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
				if ((<Highlighter>offset).isActive) {
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
				if (keyword === undefined) {
					return;
				}
				if (this.checkExistKeyword(keyword)) {
					return;
				}
				offset.add(keyword);
				offset.refresh();
				this.refresh();
			});
		}
	}

    edit(keywordItem: vscode.TreeItem) {
		if (keywordItem.contextValue !== "keyworditem") {
			return;
		}
		if (typeof keywordItem.label === "undefined") {
			return;
		}
		let currentKeyword = typeof keywordItem.label === "string" ? keywordItem.label : keywordItem.label.label;
		
		vscode.window.showInputBox({placeHolder: "Input keyword.", value: currentKeyword}).then(newKeyword => {
			if (newKeyword === undefined) {
				return;
			}
			if (!this.checkExistKeyword(newKeyword)) {
				keywordItem.label = newKeyword;
				this.refresh();
			}
		});
    }

	/**
	 * 
	 * @param editors 
	 */
	refresh(editors?: Readonly<vscode.TextEditor[]>) {
		this._onDidChangeTreeData.fire(null);
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
			this.data.push(new Highlighter(this.colorSet.green, []));
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

	/**
	 * 
	 * @param keyword 
	 */
	private checkExistKeyword(keyword: string, showInfo = true): boolean {
		let result: boolean = false;
		this.data.forEach(highlighter => {
			if (highlighter.checkExistKeyword(keyword)) {
				result = true;
				return;
			}
		});
		if (result && showInfo) {
			vscode.window.showInformationMessage(localeString('multicolorhighlighter.warning.existkeyword'));
		}
		return result;
	}
}

