import * as core from "@actions/core";
import * as path from "path";
import { cleanup, createDirectory, downloadBoost, getVersions, parseArguments, untarBoost } from "./shared";

const VERSION_MANIFEST_ADDR: string = "https://raw.githubusercontent.com/MarkusJx/prebuilt-boost/main/versions-manifest.json";

export default async function installV2(boost_version: string, toolset: string, platform_version: string, BOOST_ROOT_DIR: string): Promise<void> {
    console.log("Downloading versions-manifest.json...");
    const versions: object[] = await getVersions(VERSION_MANIFEST_ADDR);

    console.log("Parsing versions-manifest.json...");
    const ver_data = parseArguments(versions, boost_version, toolset, platform_version);
    const download_url: string = ver_data.url;
    const filename: string = ver_data.filename;

    core.startGroup(`Create ${BOOST_ROOT_DIR}`);
    createDirectory(BOOST_ROOT_DIR);
    core.endGroup();

    core.startGroup("Download Boost");
    await downloadBoost(download_url, path.join(BOOST_ROOT_DIR, filename));
    core.endGroup();

    let base_dir: string = filename.substring(0, filename.lastIndexOf("."));
    base_dir = base_dir.substring(0, base_dir.lastIndexOf("."));

    core.startGroup(`Extract ${filename}`);
    await untarBoost(base_dir, BOOST_ROOT_DIR, false);
    core.endGroup();

    core.startGroup("Clean up");
    cleanup(BOOST_ROOT_DIR, base_dir);
    core.endGroup();

    core.startGroup("Set output variables");
    console.log(`Setting BOOST_ROOT to '${BOOST_ROOT_DIR}/boost'`);
    console.log(`Setting BOOST_VER to '${base_dir}'`);
    core.endGroup();

    core.setOutput("BOOST_ROOT", path.join(BOOST_ROOT_DIR, 'boost'));
    core.setOutput("BOOST_VER", base_dir);
}