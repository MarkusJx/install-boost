import { createDirectory, deleteFiles, downloadBoost, getVersions, parseArguments } from "./shared";

import core = require('@actions/core');
import path = require('path');
import { spawn } from "child_process";

const IS_WIN32: boolean = process.platform == "win32";
const VERSION_MANIFEST_ADDR: string = "https://raw.githubusercontent.com/actions/boost-versions/main/versions-manifest.json";

/**
 * Untar boost on linux/macOs
 * 
 * @param filename the file to extract
 * @param out_dir the output directory
 * @param working_directory the working directory
 */
function untarLinux(filename: string, out_dir: string, working_directory: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Use tar to unpack boost
        const tar = spawn("tar", ["xzf", filename, "-C", out_dir], {
            stdio: [process.stdin, process.stdout, process.stderr],
            cwd: working_directory
        });

        // Reject/Resolve on close
        tar.on('close', (code) => {
            if (code != 0) {
                reject(`Tar exited with code ${code}`);
            } else {
                console.log("Tar exited with code 0")
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
function run7z(command: Array<string>, working_directory: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Spawn a 7z process
        const tar = spawn("7z", command, {
            stdio: [process.stdin, process.stdout, process.stderr],
            cwd: working_directory
        });

        // Reject/Resolve on close
        tar.on('close', (code) => {
            if (code != 0) {
                reject(`7z exited with code ${code}`);
            } else {
                console.log("7z exited with code 0")
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
async function untarBoost(base: string, working_directory: string): Promise<void> {
    if (IS_WIN32) {
        core.debug("Unpacking boost using 7zip");
        await run7z(['x', `${base}.tar.gz`], working_directory);
        await run7z(['x', `${base}.tar`, '-aoa', `-o${base}`], working_directory);
    } else {
        core.debug("Unpacking boost using tar");
        createDirectory(path.join(working_directory, base));
        await untarLinux(`${base}.tar.gz`, base, working_directory);
    }
}

/**
 * Clean up
 * 
 * @param base_dir the base directory
 * @param base the boost base name (without .tar.gz)
 */
function cleanup(base_dir: string, base: string) {
    if (IS_WIN32) {
        deleteFiles([path.join(base_dir, `${base}.tar.gz`), path.join(base_dir, `${base}.tar`)]);
    } else {
        deleteFiles([path.join(base_dir, `${base}.tar.gz`)]);
    }
}

export default async function installV1(boost_version: string, toolset: string, platform_version: string, BOOST_ROOT_DIR: string): Promise<void> {
    console.log("Using legacy install method");
    console.log("Downloading versions-manifest.json...");
    const versions: Object[] = await getVersions(VERSION_MANIFEST_ADDR);

    console.log("Parsing versions-manifest.json...");
    const ver_data = parseArguments(versions, boost_version, toolset, platform_version);
    const download_url = ver_data.url;
    const filename = ver_data.filename;

    core.startGroup(`Create ${BOOST_ROOT_DIR}`);
    createDirectory(BOOST_ROOT_DIR);
    core.endGroup();

    core.startGroup("Download Boost");
    await downloadBoost(download_url, path.join(BOOST_ROOT_DIR, filename));
    core.endGroup();

    let base_dir: string = filename.substring(0, filename.lastIndexOf("."));
    base_dir = base_dir.substring(0, base_dir.lastIndexOf("."));
    const BOOST_ROOT: String = path.join(BOOST_ROOT_DIR, base_dir);

    core.debug(`Boost base directory: ${base_dir}`);

    core.startGroup(`Extract ${filename}`);
    await untarBoost(base_dir, BOOST_ROOT_DIR);
    core.endGroup();

    core.startGroup("Clean up");
    cleanup(BOOST_ROOT_DIR, base_dir);
    core.endGroup();

    core.startGroup("Set output variables");
    console.log(`Setting BOOST_ROOT to '${BOOST_ROOT}'`);
    console.log(`Setting BOOST_VER to '${base_dir}'`);
    core.endGroup();

    core.setOutput("BOOST_ROOT", BOOST_ROOT);
    core.setOutput("BOOST_VER", base_dir);
}
