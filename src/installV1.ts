import * as core from '@actions/core';
import * as path from 'path';
import { restoreCache, saveCache } from './cache';
import {
    cleanup,
    createDirectory,
    downloadBoost,
    getVersions,
    Options,
    parseArguments,
    untarBoost,
} from './shared';

const VERSION_MANIFEST_ADDR: string =
    'https://raw.githubusercontent.com/actions/boost-versions/main/versions-manifest.json';

export default async function installV1(opts: Options): Promise<void> {
    console.log('Using legacy install method');
    if (opts.cache) {
        console.log('Trying to retrieve cache...');
        if (await restoreCache(opts)) {
            console.log('Cache successfully restored');
            return;
        } else {
            console.log('Cache miss');
        }
    }

    console.log('Downloading versions-manifest.json...');
    const versions: Object[] = await getVersions(VERSION_MANIFEST_ADDR);

    const { boost_version, toolset, platform_version, BOOST_ROOT_DIR } = opts;

    console.log('Parsing versions-manifest.json...');
    const ver_data = parseArguments(
        versions,
        boost_version,
        toolset,
        platform_version
    );
    const download_url = ver_data.url;
    const filename = ver_data.filename;

    core.startGroup(`Create ${BOOST_ROOT_DIR}`);
    createDirectory(BOOST_ROOT_DIR);
    core.endGroup();

    core.startGroup('Download Boost');
    await downloadBoost(download_url, path.join(BOOST_ROOT_DIR, filename));
    core.endGroup();

    let base_dir: string = filename.substring(0, filename.lastIndexOf('.'));
    base_dir = base_dir.substring(0, base_dir.lastIndexOf('.'));
    const BOOST_ROOT: String = path.join(BOOST_ROOT_DIR, base_dir);

    core.debug(`Boost base directory: ${base_dir}`);

    core.startGroup(`Extract ${filename}`);
    await untarBoost(base_dir, BOOST_ROOT_DIR);
    core.endGroup();

    core.startGroup('Clean up');
    cleanup(BOOST_ROOT_DIR, base_dir);
    core.endGroup();

    core.startGroup('Set output variables');
    console.log(`Setting BOOST_ROOT to '${BOOST_ROOT}'`);
    console.log(`Setting BOOST_VER to '${base_dir}'`);
    core.endGroup();

    core.setOutput('BOOST_ROOT', BOOST_ROOT);
    core.setOutput('BOOST_VER', base_dir);

    if (opts.cache) {
        console.log('Saving cache');
        saveCache(opts);
    }
}
