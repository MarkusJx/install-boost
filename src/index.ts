const core = require('@actions/core');
const github = require('@actions/github');
const request = require('request');
const progress = require('request-progress');
const fs = require('fs');
const path = require('path');
const { spawn } = require("child_process");

const IS_WIN32: Boolean = process.platform == "win32";
const VERSION_MANIFEST_ADDR: String = "https://raw.githubusercontent.com/actions/boost-versions/main/versions-manifest.json";
var BOOST_ROOT_DIR: String = path.join(process.env.GITHUB_WORKSPACE, 'boost');
const VERSION: String = "1.0.0";

/**
 * Download boost
 * 
 * @param url the url to download from
 * @param outFile the file to download to
 */
function downloadBoost(url: String, outFile: String): Promise<void> {
    return new Promise((resolve, reject) => {
        // Get the request with progress
        const req = progress(request(url));
        req.on('progress', state => {
            // Log the progress
            core.debug(`Progress state: ${JSON.stringify(state)}`)
            const percent: Number = state.percent * 100;
            console.log(`Download progress: ${percent.toFixed(2)}%`);
        });

        // Pipe to outFile
        req.pipe(fs.createWriteStream(outFile));

        // Resolve on download finished
        req.on('end', () => {
            console.log("Download finished");
            resolve();
        });

        // Fail on error
        req.on('error', err => {
            reject(err);
        });
    });
}

/**
 * Untar boost on linux/macOs
 * 
 * @param filename the file to extract
 * @param out_dir the output directory
 * @param working_directory the working directory
 */
function untarLinux(filename: String, out_dir: String, working_directory: String): Promise<void> {
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
function run7z(command: Array<String>, working_directory: String): Promise<void> {
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
async function untarBoost(base: String, working_directory: String): Promise<void> {
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
 * Create a directory
 * 
 * @param dir the directory to create
 */
function createDirectory(dir: String): void {
    if (!fs.existsSync(dir)) {
        console.log(`${dir} does not exist, creating it`);
        fs.mkdirSync(dir);
        console.log("Done.");
    } else {
        console.log(`${dir} already exists, doing nothing`);
    }
}

/**
 * Get a list of the available boost versions
 * 
 * @returns an array with the version data
 */
function getVersions(): Promise<Array<Object>> {
    return new Promise((resolve, reject) => {
        const req = request.get(VERSION_MANIFEST_ADDR);

        // Append data to the data object
        let dt = "";
        req.on('data', data => {
            dt += data;
        });

        // Resolve on end with the data
        req.on('end', () => {
            core.debug("Downloaded data: " + dt);
            resolve(JSON.parse(dt));
        });

        // Reject on error
        req.on('error', err => {
            reject(err.message);
        });
    });
}

/**
 * Try to find the specified boost version
 * 
 * @param versions the version object array from getVersions()
 * @param boost_version the requested boost version
 * @param toolset the requested toolset
 * @param platform_version the requested platform version
 * @returns the url and file name or throws an error if the requested version could not be found
 */
function parseArguments(versions: Array<Object>, boost_version: String, toolset: String, platform_version: String): { url: String, filename: String } {
    for (let i = 0; i < versions.length; i++) {
        let cur = versions[i];
        if (cur.hasOwnProperty("version") && cur["version"] == boost_version) {
            let files: Array<Object> = cur["files"];
            for (let j = 0; j < files.length; j++) {
                let file: Object = files[j];

                core.debug(`file platform: ${file["platform"]}`);
                if (!file.hasOwnProperty("platform") || file["platform"] != process.platform) {
                    core.debug("File does not match param 'platform'");
                    continue;
                }

                core.debug(`file toolset: ${file["toolset"]}`);
                if (toolset.length > 0 && (!file.hasOwnProperty("toolset") || file["toolset"] != toolset)) {
                    core.debug("File does not match param 'toolset'");
                    continue;
                }

                core.debug(`file platform version: ${file["platform_version"]}`);
                if (platform_version.length > 0 && (!file.hasOwnProperty("platform_version") || file["platform_version"] != platform_version)) {
                    core.debug("File does not match param 'platform_version");
                    continue;
                }

                return { url: file["download_url"], filename: file["filename"] };
            }

            break;
        }
    }

    throw new Error(`Could not find boost version ${boost_version}`);
}

/**
 * Delete files
 * 
 * @param files the files to delete
 */
function deleteFiles(files: String[]): void {
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
 * Clean up
 * 
 * @param base_dir the base directory
 * @param base the boost base name (without .tar.gz)
 */
function cleanup(base_dir: String, base: String) {
    if (IS_WIN32) {
        deleteFiles([path.join(base_dir, `${base}.tar.gz`), path.join(base_dir, `${base}.tar`)]);
    } else {
        deleteFiles([path.join(base_dir, `${base}.tar.gz`)]);
    }
}

async function main(): Promise<void> {
    const boost_version: String = core.getInput("boost_version");
    const toolset: String = core.getInput("toolset");
    const platform_version: String = core.getInput("platform_version");
    const boost_install_dir: String = core.getInput("boost_install_dir");

    if (boost_version.length <= 0) {
        throw new Error("the boost_version variable must be defined");
    }

    if (boost_install_dir.length > 0) {
        BOOST_ROOT_DIR = path.join(boost_install_dir, 'boost');
        console.log(`The install directory was manually changed to ${BOOST_ROOT_DIR}`);
    }

    console.log("Downloading versions-manifest.json...");
    const versions: Object[] = await getVersions();

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

    let base_dir: String = filename.substring(0, filename.lastIndexOf("."));
    base_dir = base_dir.substring(0, base_dir.lastIndexOf("."));
    const BOOST_ROOT: String = path.join(BOOST_ROOT_DIR, base_dir);

    core.debug(`Boost base directory: ${base_dir}`);

    core.startGroup(`Extract ${filename}`);
    await untarBoost(base_dir, BOOST_ROOT_DIR);
    core.endGroup();

    core.startGroup("Clean up");
    cleanup(BOOST_ROOT_DIR, base_dir);
    core.endGroup();

    core.startGroup("Set output variables")
    console.log(`Setting BOOST_ROOT to '${BOOST_ROOT}'`);
    console.log(`Setting BOOST_VER to '${base_dir}'`);
    core.endGroup();

    core.setOutput("BOOST_ROOT", BOOST_ROOT);
    core.setOutput("BOOST_VER", base_dir);
}

try {
    console.log(`Starting install-boost@${VERSION}`);
    main().then(() => {
        console.log(`install-boost@${VERSION} finished successfully`);
    }, (reject) => {
        core.setFailed(reject);
    });
} catch (error) {
    core.setFailed(error.message);
}