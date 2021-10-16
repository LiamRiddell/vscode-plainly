function capitaliseFirstLetters(text) {
    return text.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
}

module.exports = {
    capitaliseFirstLetters
};

