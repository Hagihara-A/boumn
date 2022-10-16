import { Command } from "commander";
import { matchError } from "error";
import { AppEither, AppIOEither, E, FN, IO, IOE } from "fp";
import { AbsPath, concatPath, getCwd } from "fp-path";
import { argv } from "process";

export type CliOption = {
  targetName: string;
  destDir: AbsPath;
};

export const getCliOption = (): AppIOEither<CliOption> => {
  return FN.pipe(
    IOE.Do,
    IOE.bind("cwd", () => IOE.fromIO(getCwd)),
    IOE.bind("argv", () => IOE.fromIO(getArgv)),
    IOE.bind("rawCliOption", ({ argv }) => IOE.fromEither(parseArgv(argv))),
    IOE.map(({ cwd, rawCliOption: { destDir, targetName } }) => ({
      destDir: concatPath(cwd, destDir),
      targetName,
    }))
  );
};

const outOptionName = "out";
const targetOptionName = "target";

const getParser = () =>
  new Command()
    .requiredOption(
      `-${outOptionName[0]}, --${outOptionName} <path>`,
      "destination for the output of bundle"
    )
    .requiredOption(
      `-${targetOptionName[0]}, --${targetOptionName} <packageName>`,
      "package name of the bundle's entrypoint"
    );

const extractRawCliOption = (
  options: Record<string, string>
): AppEither<RawCliOption> =>
  E.tryCatch(() => {
    const { [outOptionName]: destDir, [targetOptionName]: targetName } =
      options;
    return { targetName, destDir };
  }, matchError);

type RawCliOption = {
  targetName: string;
  destDir: string;
};

const parseArgv = (argv: string[]): AppEither<RawCliOption> =>
  extractRawCliOption(getParser().parse(argv).opts());

const getArgv: IO.IO<string[]> = () => argv;
