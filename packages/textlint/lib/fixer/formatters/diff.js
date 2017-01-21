"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var fs = require("fs");
var isFile = require("is-file");
var jsdiff = require("diff");
var chalk = require("chalk");
/**
 * Given a word and a count, append an s if count is not one.
 * @param {string} word A word in its singular form.
 * @param {int} count A number controlling whether word should be pluralized.
 * @returns {string} The original word with an s on the end if count is not one.
 */
function pluralize(word, count) {
    return count === 1 ? word : word + "s";
}

function isModified(part) {
    if (!part) {
        return false;
    }
    return (typeof part === "undefined" ? "undefined" : _typeof(part)) === "object" && (part.removed || part.added);
}
function addMarkEachLine(mark, text) {
    if (text.length === 0) {
        return "\n";
    }
    var lines = text.split("\n");
    var markedLines = lines.filter(function (line) {
        return line.length > 0;
    }).map(function (line) {
        return mark + line;
    });
    return markedLines.join("\n") + "\n";
}
module.exports = function (results, options) {
    // default: true
    chalk.enabled = options.color !== undefined ? options.color : true;
    var output = "\n";
    var totalFixed = 0;
    var errors = 0;
    var summaryColor = "yellow";
    var greenColor = "green";

    results.forEach(function (result) {
        var filePath = result.filePath;
        var messages = result.applyingMessages;
        // still error count
        var remainingMessages = result.remainingMessages;
        errors += remainingMessages.length;
        totalFixed += messages.length;
        if (messages.length === 0) {
            return;
        }
        if (!isFile(filePath)) {
            return;
        }
        output += chalk.underline(result.filePath) + "\n";

        var originalContent = fs.readFileSync(filePath, "utf-8");
        var diff = jsdiff.diffLines(originalContent, result.output);

        diff.forEach(function (part, index) {
            var prevLine = diff[index - 1];
            var nextLine = diff[index + 1];
            if (!isModified(part) && part.count > 1) {
                var greyColor = "grey";
                /*
                    <MODIFIED>
                    first line
                    ....
                 */
                if (isModified(prevLine)) {
                    var lines = part.value.split("\n");
                    output += chalk[greyColor](lines[0]) + "\n";
                }
                output += chalk[greyColor]("...");
                if (isModified(nextLine)) {
                    var _lines = part.value.split("\n");
                    output += chalk[greyColor](_lines[_lines.length - 1]) + "\n";
                }
                /*
                    ...
                    last line
                    <MODIFIED>
                 */
                return;
            }
            // green for additions, red for deletions
            // grey for common parts
            var lineColor = void 0;
            var diffMark = "";
            if (part.added) {
                lineColor = "green";
                diffMark = "+ ";
            } else if (part.removed) {
                lineColor = "red";
                diffMark = "- ";
            } else {
                lineColor = "grey";
                diffMark = "";
            }
            output += chalk[lineColor](addMarkEachLine(diffMark, part.value));
        });
        output += "\n\n";
    });

    if (totalFixed > 0) {
        output += chalk[greenColor].bold([
        // http://www.fileformat.info/info/unicode/char/2714/index.htm
        "✔ Fixed ", totalFixed, pluralize(" problem", totalFixed), "\n"].join(""));
    }

    if (errors > 0) {
        output += chalk[summaryColor].bold([
        // http://www.fileformat.info/info/unicode/char/2716/index.htm
        "✖ Remaining ", errors, pluralize(" problem", errors), "\n"].join(""));
    }

    return totalFixed > 0 ? output : "";
};
//# sourceMappingURL=diff.js.map