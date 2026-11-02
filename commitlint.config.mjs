const config = {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)\(([\w-]+)\)\[(\d+)\]: (.+)$/,
      headerCorrespondence: ["type", "scope", "ticket", "subject"],
    },
  },
  plugins: [
    {
      rules: {
        "ticket-empty": ({ ticket }) => [
          Boolean(ticket),
          "タスクIDを [2201] の形で書く",
        ],
      },
    },
  ],
  rules: {
    "scope-empty": [2, "never"],
    "ticket-empty": [2, "always"],
    "subject-case": [0],
    "header-max-length": [2, "always", 100],
  },
};

export default config;
