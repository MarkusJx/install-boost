import * as core from "@actions/core";
import * as path from "path";
import { spawn } from "child_process";
import { createDirectory, deleteFiles, downloadBoost, getVersions, parseArguments } from "./shared";

const VERSION_MANIFEST_ADDR: string = "https://raw.githubusercontent.com/MarkusJx/prebuilt-boost/main/versions-manifest.json";
const PLATFORM: string = process.platform;

async function untarBoost(filename: string, working_directory: string): Promise<void> {
    core.debug("Unpacking boost using tar");

    return new Promise((resolve, reject) => {
        // Use tar to unpack boost
        const tar = spawn("tar", ["xzf", filename], {
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

export default async function installV2(boost_version: string, platform_version: string, BOOST_ROOT_DIR: string): Promise<void> {
    console.log("Downloading versions-manifest.json...");
    const versions: object[] = await getVersions(VERSION_MANIFEST_ADDR);

    console.log("Parsing versions-manifest.json...");
    const ver_data = parseArguments(versions, boost_version, null, platform_version);
    const download_url: string = ver_data.url;
    const filename: string = ver_data.filename;

    core.startGroup(`Create ${BOOST_ROOT_DIR}`);
    createDirectory(BOOST_ROOT_DIR);
    core.endGroup();

    core.startGroup("Download Boost");
    await downloadBoost(download_url, path.join(BOOST_ROOT_DIR, filename));
    core.endGroup();

    core.startGroup(`Extract ${filename}`);
    await untarBoost(filename, BOOST_ROOT_DIR);
    core.endGroup();

    core.startGroup("Clean up");
    deleteFiles([path.join(BOOST_ROOT_DIR, filename)]);
    core.endGroup();

    let base_dir: string = filename.substring(0, filename.lastIndexOf("."));
    base_dir = base_dir.substring(0, base_dir.lastIndexOf("."));
    const BOOST_ROOT: String = path.join(BOOST_ROOT_DIR, "boost");

    core.startGroup("Set output variables");
    console.log(`Setting BOOST_ROOT to '${BOOST_ROOT}'`);
    console.log(`Setting BOOST_VER to '${base_dir}'`);
    core.endGroup();

    core.setOutput("BOOST_ROOT", BOOST_ROOT);
    core.setOutput("BOOST_VER", base_dir);
}