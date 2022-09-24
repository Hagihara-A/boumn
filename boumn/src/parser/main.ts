import { matchError } from "error";
import * as YAML from "yaml";

import { E } from "../fp.js";
import { AppEither } from "../index.js";

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
