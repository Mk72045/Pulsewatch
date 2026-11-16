// Jest must not compile our files. The project is already plain ESM.
const config = {
  testEnvironment: "node",
  transform: {},
  // Tests talk to a remote database, so allow more than the default 5 seconds.
  testTimeout: 20_000,
};

export default config;
