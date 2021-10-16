const vscode = require('vscode');

const Configuration = {
    _name: "plainly",

    get() {
        return vscode.workspace.getConfiguration(Configuration._name);
    }
};

module.exports = Configuration;

