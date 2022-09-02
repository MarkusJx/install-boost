import * as core from '@actions/core';
import * as path from 'path';
import { restoreCache, saveCache } from './cache';
import {
    cleanup,
    createDirectory,
    downloadBoost,
    getVersions,
    OptionsV2,
    parseArguments,
    setOutputVariables,
    untarBoost,
    VersionsRecord,
} from './shared';

const VERSION_MANIFEST_ADDR: string =
    'https://raw.githubusercontent.com/MarkusJx/prebuilt-boost/main/versions-manifest.json';

export default async function installV2(opts: OptionsV2): Promise<void> {
    if (opts.cache) {
        console.log('Trying to retrieve cache...');
        if (await restoreCache(opts)) {
            console.log('Cache successfully restored');
            setOutputVariables(
                path.join(opts.BOOST_ROOT_DIR, 'boost'),
                opts.boost_version
            );
            return;
        } else {
            console.log('Cache miss');
        }
    }

    console.log('Downloading versions-manifest.json...');
    const versions: VersionsRecord = await getVersions(VERSION_MANIFEST_ADDR);

    const {
        boost_version,
        toolset,
        platform_version,
        link,
        arch,
        BOOST_ROOT_DIR,
    } = opts;

    console.log('Parsing versions-manifest.json...');
    const ver_data = parseArguments(
        versions,
        boost_version,
        toolset,
        platform_version,
        link,
        arch
    );
    const download_url: string = ver_data.url;
    const filename: string = ver_data.filename;

    core.startGroup(`Create ${BOOST_ROOT_DIR}`);
    createDirectory(BOOST_ROOT_DIR);
    core.endGroup();

    core.startGroup('Download Boost');
    await downloadBoost(download_url, path.join(BOOST_ROOT_DIR, filename));
    core.endGroup();

    let base_dir: string = filename.substring(0, filename.lastIndexOf('.'));
    base_dir = base_dir.substring(0, base_dir.lastIndexOf('.'));

    core.startGroup(`Extract ${filename}`);
    await untarBoost(base_dir, BOOST_ROOT_DIR, false);
    core.endGroup();

    core.startGroup('Clean up');
    cleanup(BOOST_ROOT_DIR, base_dir);
    core.endGroup();

    setOutputVariables(path.join(BOOST_ROOT_DIR, 'boost'), base_dir);

    if (opts.cache) {
        console.log('Saving cache');
        saveCache(opts);
    }
}
