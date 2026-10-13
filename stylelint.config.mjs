export default {
  rules: {
    'block-no-empty': true,
    'color-no-invalid-hex': true,
    'color-no-hex': true,
    'declaration-block-no-duplicate-properties': [true, { ignore: ['consecutive-duplicates-with-different-syntaxes'] }],
    'font-family-no-duplicate-names': true,
    'keyframe-block-no-duplicate-selectors': true,
    'no-invalid-double-slash-comments': true,
    'property-no-unknown': [true, { checkPrefixed: false }],
    'unit-no-unknown': true,
  },
  overrides: [{ files: ['assets/games/community-builders/engine/tokens.css'], rules: { 'color-no-hex': null } }],
};
