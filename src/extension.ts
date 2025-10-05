import * as vscode from 'vscode';

async function tidyUpBackslashes() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("No active editor found.");
		return;
	}

	const document = editor.document;

	// Edit the first 10 lines or up to the last line if fewer
	const edit = new vscode.WorkspaceEdit();
	const lineCount = Math.min(10, document.lineCount);

	for (let i = 0; i < lineCount; i++) {
		const line = document.lineAt(i);
		let text = line.text;

		// Only add backslash if not already present
		if (!text.trimEnd().endsWith("\\")) {
			text = text + " \\";
		}

		// Replace the entire line with the updated version
		edit.replace(document.uri, line.range, text);
	}

	await vscode.workspace.applyEdit(edit);
	await document.save();

	vscode.window.showInformationMessage("Added backslashes to first 10 lines!");
}

export function activate(context: vscode.ExtensionContext) {
	const backslashes = vscode.commands.registerCommand('ricos-c-code-utility.cbackslashes', () => {
		tidyUpBackslashes();
	});

	context.subscriptions.push(backslashes);
}

export function deactivate() {}
