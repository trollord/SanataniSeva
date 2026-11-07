// ESLint 9 flat config. Replaces .eslintrc.json: eslint-config-next@16 requires
// eslint >= 9, which defaults to flat config, and Next 16 removed `next lint`,
// so eslint is invoked directly (see the `lint` script).
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      // Scratch output dirs from `build:check` / `dev:scratch`
      ".next-*/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];
