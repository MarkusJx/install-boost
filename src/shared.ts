import * as core from "@actions/core";
import * as request from "request";
import * as fs from "fs";
import * as progress from "request-progress";

export function getVersions(manifestAddress: string): Promise<object[]> {
    return new Promise((resolve, reject) => {
        const req = request.get(manifestAddress);

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
 * Create a directory
 * 
 * @param dir the directory to create
 */
export function createDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
        console.log(`${dir} does not exist, creating it`);
        fs.mkdirSync(dir);
        console.log("Done.");
    } else {
        console.log(`${dir} already exists, doing nothing`);
    }
}

type parsedVersion = {
    url: string,
    filename: string
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
export function parseArguments(versions: object[], boost_version: string, toolset: string | null, platform_version: string): parsedVersion {
    for (let i = 0; i < versions.length; i++) {
        let cur: object = versions[i];
        if (cur.hasOwnProperty("version") && cur["version"] == boost_version) {
            let files: object[] = cur["files"];
            for (let j = 0; j < files.length; j++) {
                let file: object = files[j];

                core.debug(`file platform: ${file["platform"]}`);
                if (!file.hasOwnProperty("platform") || file["platform"] != process.platform) {
                    core.debug("File does not match param 'platform'");
                    continue;
                }

                core.debug(`file toolset: ${file["toolset"]}`);
                if (toolset != null && toolset.length > 0 && (!file.hasOwnProperty("toolset") || file["toolset"] != toolset)) {
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
 * Download boost
 * 
 * @param url the url to download from
 * @param outFile the file to download to
 */
export function downloadBoost(url: string, outFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Get the request with progress
        const req = progress(request(url));
        req.on('progress', state => {
            // Log the progress
            core.debug(`Progress state: ${JSON.stringify(state)}`)
            const percent: number = state.percent * 100;
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
 * Delete files
 * 
 * @param files the files to delete
 */
export function deleteFiles(files: string[]): void {
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