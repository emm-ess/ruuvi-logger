module.exports = {
    preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
    cache: true,
    cacheDirectory: '.jestcache',
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/**/*.{js,jsx,ts,tsx,vue}'],
    roots: ['<rootDir>/src/', '<rootDir>/tests/'],
}
