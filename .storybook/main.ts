import type { StorybookConfig } from "@storybook/experimental-nextjs-vite";

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-styling-webpack"
  ],
  "framework": {
    "name": "@storybook/experimental-nextjs-vite",
    "options": {}
  },
  "docs": {
    "autodocs": "tag"
  },
  "viteFinal": async (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': '.',
        },
      },
    };
  },
  "staticDirs": [
    "../public"
  ]
};
export default config;