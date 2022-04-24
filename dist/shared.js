"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanup = exports.untarBoost = exports.deleteFiles = exports.downloadBoost = exports.parseArguments = exports.createDirectory = exports.getVersions = void 0;
const core = require("@actions/core");
const request = require("request");
const fs = require("fs");
const progress = require("request-progress");
const path = require("path");
const child_process_1 = require("child_process");
function getVersions(manifestAddress) {
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
exports.getVersions = getVersions;
/**
 * Create a directory
 *
 * @param dir the directory to create
 */
function createDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`${dir} does not exist, creating it`);
        fs.mkdirSync(dir);
        console.log("Done.");
    }
    else {
        console.log(`${dir} already exists, doing nothing`);
    }
}
exports.createDirectory = createDirectory;
/**
 * Try to find the specified boost version
 *
 * @param versions the version object array from getVersions()
 * @param boost_version the requested boost version
 * @param toolset the requested toolset
 * @param platform_version the requested platform version
 * @returns the url and file name or throws an error if the requested version could not be found
 */
function parseArguments(versions, boost_version, toolset, platform_version, link = null, arch = null) {
    let platform = process.platform;
    if (platform === "darwin") {
        platform = "macos";
    }
    else if (platform === "win32") {
        platform = "windows";
    }
    for (let i = 0; i < versions.length; i++) {
        let cur = versions[i];
        if (cur.hasOwnProperty("version") && cur["version"] == boost_version) {
            let files = cur["files"];
            for (let j = 0; j < files.length; j++) {
                let file = files[j];
                core.debug(`file platform: ${file["platform"]}`);
                if (!file.hasOwnProperty("platform") || file["platform"] != platform) {
                    core.debug("File does not match param 'platform'");
                    continue;
                }
                core.debug(`file toolset: ${file["toolset"]}`);
                if (toolset && (!file.hasOwnProperty("toolset") || file["toolset"] != toolset)) {
                    core.debug("File does not match param 'toolset'");
                    continue;
                }
                core.debug(`file platform version: ${file["platform_version"]}`);
                if (platform_version.length > 0 && (!file.hasOwnProperty("platform_version") || file["platform_version"] != platform_version)) {
                    core.debug("File does not match param 'platform_version");
                    continue;
                }
                if (link && !file["link"]) {
                    core.warning("The parameter 'link' was specified, which doesn't have any effect on this boost version");
                }
                else if (link && file.hasOwnProperty("link") && link !== file["link"] && file["link"] !== "static+shared") {
                    core.debug("File does not match param 'link'");
                    continue;
                }
                else if (!link && file.hasOwnProperty("link") && file["link"] === "shared") {
                    core.debug("The file's 'link' was set to 'shared', but 'link' was not specified, ignoring this file");
                    continue;
                }
                if (arch && !file["arch"]) {
                    core.warning("The parameter 'arch' was specified, which doesn't have any effect on this boost version");
                }
                else if (arch && file.hasOwnProperty("arch") && arch !== file["arch"]) {
                    core.debug("File does not match param 'arch'");
                    continue;
                }
                else if (!arch && file.hasOwnProperty("arch") && file["arch"] !== "x86") {
                    core.debug("The file's 'arch' was not set to 'x86', but 'arch' was not specified, ignoring this file");
                    continue;
                }
                return { url: file["download_url"], filename: file["filename"] };
            }
            break;
        }
    }
    throw new Error(`Could not find boost version ${boost_version}`);
}
exports.parseArguments = parseArguments;
/**
 * Download boost
 *
 * @param url the url to download from
 * @param outFile the file to download to
 */
function downloadBoost(url, outFile) {
    return new Promise((resolve, reject) => {
        // Get the request with progress
        const req = progress(request(url));
        req.on('progress', state => {
            // Log the progress
            core.debug(`Progress state: ${JSON.stringify(state)}`);
            const percent = state.percent * 100;
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
exports.downloadBoost = downloadBoost;
/**
 * Delete files
 *
 * @param files the files to delete
 */
function deleteFiles(files) {
    console.log(`Attempting to delete ${files.length} file(s)...`);
    for (let i = 0; i < files.length; i++) {
        let cur_file = files[i];
        if (fs.existsSync(cur_file)) {
            console.log(`${cur_file} exists, deleting it`);
            fs.unlinkSync(cur_file);
        }
        else {
            console.log(`${cur_file} does not exist`);
        }
    }
}
exports.deleteFiles = deleteFiles;
/**
 * Untar boost on linux/macOs
 *
 * @param filename the file to extract
 * @param out_dir the output directory
 * @param working_directory the working directory
 */
function untarLinux(filename, out_dir, working_directory, rename) {
    return new Promise((resolve, reject) => {
        const args = ["xzf", filename];
        if (rename) {
            args.push("-C", out_dir);
        }
        // Use tar to unpack boost
        const tar = child_process_1.spawn("tar", args, {
            stdio: [process.stdin, process.stdout, process.stderr],
            cwd: working_directory
        });
        // Reject/Resolve on close
        tar.on('close', (code) => {
            if (code != 0) {
                reject(`Tar exited with code ${code}`);
            }
            else {
                console.log("Tar exited with code 0");
                resolve();
            }
        });
        // Reject on error
        tar.on('error', (err) => {
            reject(`Tar failed: ${err}`);
        });
    });
}
/**
 * Unpack boost on windows using 7zip
 *
 * @param command the command array to run
 * @param working_directory the working directory to work in
 */
function run7z(command, working_directory) {
    return new Promise((resolve, reject) => {
        // Spawn a 7z process
        const tar = child_process_1.spawn("7z", command, {
            stdio: [process.stdin, process.stdout, process.stderr],
            cwd: working_directory
        });
        // Reject/Resolve on close
        tar.on('close', (code) => {
            if (code != 0) {
                reject(`7z exited with code ${code}`);
            }
            else {
                console.log("7z exited with code 0");
                resolve();
            }
        });
        // Reject on error
        tar.on('error', (err) => {
            reject(`7z failed: ${err}`);
        });
    });
}
/**
 * Unpack boost using tar on unix or 7zip on windows
 *
 * @param base the output base
 * @param working_directory the working directory
 */
function untarBoost(base, working_directory, rename = true) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.platform == "win32") {
            core.debug("Unpacking boost using 7zip");
            yield run7z(['x', `${base}.tar.gz`], working_directory);
            if (rename) {
                yield run7z(['x', `${base}.tar`, '-aoa', `-o${base}`], working_directory);
            }
            else {
                yield run7z(['x', `${base}.tar`, '-aoa'], working_directory);
            }
        }
        else {
            core.debug("Unpacking boost using tar");
            createDirectory(path.join(working_directory, base));
            yield untarLinux(`${base}.tar.gz`, base, working_directory, rename);
        }
    });
}
exports.untarBoost = untarBoost;
/**
 * Clean up
 *
 * @param base_dir the base directory
 * @param base the boost base name (without .tar.gz)
 */
function cleanup(base_dir, base) {
    if (process.platform == "win32") {
        deleteFiles([path.join(base_dir, `${base}.tar.gz`), path.join(base_dir, `${base}.tar`)]);
    }
    else {
        deleteFiles([path.join(base_dir, `${base}.tar.gz`)]);
    }
}
exports.cleanup = cleanup;
//# sourceMappingURL=shared.js.map