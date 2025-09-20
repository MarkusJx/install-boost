import * as core from '@actions/core';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import axios from 'axios';
import { promisify } from 'util';
import * as stream from 'stream';

export interface Options {
  boost_version: string;
  toolset: string;
  platform_version: string;
  BOOST_ROOT_DIR: string;
  cache: boolean;
}

export interface OptionsV2 extends Options {
  link: string;
  arch: string;
}

export type BoostPlatform = 'windows' | 'macos' | 'linux';

export interface BoostVersion {
  filename: string;
  platform?: BoostPlatform;
  platform_version: string;
  toolset?: string;
  link?: string;
  arch?: string;
  download_url: string;
}

export interface VersionRecord {
  version: string;
  files: BoostVersion[];
}

export type VersionsRecord = VersionRecord[];

export function setOutputVariables(BOOST_ROOT: string, version: string): void {
  core.startGroup('Set output variables');
  console.log(`Setting BOOST_ROOT to '${BOOST_ROOT}'`);
  console.log(`Setting BOOST_VER to '${version}'`);
  core.endGroup();

  core.setOutput('BOOST_ROOT', BOOST_ROOT);
  core.setOutput('BOOST_VER', version);
}

export function getVersions(manifestAddress: string): Promise<VersionsRecord> {
  return axios
    .get(manifestAddress, {
      responseType: 'json',
    })
    .then((response) => {
      if (response.status === 200) {
        return response.data as VersionsRecord;
      } else {
        core.debug('Response headers: ' + response.headers);
        core.debug('Response content: ' + response.data);
        throw new Error(
          `Versions manifest request returned http status code ${response.status} with status text '${response.statusText}'`
        );
      }
    });
}

/**
 * Create a directory
 *
 * @param dir the directory to create
 */
export function createDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    console.log(`${dir} does not exist, creating it`);
    fs.mkdirSync(dir, { recursive: true });
    console.log('Done.');
  } else {
    console.log(`${dir} already exists, doing nothing`);
  }
}

type parsedVersion = {
  url: string;
  filename: string;
};

/**
 * Try to find the specified boost version
 *
 * @param versions the version object array from getVersions()
 * @param boost_version the requested boost version
 * @param toolset the requested toolset
 * @param platform_version the requested platform version
 * @returns the url and file name or throws an error if the requested version could not be found
 */
export function parseArguments(
  versions: VersionsRecord,
  boost_version: string,
  toolset: string | null,
  platform_version: string,
  link: string | null = null,
  arch: string | null = null
): parsedVersion {
  let platform: string = process.platform;
  if (platform === 'darwin') {
    platform = 'macos';
  } else if (platform === 'win32') {
    platform = 'windows';
  }

  let lastMatch: parsedVersion | null = null;

  for (const cur of versions) {
    if (cur.version && cur.version == boost_version) {
      for (const file of cur.files) {
        core.debug(`file platform: ${file.platform}`);
        if (!file.platform || file.platform != platform) {
          core.debug("File does not match param 'platform'");
          continue;
        }

        core.debug(`file toolset: ${file.toolset}`);
        if (toolset && (!file.toolset || file.toolset != toolset)) {
          core.debug("File does not match param 'toolset'");
          continue;
        } else if (!toolset && file.toolset === 'mingw' && lastMatch) {
          core.debug(
            "'toolset' is unset but this toolset is 'mingw' and a better match was found"
          );
          continue;
        }

        core.debug(`file platform version: ${file['platform_version']}`);
        if (
          platform_version.length > 0 &&
          (!file.platform_version || file.platform_version != platform_version)
        ) {
          core.debug("File does not match param 'platform_version");
          continue;
        }

        if (
          link &&
          file.link &&
          link !== file.link &&
          file.link !== 'static+shared'
        ) {
          core.debug("File does not match param 'link'");
          continue;
        } else if (!link && file.link && file.link === 'shared') {
          core.debug(
            "The file's 'link' was set to 'shared', but 'link' was not specified, ignoring this file"
          );
          continue;
        }

        if (arch && file.arch && arch !== file.arch) {
          core.debug("File does not match param 'arch'");
          continue;
        } else if (!arch && file.arch && file.arch !== 'x86') {
          core.debug(
            "The file's 'arch' was not set to 'x86', but 'arch' was not specified, ignoring this file"
          );
          continue;
        }

        core.debug(`Boost found: '${file.filename}'`);

        // Only emit warnings if this is the boost version that matches the description
        if (link && !file.link) {
          core.info(
            "The parameter 'link' was specified, which doesn't have any effect on this boost version"
          );
        }

        if (arch && !file.arch) {
          core.info(
            "The parameter 'arch' was specified, which doesn't have any effect on this boost version"
          );
        }

        lastMatch = {
          url: file.download_url,
          filename: file.filename,
        };
      }

      break;
    }
  }

  if (lastMatch) {
    return lastMatch;
  } else {
    throw new Error(`Could not find boost version ${boost_version}`);
  }
}

const finished = promisify(stream.finished);

/**
 * Download boost
 *
 * @param url the url to download from
 * @param outFile the file to download to
 */
export function downloadBoost(url: string, outFile: string): Promise<void> {
  const writer = fs.createWriteStream(outFile);

  return axios
    .get(url, {
      responseType: 'stream',
      onDownloadProgress(progressEvent) {
        core.debug(`Progress state: ${JSON.stringify(progressEvent)}`);

        if (progressEvent?.progress) {
          const percent: number = progressEvent.progress * 100;
          console.log(`Download progress: ${percent.toFixed(2)}%`);
        }
      },
    })
    .then((response) => {
      response.data.pipe(writer);
      return finished(writer);
    });
}

/**
 * Delete files
 *
 * @param files the files to delete
 */
export function deleteFiles(files: string[]): void {
  console.log(`Attempting to delete ${files.length} file(s)...`);
  for (let i = 0; i < files.length; i++) {
    let cur_file = files[i];
    if (fs.existsSync(cur_file)) {
      console.log(`${cur_file} exists, deleting it`);
      fs.unlinkSync(cur_file);
    } else {
      console.log(`${cur_file} does not exist`);
    }
  }
}

/**
 * Untar boost on linux/macOs
 *
 * @param filename the file to extract
 * @param out_dir the output directory
 * @param working_directory the working directory
 */
function untarLinux(
  filename: string,
  out_dir: string,
  working_directory: string,
  rename: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args: string[] = ['xzf', filename];
    if (rename) {
      args.push('-C', out_dir);
    }

    // Use tar to unpack boost
    const tar = spawn('tar', args, {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: working_directory,
    });

    // Reject/Resolve on close
    tar.on('close', (code) => {
      if (code != 0) {
        reject(`Tar exited with code ${code}`);
      } else {
        console.log('Tar exited with code 0');
        resolve();
      }
    });

    // Reject on error
    tar.on('error', (err) => {
      reject(`Tar failed: ${err}`);
    });
  });
}

/**
 * Unpack boost on windows using 7zip
 *
 * @param command the command array to run
 * @param working_directory the working directory to work in
 */
function run7z(
  command: Array<string>,
  working_directory: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Spawn a 7z process
    const tar = spawn('7z', command, {
      stdio: [process.stdin, process.stdout, process.stderr],
      cwd: working_directory,
    });

    // Reject/Resolve on close
    tar.on('close', (code) => {
      if (code != 0) {
        reject(`7z exited with code ${code}`);
      } else {
        console.log('7z exited with code 0');
        resolve();
      }
    });

    // Reject on error
    tar.on('error', (err) => {
      reject(`7z failed: ${err}`);
    });
  });
}

/**
 * Unpack boost using tar on unix or 7zip on windows
 *
 * @param base the output base
 * @param working_directory the working directory
 */
export async function untarBoost(
  base: string,
  working_directory: string,
  rename: boolean = true
): Promise<void> {
  if (process.platform == 'win32') {
    core.debug('Unpacking boost using 7zip');
    await run7z(['x', `${base}.tar.gz`], working_directory);

    const args = ['x', `${base}.tar`, '-aoa'];
    if (process.arch !== 'arm64') {
      args.push('-snld20');
    }

    if (rename) {
      args.push(`-o${base}`);
    }

    await run7z(args, working_directory);
  } else {
    core.debug('Unpacking boost using tar');
    createDirectory(path.join(working_directory, base));
    await untarLinux(`${base}.tar.gz`, base, working_directory, rename);
  }
}

/**
 * Clean up
 *
 * @param base_dir the base directory
 * @param base the boost base name (without .tar.gz)
 */
export function cleanup(base_dir: string, base: string) {
  if (process.platform == 'win32') {
    deleteFiles([
      path.join(base_dir, `${base}.tar.gz`),
      path.join(base_dir, `${base}.tar`),
    ]);
  } else {
    deleteFiles([path.join(base_dir, `${base}.tar.gz`)]);
  }
}
