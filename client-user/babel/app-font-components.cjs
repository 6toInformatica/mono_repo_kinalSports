const path = require("path");

const target = path.resolve(__dirname, "../src/shared/ui/AppText.jsx");

/** Sustituye Text y TextInput de react-native por los del sistema visual. */
module.exports = function appFontComponents({ types: t }) {
  return {
    name: "app-font-components",
    visitor: {
      ImportDeclaration(nodePath, state) {
        if (nodePath.node.source.value !== "react-native") return;

        const filename = state.filename || "";
        const normalized = filename.split(path.sep).join("/");
        if (
          normalized.includes("/node_modules/") ||
          normalized.endsWith("/src/shared/ui/AppText.jsx")
        ) {
          return;
        }

        const wanted = new Set(["Text", "TextInput"]);
        const taken = [];
        const rest = [];
        for (const specifier of nodePath.node.specifiers) {
          if (
            t.isImportSpecifier(specifier) &&
            t.isIdentifier(specifier.imported) &&
            wanted.has(specifier.imported.name)
          ) {
            taken.push(specifier);
          } else {
            rest.push(specifier);
          }
        }
        if (taken.length === 0) return;

        let relative = path
          .relative(path.dirname(filename), target)
          .split(path.sep)
          .join("/");
        if (!relative.startsWith(".")) relative = `./${relative}`;

        const replacement = t.importDeclaration(
          taken.map((specifier) =>
            t.importSpecifier(
              t.identifier(specifier.local.name),
              t.identifier(specifier.imported.name),
            ),
          ),
          t.stringLiteral(relative),
        );

        if (rest.length === 0) {
          nodePath.replaceWith(replacement);
          return;
        }
        nodePath.node.specifiers = rest;
        nodePath.insertAfter(replacement);
      },
    },
  };
};
