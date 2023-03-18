import * as vscode from 'vscode';
import { localeString } from './i18n';
import { ColorInfo } from './MCHTree';
import { KeywordItem } from "./KeywordItem";
/**
 *
 */
export class Highlighter extends vscode.TreeItem {
    decorator: vscode.TextEditorDecorationType | undefined;
    colortype: ColorInfo;
    isActive: boolean;
    isVisible: boolean;
    private children: KeywordItem[];

    constructor(colortype: ColorInfo, children: KeywordItem[]) {
        super(colortype.name, vscode.TreeItemCollapsibleState.Expanded);
        this.isActive = false;
        this.isVisible = true;
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
        const forceVisible = vscode.workspace.getConfiguration('multicolorhighlighter').get('forcevisible', true);
        if (forceVisible && !this.isVisible) {
            this.isVisible = true;
        }
    }
    delete() {
        if (this.decorator !== undefined) {
            this.decorator.dispose();
        }
    }
    turnonoff() {
        this.isVisible = this.isVisible === true ? false : true;
    }
    refresh(editors?: Readonly<vscode.TextEditor[]>) {
        //console.log(`Call refresh ${this.colortype.name} color!`);
        if (this.decorator !== undefined) {
            this.decorator.dispose();
        }
        if (this.isVisible) {
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
                    vscode.window.showErrorMessage(localeString('multicolorhighlighter.warning.upperlimit.1') +
                        limit.toString() +
                        localeString('multicolorhighlighter.warning.upperlimit.2'));
                    return;
                }
                if (this.decorator !== undefined && 0 < targets.length) {
                    editor.setDecorations(this.decorator, targets);
                }
            });
        }
        // 
        this.description = this.isActive ? "Active" : "";
        this.iconPath = this.isVisible ? this.colortype.icon : this.colortype.hideicon;
    }

    checkExistKeyword(keyword: string | KeywordItem): boolean {
        if (keyword instanceof KeywordItem) {
            if (this.children.findIndex(value => value === keyword) < 0) {
                return false;
            }
        }
        else {
            if (this.children.findIndex(value => value.label === keyword) < 0) {
                return false;
            }
        }
        return true;
    }

    readonly contextValue = "highlighter";
}
