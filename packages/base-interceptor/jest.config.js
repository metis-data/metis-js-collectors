/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  collectCoverage: true,
  coverageDirectory: ".coverage",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  rootDir: "./",
};
