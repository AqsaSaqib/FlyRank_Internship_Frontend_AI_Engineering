import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import testingLibrary from "eslint-plugin-testing-library";

/**
 * Tests find things the way users do: by role, label and text. These
 * patterns tie a test to markup details instead, so renaming a CSS class or
 * restructuring a div would break it. Lint fails if any of them appear.
 */
const markupQueries = [
  {
    selector: "MemberExpression[property.name=/^(get|getAll|query|queryAll|find|findAll)ByTestId$/]",
    message: "Don't query by test ID. Use getByRole / getByLabelText / getByText.",
  },
  {
    selector: "CallExpression[callee.name=/ByTestId$/]",
    message: "Don't query by test ID. Use getByRole / getByLabelText / getByText.",
  },
  {
    selector: "MemberExpression[property.name=/^(querySelector|querySelectorAll|getElementsByClassName|getElementsByTagName)$/]",
    message: "Don't query the DOM directly. Use getByRole / getByLabelText / getByText (with `within`).",
  },
  {
    selector: "JSXAttribute[name.name='data-testid'], Literal[value=/data-testid/], TemplateElement[value.raw=/data-testid/]",
    message: "No data-testid. Give the element an accessible role or label and query that.",
  },
  {
    selector: "MemberExpression[property.name=/^(className|classList)$/], CallExpression[callee.property.name='toHaveClass']",
    message: "Don't assert on class names: renaming a class must not break a test.",
  },
  {
    selector: "CallExpression[callee.property.name=/^(toMatchSnapshot|toMatchInlineSnapshot)$/]",
    message: "No snapshots: assert on what the user sees instead.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Vitest + React Testing Library.
  {
    files: ["**/*.test.{ts,tsx}"],
    ...testingLibrary.configs["flat/react"],
    rules: {
      ...testingLibrary.configs["flat/react"].rules,
      "testing-library/prefer-user-event": "error",
      "testing-library/no-node-access": ["error", { allowContainerFirstChild: false }],
    },
  },
  // Every test file, unit and Playwright.
  {
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts", "test/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...markupQueries],
    },
  },
  // Playwright: role / label / text locators only.
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...markupQueries,
        {
          selector: "CallExpression[callee.property.name=/^(locator|\\$|\\$\\$|\\$eval|\\$\\$eval)$/]",
          message: "Use getByRole / getByLabel / getByText instead of CSS or XPath locators.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright output.
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
