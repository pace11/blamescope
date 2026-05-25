import * as babel from "@babel/core";
import MagicString from "magic-string";
import path from "path";

// These packages ship no type declarations — require() avoids implicit-any errors.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const babelPluginSyntaxTypescript = require("@babel/plugin-syntax-typescript");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const babelPluginSyntaxJsx = require("@babel/plugin-syntax-jsx");

export type Injection = {
  offset: number;
  component: string;
  selfClosing: boolean;
};

/**
 * Internal Babel visitor — collects positions where data-blamescope should
 * be inserted. Does NOT generate code (code: false). MagicString does the
 * actual insertion so the rest of the source is untouched.
 */
export function makeCollectorPlugin(injections: Injection[]) {
  return function blameScopeCollect({ types: t }: { types: any }) {
    function nameFromFunc(funcPath: any): string {
      const fn = funcPath.node;
      if (t.isFunctionDeclaration(fn) && fn.id) return fn.id.name;
      const parent = funcPath.parent;
      if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id))
        return parent.id.name;
      return "";
    }

    function collect(openingElement: any, component: string) {
      if (!t.isJSXOpeningElement(openingElement)) return;
      if (
        openingElement.attributes.some(
          (a: any) =>
            t.isJSXAttribute(a) &&
            t.isJSXIdentifier(a.name) &&
            a.name.name === "data-blamescope"
        )
      )
        return;
      injections.push({
        offset: openingElement.end,
        component,
        selfClosing: openingElement.selfClosing,
      });
    }

    return {
      visitor: {
        ReturnStatement(nodePath: any) {
          let arg = nodePath.node.argument;
          if (!arg) return;
          if (arg.type === "ParenthesizedExpression") arg = arg.expression;
          if (!t.isJSXElement(arg)) return;

          const funcPath = nodePath.findParent(
            (p: any) =>
              p.isFunctionDeclaration() ||
              p.isArrowFunctionExpression() ||
              p.isFunctionExpression()
          );
          if (!funcPath) return;

          const name = nameFromFunc(funcPath);
          if (!name || !/^[A-Z]/.test(name)) return;
          collect(arg.openingElement, name);
        },

        ArrowFunctionExpression(nodePath: any) {
          let body = nodePath.node.body;
          if (body.type === "ParenthesizedExpression") body = body.expression;
          if (!t.isJSXElement(body)) return;

          const parent = nodePath.parent;
          if (!t.isVariableDeclarator(parent) || !t.isIdentifier(parent.id))
            return;

          const name: string = parent.id.name;
          if (!/^[A-Z]/.test(name)) return;
          collect(body.openingElement, name);
        },
      },
    };
  };
}

/**
 * Apply the blamescope Babel transform to a JSX/TSX source file.
 * Injects `data-blamescope` onto the root JSX element of every named
 * React component.
 *
 * Returns `null` if the file should not be transformed (non-JSX, node_modules,
 * no components found, or parse error).
 */
export function applyBlameScopeTransform(
  code: string,
  id: string,
  projectRoot: string
): { code: string; map: ReturnType<MagicString["generateMap"]> } | null {
  if (!/\.[jt]sx$/.test(id)) return null;
  if (id.includes("node_modules")) return null;

  const normalizedId = id.replace(/\\/g, "/");
  const normalizedRoot = projectRoot.replace(/\\/g, "/");
  const filePath = normalizedId.startsWith(normalizedRoot + "/")
    ? normalizedId.slice(normalizedRoot.length + 1)
    : normalizedId;

  // Pass the already-imported module — bypasses Babel's filesystem resolver
  // so the consumer project doesn't need these packages installed.
  const syntaxPlugin: any = id.endsWith(".tsx")
    ? [babelPluginSyntaxTypescript, { isTSX: true }]
    : babelPluginSyntaxJsx;

  const injections: Injection[] = [];

  try {
    babel.transformSync(code, {
      filename: id,
      plugins: [syntaxPlugin, makeCollectorPlugin(injections)],
      code: false,
      configFile: false,
      babelrc: false,
    });
  } catch (e) {
    console.error(
      "[blamescope] parse error in",
      filePath,
      e instanceof Error ? e.message : e
    );
    return null;
  }

  if (injections.length === 0) return null;

  const s = new MagicString(code);
  for (const { offset, component, selfClosing } of injections) {
    const meta = JSON.stringify({ file: filePath, component });
    const insertAt = offset - (selfClosing ? 2 : 1);
    s.prependLeft(insertAt, ` data-blamescope={'${meta}'}`);
  }

  console.log(
    `[blamescope] ✓ ${injections.map((i) => i.component).join(", ")}  (${filePath})`
  );

  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  };
}

// Keep path imported so tsup bundles it (used by callers for __dirname resolution)
void path;
