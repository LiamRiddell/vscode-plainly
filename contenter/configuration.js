const vscode = require('vscode');

const Configuration = {
    _name: "contenter",
    settings: {},

    updateConfiguration() {
        this.settings = vscode.workspace.getConfiguration(Configuration._name);
        console.debug("[Contenter] Configuration Updated");
    },

    onConfigurationChange(e) {
        this.updateConfiguration();
    }
};

module.exports = Configuration;

