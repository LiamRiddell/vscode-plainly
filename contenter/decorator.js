const vscode = require('vscode');

const Decorator = {
    decorationTuples: [],
    decorationTypes: {
        sensitivity: {
            high: vscode.window.createTextEditorDecorationType({
                // Style
                borderStyle: "solid",
                borderRadius: "1px",
                borderWidth: "0 0 2px 0",
                overviewRulerLane: vscode.OverviewRulerLane.Center,

                // Colours Based on theme
                light: {
                    backgroundColor: "rgba(255, 121, 121,0.2)",
                    borderColor: "rgba(235, 77, 75,1.0)",
                    overviewRulerColor: 'rgba(235, 77, 75,1.0)',
                },
                dark: {
                    backgroundColor: "rgba(255, 121, 121,0.2)",
                    borderColor: "rgba(235, 77, 75,1.0)",
                    overviewRulerColor: 'rgba(235, 77, 75,1.0)',
                },
            }),
            medium: vscode.window.createTextEditorDecorationType({
                // Style
                borderStyle: "solid",
                borderRadius: "1px",
                borderWidth: "0 0 2px 0",
                overviewRulerLane: vscode.OverviewRulerLane.Center,

                // Colours Based on theme
                light: {
                    backgroundColor: "rgba(255, 190, 118,.2)",
                    borderColor: "rgba(240, 147, 43,1.0)",
                    overviewRulerColor: 'rgba(240, 147, 43,1.0)',
                },
                dark: {
                    backgroundColor: "rgba(255, 190, 118,.2)",
                    borderColor: "rgba(240, 147, 43,1.0)",
                    overviewRulerColor: 'rgba(240, 147, 43,1.0)',
                },
            }),
            low: vscode.window.createTextEditorDecorationType({
                // Style
                borderStyle: "solid",
                borderRadius: "1px",
                borderWidth: "0 0 2px 0",
                overviewRulerLane: vscode.OverviewRulerLane.Center,

                // Colours Based on theme
                light: {
                    backgroundColor: "rgba(104, 109, 224,0.2)",
                    borderColor: "rgba(72, 52, 212,1.0)",
                    overviewRulerColor: 'rgba(72, 52, 212,1.0)',
                },
                dark: {
                    backgroundColor: "rgba(104, 109, 224,0.2)",
                    borderColor: "rgba(72, 52, 212,1.0)",
                    overviewRulerColor: 'rgba(72, 52, 212,1.0)',
                },
            }),
        }
    },

    decorate(editor, decorationTuples) {

        if (!decorationTuples || decorationTuples.length <= 0 || !editor)
            return;

        for (let decorationTupleIndex = 0; decorationTupleIndex < decorationTuples.length; decorationTupleIndex++) {
            const decorationTuple = decorationTuples[decorationTupleIndex];

            // If the fields we require are not present ignore
            if (!decorationTuple.decorationType || !decorationTuple.decorationOptions)
                continue;

            // If the there are no ranges to decorate then we can ignore
            if (decorationTuples.length <= 0)
                continue;

            // Decorate the editor
            editor.setDecorations(decorationTuple.decorationType, decorationTuple.decorationOptions);
        }
    },

    undecorate(editor) {
        // if (!decorationTuples || decorationTuples.length <= 0 || !editor)
        //     return;

        // for (let decorationTupleIndex = 0; decorationTupleIndex < decorationTuples.length; decorationTupleIndex++) {
        //     const decorationTuple = decorationTuples[decorationTupleIndex];

        //     // If the fields we require are not present ignore
        //     if (!decorationTuple.decorationType || !decorationTuple.decorationOptions)
        //         continue;

        //     // If the there are no ranges to decorate then we can ignore
        //     if (decorationTuples.length <= 0)
        //         continue;

        //     // Decorate the editor
        //     editor.setDecorations(decorationTuple.decorationType, []);
        // }

        // Clear the decorations for each type
        editor.setDecorations(this.decorationTypes.sensitivity.high, []);
        editor.setDecorations(this.decorationTypes.sensitivity.medium, []);
        editor.setDecorations(this.decorationTypes.sensitivity.low, []);
    },

    // Used when we unload our extension
    dispose() {
        this.decorationTypes.sensitivity.high.dispose();
        this.decorationTypes.sensitivity.medium.dispose();
        this.decorationTypes.sensitivity.low.dispose();
    }
};

module.exports = Decorator;