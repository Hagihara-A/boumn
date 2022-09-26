import * as pathM from "path";
import * as proc from "process";

import { EQ, IO, STR } from "./fp.js";

export const manifestFileName = "package.json";
const pnpmWsYamlFileName = "pnpm-workspace.yaml";

export type AbsPath = {
  __tag: "absPath";
  path: string;
};

export const AbsPath = (path: string): AbsPath => ({
  __tag: "absPath",
  path,
});

export const concatPath = ({ path: base }: AbsPath, child: string): AbsPath =>
  AbsPath(pathM.join(base, child));

export const getCwd: IO.IO<AbsPath> = () => AbsPath(proc.cwd());

export const isRootDir = ({ path }: AbsPath): boolean =>
  pathM.parse(path).root === path;

export const parentDir = ({ path }: AbsPath): AbsPath =>
  AbsPath(pathM.dirname(path));

export const manifestPath = (dir: AbsPath): AbsPath =>
  concatPath(dir, manifestFileName);

export const isManifestPath = (path: string): boolean =>
  STR.includes(manifestFileName)(path);

export const pnpmWsYamlPath = (dir: AbsPath): AbsPath =>
  concatPath(dir, pnpmWsYamlFileName);

export const isPnpmWsYamlPath = (path: string): boolean =>
  STR.includes(pnpmWsYamlFileName)(path);

export const EqAbsPath: EQ.Eq<AbsPath> = EQ.contramap<string, AbsPath>(
  ({ path }) => path
)(STR.Eq);
