const core = require('@actions/core');
const github = require('@actions/github');
const request = require('request');
const progress = require('request-progress');
const fs = require('fs');
const path = require('path');
const { spawn } = require("child_process");

const IS_WIN32: Boolean = process.platform == "win32";
const VERSION_MANIFEST_ADDR: String = "https://raw.githubusercontent.com/actions/boost-versions/main/versions-manifest.json";
const BOOST_ROOT_DIR: String = IS_WIN32 ? "D:\\boost" : "/home/runner/boost";
const VERSION: String = "0.0.1";

function downloadBoost(url: String, outFile: String): Promise<void> {
    return new Promise((resolve, reject) => {
        const req = progress(request(url));
        req.on('progress', state => {
            core.debug(`Progress state: ${JSON.stringify(state)}`)
            const percent: Number = state.percent * 100;
            console.log(`Download progress: ${percent.toFixed(2)}%`);
        });

        req.pipe(fs.createWriteStream(outFile));

        req.on('end', () => {
            console.log("Download finished");
            resolve();
        });

        req.on('error', err => {
            reject(err);
        });
    });
}

function untarLinux(filename: String, working_directory: String): Promise<void> {
    return new Promise((resolve, reject) => {
        const tar = spawn("tar", ["xzf", filename], {
            stdio: [process.stdin, process.stdout, process.stderr],
            cwd: working_directory
        });

        tar.on('close', (code) => {
            if (code != 0) {
                reject(`Tar exited with code ${code}`);
            } else {
                console.log("Tar exited with code 0")
                resolve();
            }
        });

        tar.on('error', (err) => {
            reject(`Tar failed: ${err}`);
        });
    });
}

function run7z(command: Array<String>, working_directory: String): Promise<void> {
    return new Promise((resolve, reject) => {
        const tar = spawn("7z", command, {
            stdio: [process.stdin, process.stdout, process.stderr],
            cwd: working_directory
        });

        tar.on('close', (code) => {
            if (code != 0) {
                reject(`7z exited with code ${code}`);
            } else {
                console.log("7z exited with code 0")
                resolve();
            }
        });

        tar.on('error', (err) => {
            reject(`7z failed: ${err}`);
        });
    });
}

async function untarBoost(base: String, working_directory: String): Promise<void> {
    if (IS_WIN32) {
        core.debug("Unpacking boost using 7zip");
        await run7z(['x', `${base}.tar.gz`], working_directory);
        await run7z(['x', `${base}.tar`, '-aoa', `-o${base}`], working_directory);
    } else {
        core.debug("Unpacking boost using tar");
        await untarLinux(`${base}.tar.gz`, working_directory);
    }
}

function createDirectory(dir: String) {
    if (!fs.existsSync(dir)) {
        console.log(`${dir} does not exist, creating it`);
        fs.mkdirSync(dir);
        console.log("Done.");
    } else {
        console.log(`${dir} already exists, doing nothing`);
    }
}

function getVersions(): Promise<Array<Object>> {
    return new Promise((resolve, reject) => {
        const req = request.get(VERSION_MANIFEST_ADDR);

        let dt = "";
        req.on('data', data => {
            dt += data;
        });

        req.on('end', () => {
            core.debug("Downloaded data: " + dt);
            resolve(JSON.parse(dt));
        });

        req.on('error', err => {
            reject(err.message);
        });
    });
}

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

async function main(): Promise<void> {
    const boost_version: String = core.getInput("boost_version");
    const toolset: String = core.getInput("toolset");
    const platform_version: String = core.getInput("platform_version");

    if (boost_version.length <= 0) {
        throw new Error("the boost_version variable must be defined");
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