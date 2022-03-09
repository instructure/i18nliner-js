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
