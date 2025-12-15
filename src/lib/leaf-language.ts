import type { languages } from "monaco-editor"

export const leafLanguageId = "leaf"

export const leafLanguageConfig: languages.LanguageConfiguration = {
  comments: {},
  brackets: [
    ["(", ")"],
    ["{", "}"],
    ["[", "]"],
  ],
  autoClosingPairs: [
    { open: "(", close: ")" },
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
}

export const leafMonarchTokens: languages.IMonarchLanguage = {
  ignoreCase: false,
  defaultToken: "",

  keywords: [
    "if",
    "else",
    "elseif",
    "endif",
    "for",
    "in",
    "endfor",
    "extend",
    "endextend",
    "export",
    "endexport",
    "import",
    "count",
    "lowercased",
    "uppercased",
    "capitalized",
    "contains",
    "date",
    "unsafeHTML",
    "dumpContext",
  ],

  operators: [
    "==",
    "!=",
    ">=",
    "<=",
    ">",
    "<",
    "&&",
    "||",
    "!",
    "+",
    "-",
    "*",
    "/",
    "%",
  ],

  brackets: [
    { open: "(", close: ")", token: "delimiter.parenthesis" },
    { open: "{", close: "}", token: "delimiter.curly" },
    { open: "[", close: "]", token: "delimiter.square" },
  ],

  tokenizer: {
    root: [
      { include: "@whitespace" },

      [
        /(#)(endif|endfor|endextend|endexport)/,
        ["delimiter.tag", "keyword.control"],
      ],

      [
        /(#)(if|else|elseif|for|extend|export|import|count|lowercased|uppercased|capitalized|contains|date|unsafeHTML|dumpContext)(\s*)(\()/,
        [
          "delimiter.tag",
          "keyword",
          "",
          {
            token: "delimiter.parenthesis",
            bracket: "@open",
            next: "@tagParams",
          },
        ],
      ],

      [
        /(#)(\w+)(\s*)(\()/,
        [
          "delimiter.tag",
          "tag",
          "",
          {
            token: "delimiter.parenthesis",
            bracket: "@open",
            next: "@tagParams",
          },
        ],
      ],

      [
        /(#)(\()/,
        [
          "delimiter.tag",
          { token: "delimiter.parenthesis", bracket: "@open", next: "@tagParams" },
        ],
      ],

      [/(#)(dumpContext)/, ["delimiter.tag", "keyword"]],

      [":", "delimiter.body"],

      [/<\/?\\w+/, { token: "tag.html", next: "@htmlTag" }],

      [/&\w+;/, "constant.character.entity"],

      [/[^#<:&]+/, ""],
    ],

    tagParams: [
      { include: "@whitespace" },

      [
        /\)/,
        { token: "delimiter.parenthesis", bracket: "@close", next: "@pop" },
      ],

      [/"/, { token: "string.quote", next: "@doubleString" }],

      [/'/, { token: "string.quote", next: "@singleString" }],

      [/\d+\.\d+/, "number.float"],
      [/\d+/, "number"],

      [/true|false|nil/, "constant.language"],

      [/in/, "keyword.control"],

      [/(==|!=|>=|<=|>|<|&&|\|\||!|\+|-|\*|\/|%)/, "operator"],

      [
        /(\w+)(\s*)(\()/,
        [
          "identifier.function",
          "",
          { token: "delimiter.parenthesis", bracket: "@open", next: "@push" },
        ],
      ],

      [/[a-zA-Z_][a-zA-Z0-9_]*/, "identifier"],

      [/,/, "delimiter.comma"],

      [/\./, "delimiter.dot"],
    ],

    doubleString: [
      [/[^"\\]+/, "string"],
      [/\\./, "string.escape"],
      [/"/, { token: "string.quote", next: "@pop" }],
    ],

    singleString: [
      [/[^'\\]+/, "string"],
      [/\\./, "string.escape"],
      [/'/, { token: "string.quote", next: "@pop" }],
    ],

    htmlTag: [
      [/\s+/, ""],
      [/[a-zA-Z_][a-zA-Z0-9_-]*/, "attribute.name"],
      [/=/, "delimiter"],
      [/"[^"]*"/, "attribute.value"],
      [/'[^']*'/, "attribute.value"],
      [/\/?>/, { token: "tag.html", next: "@pop" }],
    ],

    whitespace: [[/[ \t\r\n]+/, ""]],
  },
}

export function registerLeafLanguage(monaco: typeof import("monaco-editor")) {
  if (
    monaco.languages.getLanguages().some((lang) => lang.id === leafLanguageId)
  ) {
    return
  }

  monaco.languages.register({ id: leafLanguageId })
  monaco.languages.setLanguageConfiguration(leafLanguageId, leafLanguageConfig)
  monaco.languages.setMonarchTokensProvider(leafLanguageId, leafMonarchTokens)
}
