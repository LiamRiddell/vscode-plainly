// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const WORDLIST_PROBLEMATIC = require('./wordlists/problematic.json');

// Global Functions
const parseMultitextOptionsStructure = (multilineOptionsText, objectFields) => {
	// Fail: No Text
	if (!multilineOptionsText)
		return null;

	// Fail: No Fields
	if (!objectFields || objectFields == 0)
		return null;

	// Split the raw input by line
	const splitLines = multilineOptionsText.split('\n');

	// Get the line count
	const lineCount = splitLines.length;

	// Get the number of fields
	const fieldCount = objectFields.length;

	// Calculate the number of objects we're going to attempt to parse
	// Note: We add one to the field count to account for the blank line between fields
	const numberOfObjects = Math.ceil(lineCount / (fieldCount + 1));

	// Fail: Not enough lines
	if (numberOfObjects <= 0)
		return null;

	// Parsed objects array
	const parsedObjectsArray = [];

	// Keep the last line index
	let lastLineIndex = 0;

	// Begin text parsing
	for (let objectIndex = 0; objectIndex < numberOfObjects; objectIndex++) {
		// Create new object
		let objectDefinition = {};

		// Calculate the line offset due to the blank lines (starts at zero)
		let lineOffsetIndex = lastLineIndex + (objectIndex % fieldCount);

		// Populate fields
		for (let fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++) {

			// Get the field
			const fieldSchema = objectFields[fieldIndex];

			// If we're on line 2, and field 3 we know that line 6 is the second objects 3rd field text.
			// const fieldLineIndex = lineIndex === 0 ? fieldIndex : lineIndex * fieldIndex;				
			const calculatedLineIndex = lineOffsetIndex + fieldIndex;

			// Check we're not out of bounds
			const isInBounds = calculatedLineIndex < splitLines.length;

			// Break out of the loop
			if (!isInBounds)
				return;

			// Get the line
			const line = splitLines[calculatedLineIndex].trim();

			// Check the data type
			// Data Types: Text, Array
			switch (fieldSchema.fieldType.toLowerCase()) {
				case "text":
					objectDefinition[fieldSchema.fieldName] = line;
					break;

				case "array":
					objectDefinition[fieldSchema.fieldName] = line.split(",");
					break;

				default:
					objectDefinition[fieldSchema.fieldName] = line;
					break;
			}

			// Increment the line index
			lastLineIndex++;
		}

		// Validate that we've fully parsed the object by checking the field count is the same
		if (Object.keys(objectDefinition).length === fieldCount) {
			// Push the object to the parsed objects array
			parsedObjectsArray.push(objectDefinition);
		}
	}

	return parsedObjectsArray;
}


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	// Get configuration
	// const contentConfig = vscode.workspace.getConfiguration('contenter');
	// 	const parsed = parseMultitextOptionsStructure(textStorage, [
	// 		{
	// 			fieldName: "word",
	// 			fieldType: "text"
	// 		},
	// 		{
	// 			fieldName: "reason",
	// 			fieldType: "text"
	// 		},
	// 		{
	// 			fieldName: "replace_with",
	// 			fieldType: "array"
	// 		}
	// 	]);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('contenter.contentfyLint', function () {

		// The code you place here will be executed every time your command is executed
		scanDocumentAgainstWordlists();

		// Display a message box to the user
		vscode.window.showInformationMessage(`Contentify: Finished Scanning Document.`);
	});

	context.subscriptions.push(disposable);

	// When the document is saved 
	// vscode.workspace.onWillSaveTextDocument(_ => scanDocumentAgainstWordlists());
}

// this method is called when your extension is deactivated
function deactivate() { }

// The main function which scans document for the instances of the words present in the wordlists. 
// This function also handles decorating the editor.
function scanDocumentAgainstWordlists() {
	// Get the active text editor
	const editor = vscode.window.activeTextEditor;

	if (!editor)
		return;

	let document = editor.document;

	// We can remove this as we don't really have a dependency on the document type
	if (document.languageId !== "markdown") {
		vscode.window.showInformationMessage(`Contentify: Unable to scan non Markdown document.`);
		return;
	}

	// Get the document text
	const documentText = document.getText();

	// Decorations
	const decorationsArray = new Array();

	// Create Editor Decoration
	const warningDecorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: "rgba(253, 167, 0, 0.24)",
		//textDecoration: "underline dotted yellow"
	});

	for (let wordDefinitionIndex = 0; wordDefinitionIndex < WORDLIST_PROBLEMATIC.length; wordDefinitionIndex++) {
		// Get the current word definition from our wordlist array
		const wordDefinition = WORDLIST_PROBLEMATIC[wordDefinitionIndex];

		// Generate a regex pattern for this word
		// 1. Global Search = g
		// 2. Ignore Case = i
		// 3. Generate indices for substring matches = d
		var searchWordRegex = new RegExp(`${wordDefinition.word}`, 'gid');

		// Search the document for the dynamic regex
		var searchResults = [...documentText.matchAll(searchWordRegex)];

		// If we have no results then check the next word
		if (!searchResults)
			return;

		for (let searchResultIndex = 0; searchResultIndex < searchResults.length; searchResultIndex++) {
			const searchResult = searchResults[searchResultIndex];

			// Get the line number by counting the number of newline characters (\n) before the character position
			// Use VS Code to get the line number and character position of the match. Saves us doing the above.
			const startPos = document.positionAt(searchResult.index);
			const endPos = document.positionAt(searchResult.index + wordDefinition.word.length);
			const range = new vscode.Range(startPos, endPos);

			/// Create Hover message (uses markdown)
			const capitalizedWord = wordDefinition.word.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
			const markdownTemplate = new vscode.MarkdownString("", false);
			markdownTemplate.isTrusted = true;

			// Title
			markdownTemplate.appendMarkdown(`**${capitalizedWord}**`);
			markdownTemplate.appendText("\n");

			// Codeblock used for description
			markdownTemplate.appendMarkdown(`*${wordDefinition.reason}*`);
			markdownTemplate.appendText("\n");

			// Alternatives
			markdownTemplate.appendMarkdown(`Alternatives:`);
			markdownTemplate.appendText("\n");

			wordDefinition.replace_with.forEach(replaceWord => {
				markdownTemplate.appendMarkdown(`- ${replaceWord}`);
				markdownTemplate.appendText("\n");
			});

			markdownTemplate.appendMarkdown(`______________________`);
			markdownTemplate.appendText("\n");
			markdownTemplate.appendMarkdown(`*Provided by Contenter*`);

			// Create Decoration
			const decoration = {
				range: range,
				hoverMessage: markdownTemplate
			}

			// Push the decoration to our array
			decorationsArray.push(decoration);
		}
	}

	// Set the decorations
	if (decorationsArray.length > 0)
		editor.setDecorations(warningDecorationType, decorationsArray);

}

// Boilerplate: Entry Points for VS Code.
module.exports = {
	activate,
	deactivate
}
