import { matchError } from "error";
import { AppEither, E } from "fp";
import * as YAML from "yaml";

const parseJson = <T>(str: string): AppEither<T> =>
  E.tryCatch(() => JSON.parse(str), matchError);

export type RawManifest = {
  name: string;
  dependencies?: Record<string, string>;
  files?: [];
  workspaces?: string[];
};

export const parseManifestString = (
  manifestStr: string
): AppEither<RawManifest> => parseJson(manifestStr);

export type PnpmWsYaml = {
  packages?: string[];
};

export const parsePnpmWsYaml = (str: string): AppEither<PnpmWsYaml> =>
  parseYaml(str);

const parseYaml = <T>(str: string): AppEither<T> =>
  E.tryCatch(() => YAML.parse(str), matchError);
