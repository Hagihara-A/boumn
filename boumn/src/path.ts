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

type RelativePath = {
  __tag: "relativePath";
  path: string;
};

export const concatPath = ({ path: base }: AbsPath, child: string): AbsPath =>
  AbsPath(pathM.join(base, child));

export const getCwd: IO.IO<AbsPath> = () => AbsPath(proc.cwd());

export const isRootDir = ({ path }: AbsPath): boolean =>
  pathM.parse(path).root === path;

export const parentDir = ({ path }: AbsPath): AbsPath =>
  AbsPath(pathM.dirname(path));

export const deriveManifestPath = (dir: AbsPath): AbsPath =>
  concatPath(dir, manifestFileName);
export const derivePnpmWsYamlPath = (dir: AbsPath): AbsPath =>
  concatPath(dir, pnpmWsYamlFileName);

export const EqAbsPath: EQ.Eq<AbsPath> = EQ.contramap<string, AbsPath>(
  ({ path }) => path
)(STR.Eq);
