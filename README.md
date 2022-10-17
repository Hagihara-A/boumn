boumn is a __bundler for private monorepo repositories.__
boumn bundles packages in your monorepo and rewrites `package.json#dependencies` such as `workspace:*` into `file:./pkg-name`, so that npm can interpret them correctly.
boumn is especially useful for bundling nodejs apps in private monorepo for deploying some services, such as `firebase functions`. If you adopt monorepo in your private repository, it is necessary to publish packages in monorepo to private registry so that the deployed platform can find them. This complexity can be avoided with boumn. boumn can bundle packages in monorepo so that the platform can find them locally (not in private registry). boumn is originally developed for `firebase functions` but not limited to it.

Boumn is only useful if your monorepo repository is private.

# Getting started
`npm i boumn`

`npx boumn --out=out --target=my-pkg`

The output of this command is the following:
> Hey boumn! Bundle all dependencies referenced in the package named `my-pkg` and output standalone package into `./out` directory! But wait, I don't want to bundle packages, not in monorepo like `lodash` or `date-fns`. I will find them in public registry. I just want you to bundle __packages in monorepo__, like packages named `my-company-secret-utils` and `my-company-secret-logic`.