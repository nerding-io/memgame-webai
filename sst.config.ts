/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "memgame-webai",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile: "iamfiscus",
        },
      },
      domain: {
        name: "memgame.nerding.io",
        dns: false,
      },
    };
  },
  async run() {
    new sst.aws.StaticSite("MemGameSite", {
      path: "site",
      domain: "memgame.nerding.io",
      // dns: sst.aws.dns({
      //   zone: "nerding.io",
      // }),
    });
  },
});
