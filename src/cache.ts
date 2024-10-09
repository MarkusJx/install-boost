import * as cache from '@actions/cache';
import * as core from '@actions/core';
import { OptionsV2 } from './shared';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type CacheOptions = PartialBy<PartialBy<OptionsV2, 'link'>, 'arch'>;

function getKey(opts: CacheOptions): string {
    const key = [
        'boost',
        `v${opts.boost_version}`,
        process.platform,
        opts.arch || 'unknown',
        opts.platform_version,
        opts.toolset,
        opts.link || 'unknown',
    ].join('-');

    core.debug(`Using cache key '${key}'`);
    return key;
}

export async function saveCache(opts: CacheOptions): Promise<void> {
    await cache.saveCache([opts.BOOST_ROOT_DIR], getKey(opts));
}

export async function restoreCache(opts: CacheOptions): Promise<boolean> {
    const key = await cache.restoreCache([opts.BOOST_ROOT_DIR], getKey(opts));
    return key !== undefined;
}
