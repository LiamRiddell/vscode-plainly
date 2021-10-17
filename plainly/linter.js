const vscode = require('vscode');
const Utils = require('./utils');
const Configuration = require('./configuration');

// Word Lists
const WORDLIST_PROBLEMATIC = require('./wordlists/problematic.json');

const Linter = {
    _cachedHoverPreview: new Map(),

    lint(editor) {
        // Optimization: Decorate Everything together
        const high = [], medium = [], low = [];

        // Lint: Problematic words (provided by problematic wordlist)
        if (Configuration.get().enableWordLists.problematic) {

            const [problematicHigh, problematicMedium, problematicLow] = this.lintProblematic(editor);

            // Spread push our problematic words to the severity arrays
            high.push(...problematicHigh);
            medium.push(...problematicMedium);
            low.push(...problematicLow);
        }

        // Note: We can add additional linters here

        // Use array deconstruction to access individual arrays
        return [high, medium, low];
    },

    lintProblematic(editor) {
        // Lint the document against the problematic wordlist
        // We also provide a callback that's called when we're generating the hover markdown
        return this._lintDocumentAgainstWordlist(editor.document, WORDLIST_PROBLEMATIC, (word, wordDefinition, markdownTemplate) => {
            // Title
            const capitalizedWord = Utils.capitaliseFirstLetters(word);
            markdownTemplate.appendMarkdown(`**${capitalizedWord}**`);
            markdownTemplate.appendText("\n");

            // Add sensitivity
            markdownTemplate.appendText("\n");
            markdownTemplate.appendMarkdown(`______________________`);
            markdownTemplate.appendText("\n");
            const sensitivity = Utils.capitaliseFirstLetters(wordDefinition.sensitivity) || "Low";
            markdownTemplate.appendText(`Sensitivity: ${sensitivity}`);
            markdownTemplate.appendText("\n");
            markdownTemplate.appendMarkdown(`______________________`);
            markdownTemplate.appendText("\n");

            // Codeblock used for description
            markdownTemplate.appendMarkdown(`*${wordDefinition.reason}*`);
            markdownTemplate.appendText("\n");

            // Alternatives
            if (wordDefinition.replacements && wordDefinition.replacements.length > 0) {
                markdownTemplate.appendMarkdown(`Replacement(s): `);
                for (let i = 0; i < wordDefinition.replacements.length; i++) {
                    const word = wordDefinition.replacements[i];

                    if (i === 0) {
                        markdownTemplate.appendMarkdown(`${word}`);
                    } else {
                        markdownTemplate.appendMarkdown(`, ${word}`);
                    }
                }
            }

            // Plugin signature
            markdownTemplate.appendText("\n");
            markdownTemplate.appendMarkdown(`______________________`);
            markdownTemplate.appendText("\n");
            markdownTemplate.appendMarkdown(`*Provided by Plainly*`);
        });
    },

    // Private: 
    _lintDocumentAgainstWordlist(document, wordlist, hoverMessageCallback) {
        // Get the document text
        const documentText = document.getText();

        if (!documentText || documentText.length <= 0)
            return [[], [], []];

        // Get the search mode
        const isExperimentalSearchEnabled = Configuration.get().experimental.search.advancedSearch;

        // Decorations based on severity
        const highDecorationsArray = [],
            mediumDecorationsArray = [],
            lowDecorationsArray = [];

        // 1. Iterate the words in the wordlist
        // 2. Search the word against the document
        // 3. Search results 
        //  a. No results goes back to step 1. 
        // 4. Generate the markdown message for the word hover
        // 5. Get the location (range) of the word in the text and create a new instance of decoration
        for (let wordDefinitionIndex = 0; wordDefinitionIndex < wordlist.length; wordDefinitionIndex++) {
            const wordDefinition = wordlist[wordDefinitionIndex];

            // Search the document for the dynamic regex
            const searchResults = [];

            // Check if the word is an array or single string 
            const isArrayOfWords = wordDefinition.word instanceof Array;

            if (isArrayOfWords) {
                for (let wordIndex = 0; wordIndex < wordDefinition.word.length; wordIndex++) {
                    const word = wordDefinition.word[wordIndex];

                    // Generate a regex pattern for this word
                    // 1. Global Search = g
                    // 2. Ignore Case = i
                    // 3. Generate indices for substring matches = d
                    const searchWordPattern = isExperimentalSearchEnabled ? word.split("").join("(?: |_|-|)") : word;
                    const searchWordRegex = new RegExp(`${searchWordPattern}`, 'gid');
                    searchResults.push(...documentText.matchAll(searchWordRegex));
                }
            } else {
                const searchWordPattern = isExperimentalSearchEnabled ? wordDefinition.word.split("").join("(?: |_|-|)") : wordDefinition.word;
                const searchWordRegex = new RegExp(`${searchWordPattern}`, 'gid');
                searchResults.push(...documentText.matchAll(searchWordRegex));
            }

            // If we have no results then check the next word
            if (!searchResults || searchResults.length <= 0)
                continue;


            // Optimization: Generate hover message for word (once) 
            let markdownTemplateCached = !isArrayOfWords ? this._cachedHoverPreview.get(wordDefinition.word) : null;
            let markdownTemplate = markdownTemplateCached || new vscode.MarkdownString("", false);

            // Optimization: Generate hover message for word (once) but cache it when we have single word
            if (!markdownTemplateCached && !isArrayOfWords) {
                // Security: This will sanitize html
                markdownTemplate.isTrusted = false;

                // Callback for populating the markdown template by reference 
                hoverMessageCallback(wordDefinition.word, wordDefinition, markdownTemplate);

                // Cache the hover preview
                this._cachedHoverPreview.set(wordDefinition.word, markdownTemplate);
            }

            // Iterate the search results and calculate the ranges
            for (let searchResultIndex = 0; searchResultIndex < searchResults.length; searchResultIndex++) {
                const searchResult = searchResults[searchResultIndex];

                // Search result word
                const word = searchResult[0];

                // Get the line number by counting the number of newline characters (\n) before the character position
                // Use VS Code to get the line number and character position of the match. Saves us doing the above.
                const startPos = document.positionAt(searchResult.index);
                const endPos = document.positionAt(searchResult.index + word.length);
                const range = new vscode.Range(startPos, endPos);

                // Optimization: Generate hover message for word (once) but cache it when we have multiple words for definition
                if (isArrayOfWords) {
                    // Try and get cached template for this word if it exists
                    markdownTemplateCached = this._cachedHoverPreview.get(word);

                    // Instantiate mardown template
                    markdownTemplate = markdownTemplateCached || new vscode.MarkdownString("", false);

                    // Security: This will sanitize html
                    markdownTemplate.isTrusted = false;

                    // Callback for populating the markdown template by reference 
                    hoverMessageCallback(word, wordDefinition, markdownTemplate);

                    // Cache the hover preview
                    this._cachedHoverPreview.set(wordDefinition.word, markdownTemplate);
                }

                // Push the decoration to an array based on severity levels
                // Default: Low
                switch (wordDefinition.sensitivity.toLowerCase()) {
                    case "high":
                        highDecorationsArray.push({
                            range: range, // The location of the word
                            hoverMessage: markdownTemplate // The hover markdown message for the word
                        });
                        break;

                    case "medium":
                        mediumDecorationsArray.push({
                            range: range, // The location of the word
                            hoverMessage: markdownTemplate // The hover markdown message for the word
                        });
                        break;

                    case "low":
                        lowDecorationsArray.push({
                            range: range, // The location of the word
                            hoverMessage: markdownTemplate // The hover markdown message for the word
                        });
                        break;

                    default:
                        lowDecorationsArray.push({
                            range: range, // The location of the word
                            hoverMessage: markdownTemplate // The hover markdown message for the word
                        });
                        break;
                }
            }
        }

        // Return the decorations by severity
        return [highDecorationsArray, mediumDecorationsArray, lowDecorationsArray];
    }
}

module.exports = Linter;

