import { createDirectory, deleteFiles, downloadBoost, getVersions, parseArguments, untarBoost } from "./shared";

import core = require('@actions/core');
import path = require('path');

const IS_WIN32: boolean = process.platform == "win32";
const VERSION_MANIFEST_ADDR: string = "https://raw.githubusercontent.com/actions/boost-versions/main/versions-manifest.json";

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
