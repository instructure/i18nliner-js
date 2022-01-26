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
