/* eslint-disable eqeqeq */
import { assert } from 'console';
import * as vscode from 'vscode';

function getTabSizeForDocument(document: vscode.TextDocument): number {
    const editorConfig = vscode.workspace.getConfiguration("editor", document.uri);
    return editorConfig.get<number>("tabSize", 4);
}

interface Range {
	begin: number,
	end: number
}

async function tidyUpBackslashes() {
	console.log("Tidy up backslashes");
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("No active editor found.");
		return;
	}

	const document = editor.document;

	// Edit the first 10 lines or up to the last line if fewer
	const edit = new vscode.WorkspaceEdit();

	// first find all ranges with trailing backslashes
	var state : "init" | "scan" = "init";
	let ranges : Range[] = [];

	let begin : number = 0;
	for (let i = 0; i < document.lineCount; i++) {
		const line = document.lineAt(i);
		let text = line.text;

		// Only add backslash if not already present
		if (text.endsWith("\\")) {
			if(state == "init") {
				state = "scan";
				begin = i;
			}
		}
		else {
			if(state == "scan") {
				state = "init";
				ranges.push({ begin: begin, end: i});
			}
		}
	}
	assert(state == "init");

	for(let range of ranges) {
		let cleanLines : string[] = [];
		let maxLineLength : number = 0;

		// assemble clean lines
		for (let i = range.begin; i < range.end; i++) {
			let line = document.lineAt(i);
			let text = line.text;

			assert(text.endsWith("\\")); // sanity check
			text = text.substring(0, text.length - 1); // remove trailing whitespace
			assert(!text.endsWith("\\")); // don't allow for trailing double \\ backslashes
			text = text.trimEnd();
			cleanLines.push(text);
			maxLineLength = Math.max(maxLineLength, text.length);
		}
		let tab = getTabSizeForDocument(document);

		maxLineLength = maxLineLength + tab - (maxLineLength % tab);

		assert(range.end - range.begin == cleanLines.length);

		// add trailing \ with appropriate whitespaces
		for (let i = range.begin; i < range.end; i++) {
			const line = document.lineAt(i);
			let text = cleanLines.shift();
			assert(text);
			text = text || ""; // make the compiler happy

			// add whitespaces before the backslash
			text += " ".repeat(maxLineLength - text.length);
			text += "\\";

			// Replace the entire line with the updated version
			edit.replace(document.uri, line.range, text);
		}
	}

	await vscode.workspace.applyEdit(edit);
}

export function activate(context: vscode.ExtensionContext) {
	const backslashes = vscode.commands.registerCommand('ricos-c-code-utility.cbackslashes', () => {
		tidyUpBackslashes();
	});

	context.subscriptions.push(backslashes);
}

export function deactivate() {}
