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
const shared_1 = require("./shared");
const core = require("@actions/core");
const path = require("path");
const child_process_1 = require("child_process");
const IS_WIN32 = process.platform == "win32";
const VERSION_MANIFEST_ADDR = "https://raw.githubusercontent.com/actions/boost-versions/main/versions-manifest.json";
/**
 * Untar boost on linux/macOs
 *
 * @param filename the file to extract
 * @param out_dir the output directory
 * @param working_directory the working directory
 */
function untarLinux(filename, out_dir, working_directory) {
    return new Promise((resolve, reject) => {
        // Use tar to unpack boost
        const tar = child_process_1.spawn("tar", ["xzf", filename, "-C", out_dir], {
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
function untarBoost(base, working_directory) {
    return __awaiter(this, void 0, void 0, function* () {
        if (IS_WIN32) {
            core.debug("Unpacking boost using 7zip");
            yield run7z(['x', `${base}.tar.gz`], working_directory);
            yield run7z(['x', `${base}.tar`, '-aoa', `-o${base}`], working_directory);
        }
        else {
            core.debug("Unpacking boost using tar");
            shared_1.createDirectory(path.join(working_directory, base));
            yield untarLinux(`${base}.tar.gz`, base, working_directory);
        }
    });
}
/**
 * Clean up
 *
 * @param base_dir the base directory
 * @param base the boost base name (without .tar.gz)
 */
function cleanup(base_dir, base) {
    if (IS_WIN32) {
        shared_1.deleteFiles([path.join(base_dir, `${base}.tar.gz`), path.join(base_dir, `${base}.tar`)]);
    }
    else {
        shared_1.deleteFiles([path.join(base_dir, `${base}.tar.gz`)]);
    }
}
function installV1(boost_version, toolset, platform_version, BOOST_ROOT_DIR) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Using legacy install method");
        console.log("Downloading versions-manifest.json...");
        const versions = yield shared_1.getVersions(VERSION_MANIFEST_ADDR);
        console.log("Parsing versions-manifest.json...");
        const ver_data = shared_1.parseArguments(versions, boost_version, toolset, platform_version);
        const download_url = ver_data.url;
        const filename = ver_data.filename;
        core.startGroup(`Create ${BOOST_ROOT_DIR}`);
        shared_1.createDirectory(BOOST_ROOT_DIR);
        core.endGroup();
        core.startGroup("Download Boost");
        yield shared_1.downloadBoost(download_url, path.join(BOOST_ROOT_DIR, filename));
        core.endGroup();
        let base_dir = filename.substring(0, filename.lastIndexOf("."));
        base_dir = base_dir.substring(0, base_dir.lastIndexOf("."));
        const BOOST_ROOT = path.join(BOOST_ROOT_DIR, base_dir);
        core.debug(`Boost base directory: ${base_dir}`);
        core.startGroup(`Extract ${filename}`);
        yield untarBoost(base_dir, BOOST_ROOT_DIR);
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
    });
}
exports.default = installV1;
//# sourceMappingURL=installV1.js.map