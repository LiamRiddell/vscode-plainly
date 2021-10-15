// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const Linter = require('./linter');
const Decorator = require('./decorator');
const Configuration = require('./configuration');

// 
function contenterfy(editor) {

	// Lint: Lints each wordlist only if enabled in configuration
	const [high, medium, low] = Linter.lint(editor);

	// Decorate: Highlight all the findings using sensitivity
	Decorator.decorate(editor, [
		{
			decorationType: Decorator.decorationTypes.sensitivity.high,
			decorationOptions: high
		},
		{
			decorationType: Decorator.decorationTypes.sensitivity.medium,
			decorationOptions: medium
		},
		{
			decorationType: Decorator.decorationTypes.sensitivity.low,
			decorationOptions: low
		}
	]);
}

/**
 * @param {vscode.ExtensionContext} context
 */
// This method will only be executed once when your extension is activated
function activate(context) {
	// Set the configuration on activation and register to new configuration changes
	vscode.workspace.onDidChangeConfiguration(Configuration.onConfigurationChange);
	Configuration.updateConfiguration();

	// When the document is saved 
	// vscode.workspace.onWillSaveTextDocument(_ => scanDocumentAgainstWordlists());

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// The code you place in the function will be executed every time your command is executed
	let contenterfyCommand = vscode.commands.registerCommand('contenter.lint', function () {

		// Get the active editor
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showErrorMessage("Contenter: Unable to get the active editor.")
			return;
		}

		// Starting
		vscode.window.showInformationMessage(`Contenter: Starting Document Scan.`);

		// Our main logic function
		contenterfy(editor);

		// Ending  
		vscode.window.showInformationMessage(`Contenter: Finished Scanning Document.`);
	});

	let uncontenterfyCommand = vscode.commands.registerCommand('contenter.clear', function () {

		// Get the active editor
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			vscode.window.showErrorMessage("Contenter: Unable to get the active editor.")
			return;
		}

		Decorator.undecorate(editor);
	});

	context.subscriptions.push(contenterfyCommand, uncontenterfyCommand);
}

// This method is called when your extension is deactivated
function deactivate() {
	Decorator.dispose();
}

// Boilerplate: Entry Points for VS Code.
module.exports = {
	activate,
	deactivate
}
