## 3.0.0

**Error reporting format**

Error reporting format was changed to make it easier to scan. Messages are now
consistently formatted as `[file]:[line]: [message]`, which is potentially a
breaking change if you were relying on the format to parse messages.

Output before this change:

```
...........................................F..F.

1)
invalid signature on line 1: <unsupported expression>
./test/fixtures/i18n_js/invalid.js

2)
invalid signature on line 4: <unsupported expression>
./test/fixtures/i18n_ts/invalid.ts

Finished in 0.9 seconds

48 files, 12 strings, 2 failures
```

Output after this change:

```
...........................................F..F.

./test/fixtures/i18n_js/invalid.js:1: invalid signature: <unsupported expression>
./test/fixtures/i18n_ts/invalid.ts:4: invalid signature: <unsupported expression>

Finished in 0.9 seconds

48 files, 12 strings, 2 failures
```

## 2.1.0

- `I18nJsExtractor#buildTranslateCall` now receives the Path as an additional
  argument, allowing access to the scope and bindings for resolving the I18n
  receiver in lexical scope.

## 2.0.0

- Added support for TypeScript
- (BREAKING) `dist/` is no longer tracked in SCM but is still available in the
  NPM package

## 1.0.0

This is primarily a re-release of old code.

- Publish under `@instructure/i18nliner`
- Upgrade to use Babel 7 for parsing
- Support for AMD/no-bundler target was dropped as it's very old. If you still
  need to include the extensions in such environments, you can use the pre-1.0.0
  versions.
- Grunt task `i18nliner.js` was removed.
- [Internal] Grunt was removed. You can now build using `yarn build`, test using
  `yarn test` and lint using `yarn lint` instead.
