// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const Linter = require('./linter');
const Decorator = require('./decorator');

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
	// This line of code will only be executed once when your extension is activated

	// Get configuration
	// const contentConfig = vscode.workspace.getConfiguration('contenter');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// The code you place in the function will be executed every time your command is executed
	let lintAllCommand = vscode.commands.registerCommand('contenter.contentfyLint', function () {

		// Get the active editor
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			// Error: Unable to get the active editor
			return;
		}

		// Get the document from the editor
		let document = editor.document;

		// We can remove this as we don't really have a dependency on the document type
		if (document.languageId !== "markdown") {
			vscode.window.showInformationMessage(`Contentify: Unable to scan non-markdown document.`);
			return;
		}

		// Lint the document
		const [problematicHigh, problematicMedium, problematicLow] = Linter.lintProblematic(editor);

		// Decorate the document
		Decorator.decorate(editor, [
			{
				decorationType: Decorator.decorationTypes.sensitivity.high,
				decorationOptions: problematicHigh
			},
			{
				decorationType: Decorator.decorationTypes.sensitivity.medium,
				decorationOptions: problematicMedium
			},
			{
				decorationType: Decorator.decorationTypes.sensitivity.low,
				decorationOptions: problematicLow
			}
		]);

		// Display a message box to the user
		vscode.window.showInformationMessage(`Contenter: Finished Linting Document.`);
	});

	context.subscriptions.push(lintAllCommand);

	// When the document is saved 
	// vscode.workspace.onWillSaveTextDocument(_ => scanDocumentAgainstWordlists());
}

// this method is called when your extension is deactivated
function deactivate() { }

// Boilerplate: Entry Points for VS Code.
module.exports = {
	activate,
	deactivate
}
