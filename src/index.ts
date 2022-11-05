import installV1 from './installV1';
import installV2 from './installV2';
import { version } from '../package.json';

import * as core from '@actions/core';
import * as path from 'path';
import * as semver from 'semver';

let BOOST_ROOT_DIR: string = path.join(process.env.GITHUB_WORKSPACE!, 'boost');

async function main(): Promise<void> {
    const boost_version: string = core.getInput('boost_version');
    const toolset: string = core.getInput('toolset');
    const platform_version: string = core.getInput('platform_version');
    const boost_install_dir: string = core.getInput('boost_install_dir');
    const link: string = core.getInput('link');
    const arch: string = core.getInput('arch');
    const cache: boolean = core.getBooleanInput('cache') ?? true;
    let script_version: string = core.getInput('version');

    if (boost_version.length <= 0) {
        throw new Error('the boost_version variable must be defined');
    }

    if (cache) {
        console.log('Using @action/cache to improve build times');
    }

    if (boost_install_dir.length > 0) {
        BOOST_ROOT_DIR = path.join(boost_install_dir, 'boost');
        console.log(
            `The install directory was manually changed to ${BOOST_ROOT_DIR}`
        );
    }

    if (!script_version) {
        script_version = 'default';
    }

    if (!platform_version) {
        core.warning(
            "The 'platform_version' input is unset. This may lead to inconsistent build results."
        );
    }

    if (
        !toolset &&
        process.platform === 'win32' &&
        (semver.gte(boost_version, '1.78.0') || script_version === 'legacy')
    ) {
        core.warning(
            "The 'toolset' input is unset. This may lead to inconsistent build results."
        );
    } else if (
        toolset &&
        semver.lt(boost_version, '1.78.0') &&
        script_version !== 'legacy'
    ) {
        core.warning(
            'Setting the toolset with boost version < 1.78.0 may cause issues'
        );
    }

    if (
        link &&
        link !== 'static' &&
        link !== 'shared' &&
        link !== 'static+shared'
    ) {
        throw new Error(
            "'link' must be one of: 'static', 'shared' or 'static+shared'"
        );
    }

    if (arch && arch !== 'x86' && arch !== 'aarch64') {
        throw new Error("'arch' must be one of: 'x86' or 'aarch64'");
    }

    if (script_version === 'legacy') {
        if (link) {
            core.warning(
                "The script version was set to 'legacy', but the 'link' option was supplied, ignoring this"
            );
        }

        await installV1({
            boost_version,
            toolset,
            platform_version,
            BOOST_ROOT_DIR,
            cache,
        });
    } else if (script_version === 'default') {
        await installV2({
            boost_version,
            toolset,
            platform_version,
            link,
            arch,
            BOOST_ROOT_DIR,
            cache,
        });
    } else {
        throw new Error("Invalid value entered for option 'version'");
    }
}

try {
    console.log(`Starting install-boost@${version}`);
    main().then(
        () => {
            console.log(`install-boost@${version} finished successfully`);
        },
        (reject) => {
            core.setFailed(reject);
        }
    );
} catch (error: any) {
    core.setFailed(error.message);
}
