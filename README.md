# boumn
boumn is the __bundler for monorepo__.

boumn bundles packages in your monorepo and rewrite `package.json#dependencies` such as  `workspace:*` into `file:./pkg-name`, so that npm can interpret them correctly.

boumn is especially useful for bundling a nodejs apps in private monorepo for deploying some services like `firebase functions`. If you adopt monorepo strategy in your private repository, you have to publish packages in monorepo to private registory so that the platform you deployed can find them. You can avoid such complexity using boumn. boumn can bundle packages in monorepo so that the platform can find them locally(not in private registory). boumn is originally developed for `firebase functions`, but is not limited to.

If your monorepo repository is public, don't use boumn. Just publish packages publicly.

# Getting started
`npm i boumn`

`npx boumn --out=out --target=my-pkg`

This command says like this.
> Hey boumn! Bundle all dependencies referenced in the package named `my-pkg` and outout standalone package into `./out` dirctory! But wait, I don't want to bundle packages not in monorepo like `lodash` or `date-fns`. I will find them in public registry. I just want you to bundle __packages in monorepo__, like packages named `my-company-secret-utils` and `my-company-secret-logic`.
