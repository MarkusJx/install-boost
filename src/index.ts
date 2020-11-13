const core = require('@actions/core');
const github = require('@actions/github');
const request = require('request');
const progress = require('request-progress');
const fs = require('fs');
const path = require('path');
const { spawn } = require("child_process");

const VERSION_MANIFEST_ADDR: string = "https://raw.githubusercontent.com/actions/boost-versions/main/versions-manifest.json";
const BOOST_ROOT_DIR = process.platform == "win32" ? "D:\\boost" : "/usr/boost";

function downloadBoost(url: String, outFile: String): Promise<void> {
    core.startGroup("Download Boost");
    return new Promise((resolve, reject) => {
        const req = progress(request(url));
        req.on('progress', state => {
            const percent = state.percentage * 100;
            console.log(`Download progress: ${percent}%`);
        });

        req.pipe(fs.createWriteStream(outFile));

        req.on('end', () => {
            core.endGroup();
            resolve();
        });

        req.on('error', err => {
            reject(err);
        });
    });
}

function untarBoost(filename: String): Promise<void> {
    return new Promise((resolve, reject) => {
        const tar = spawn("tar", ["xzvf", filename], {
            stdio: [0, 'pipe', 'pipe']
        });

        tar.on('close', (code) => {
            if (code != 0) {
                reject(`Tar exited with code ${code}`);
            } else {
                console.log("Tar exited with code 0")
                resolve();
            }
        });

        tar.on('error', () => {
            reject("Tar failed");
        })
    });
}

function createBoostDir() {
    if (!fs.existsSync(BOOST_ROOT_DIR)) {
        fs.mkdirSync(BOOST_ROOT_DIR);
    }
}

function getVersions(): Promise<Array<Object>> {
    return new Promise((resolve, reject) => {
        const req = request.get(VERSION_MANIFEST_ADDR);

        let dt = "";
        req.on('data', data => {
            dt += data;
        });

        req.on('finish', () => {
            resolve(JSON.parse(dt));
        });

        req.on('error', err => {
            reject(err.message);
        });
    });
}

function parseArguments(versions: Array<Object>, boost_version: String, toolset: String, platform_version: String): { url: String, filename: String } {
    for (let i = 0; i < versions.length; i++) {
        const cur = versions[i];
        if (cur.hasOwnProperty("version") && cur["version"] == boost_version) {
            const files: Array<Object> = cur["files"];
            for (let j = 0; j < files.length; j++) {
                const file: Object = files[i];
                if (toolset.length > 0 && (!file.hasOwnProperty("toolset") || file["toolset"] != toolset)) {
                    continue;
                }

                if (platform_version.length > 0 && (!file.hasOwnProperty("platform_version") || file["platform_version"] != platform_version)) {
                    continue;
                }

                return { url: file["download_url"], filename: file["filename"] };
            }
        }
    }

    throw new Error(`Could not find boost version: ${boost_version}`);
}

async function main(): Promise<void> {
    const boost_version = core.getInput("boost_version");
    const toolset = core.getInput("toolset");
    const platform_version = core.getInput("platform_version");

    console.log("Downloading versions-manifest.json...");
    const versions = await getVersions();

    console.log("Parsing versions-manifest.json...");
    const ver_data = parseArguments(versions, boost_version, toolset, platform_version);
    const download_url = ver_data.url;
    const filename = ver_data.filename;

    //console.log(`Downloading ${filename}...`);
    await downloadBoost(download_url, path.join(BOOST_ROOT_DIR, filename));

    const out_dir = filename.split(".")[0];
    const BOOST_ROOT = path.join(BOOST_ROOT_DIR, out_dir);

    console.log(`Extracting ${filename}...`);
    await untarBoost(BOOST_ROOT);

    core.setOutput("BOOST_ROOT", BOOST_ROOT);
    core.setOutput("BOOST_VER", out_dir);
}

try {
    main().then(() => {
        console.log("Boost download finished");
    }, (reject) => {
        core.setFailed(reject);
    });
} catch (error) {
    core.setFailed(error.message);
}