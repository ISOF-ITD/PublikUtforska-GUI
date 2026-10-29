module.exports = {
  clearMocks: true,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(gif|jpe?g|png|svg|webp)$': '<rootDir>/testFileMock.js',
  },
  // Test real HTML sanitization, including sanitize-html's ESM parser modules.
  transformIgnorePatterns: [
    'node_modules[/\\\\](?!(?:sanitize-html|htmlparser2|domhandler|domutils|dom-serializer|domelementtype|entities)(?:[/\\\\]|$))',
  ],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    }],
  },
};
