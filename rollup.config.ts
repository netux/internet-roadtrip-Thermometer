import babelPlugin from '@rollup/plugin-babel';
import commonjsPlugin from '@rollup/plugin-commonjs';
import jsonPlugin from '@rollup/plugin-json';
import resolvePlugin from '@rollup/plugin-node-resolve';
import replacePlugin from '@rollup/plugin-replace';
import { isAbsolute, basename, relative, resolve } from 'node:path';
import {
  type NormalizedReadResult as NormalizedPackageReadResult,
  readPackageUp,
} from 'read-package-up';
import { defineConfig } from 'rollup';
import tlaPlugin from 'rollup-plugin-tla';
import postcssPlugin from 'rollup-plugin-postcss';
import userscript from '@netux/rollup-plugin-userscript';
import { MOD_DOM_SAFE_PREFIX } from './src/constants';

const { packageJson } =
  /** @type {import('read-package-up').NormalizedReadResult} */ (await readPackageUp()) as NormalizedPackageReadResult;
const extensions = ['.ts', '.tsx', '.mjs', '.js', '.jsx'];

export default defineConfig({
  input: 'src/index.tsx',
  plugins: [
    postcssPlugin({
      inject: false,
      minimize: false,
      modules: {
        generateScopedName: (className: string, fileName: string) => {
          const fileStem = basename(fileName, '.module.css');
          return `${MOD_DOM_SAFE_PREFIX}${fileStem}-${className}`;
        },
      },
    }),
    babelPlugin({
      // import helpers from '@babel/runtime'
      babelHelpers: 'runtime',
      plugins: [
        [
          import.meta.resolve('@babel/plugin-transform-runtime'),
          {
            useESModules: true,
            version: '^7.5.0', // see https://github.com/babel/babel/issues/10261#issuecomment-514687857
          },
        ],
      ],
      exclude: 'node_modules/**',
      extensions,
    }),
    replacePlugin({
      values: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      },
      preventAssignment: true,
    }),
    resolvePlugin({ browser: false, extensions }),
    commonjsPlugin(),
    jsonPlugin(),
    tlaPlugin(),
    userscript((meta) => {
      const metaJson = metadataToJson(meta);

      metaJson.author = packageJson.author!.name;
      metaJson.version = packageJson.version;

      return jsonToMetadata(metaJson);
    }),
  ],
  external: defineExternal([
    'internet-roadtrip-framework',
    '@violentmonkey/ui',
    '@violentmonkey/dom',
  ]),
  output: {
    format: 'iife',
    file: `dist/thermometer.user.js`,
    globals: {
      'internet-roadtrip-framework': 'IRF',
      '@violentmonkey/dom': 'VM',
      '@violentmonkey/ui': 'VM',
    },
    indent: false,
  },
});

function defineExternal(
  externals: (string | RegExp | ((id: string) => boolean))[],
) {
  return (id: string) =>
    externals.some((pattern) => {
      if (typeof pattern === 'function') return pattern(id);
      if (pattern instanceof RegExp) return pattern.test(id);
      if (isAbsolute(pattern))
        return !relative(pattern, resolve(id)).startsWith('..');
      return id === pattern || id.startsWith(pattern + '/');
    });
}

function metadataToJson(meta: string): Record<string, string | boolean> {
  const metaLines = meta.split('\n');

  let metaStartLineIdx = metaLines.indexOf('// ==UserScript==');
  if (metaStartLineIdx < 0) {
    metaStartLineIdx = 0;
  }

  let metaEndLineIdx = metaLines.indexOf('// ==/UserScript==');
  if (metaEndLineIdx < 0) {
    metaEndLineIdx = metaLines.length - 1;
  }

  const result = {};

  for (let i = metaStartLineIdx + 1; i < metaEndLineIdx; i++) {
    const line = metaLines[i];

    const match = /^\/\/ @(?<key>\w+)(?:\s+(?<value>.+)?)/.exec(line);
    if (match == null) {
      continue;
    }

    const { key, value } = match.groups!;

    if (value == null) {
      // boolean, i.e. @noframes

      if (key in result) {
        throw new Error(
          `Userscript metadata '${key}' was provided twice: once with a value, and once without`,
        );
      }

      result[key] = true;
    } else {
      if (Array.isArray(result[key])) {
        result[key].push(value);
      } else if (key in result) {
        result[key] = [result[key], value];
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

function jsonToMetadata(object: Record<string, unknown>): string {
  const keyPadding =
    Math.max(...Object.keys(object).map((key) => key.length)) + 1;

  const entries = Object.entries(object).map(([key, value]) => {
    const toString = (key: string, singleValue: unknown) => {
      const paddedKey = key.padEnd(keyPadding, ' ');

      switch (typeof singleValue) {
        case 'number':
        case 'string': {
          return `// @${paddedKey} ${singleValue}`;
        }
        case 'boolean': {
          if (!value) return '';
          return `// @${paddedKey}`;
        }
        default: {
          throw new Error(
            `Unsupported value type ${typeof singleValue} '${new String(singleValue)}' (provided for userscript metadata '${key}')`,
          );
        }
      }
    };

    if (Array.isArray(value)) {
      return value.map((singleValue) => toString(key, singleValue)).join('\n');
    } else {
      return toString(key, value);
    }
  });

  return [`// ==UserScript==`, ...entries, `// ==/UserScript==`]
    .join('\n')
    .replaceAll(/^(?:\/\/ )?\s*$/gm, ''); // begone empty lines
}
