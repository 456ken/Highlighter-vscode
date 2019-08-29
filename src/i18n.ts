// internationalization
import localeEn from "../package.nls.json";
import localeJa from "../package.nls.ja.json";

interface LocaleEntry {
    [key: string]: string;
}
const localeTabKey = <string>JSON.parse(<string>process.env.VSCODE_NLS_CONFIG).locale;
const localeTable = Object.assign(localeEn, ((<{ [key: string]: LocaleEntry }>{ ja: localeJa })[localeTabKey] || {}));
const localeString = (key: string): string => localeTable[key] || key;
