import { expect } from 'chai';
import {
    Core,
    VersionsRecord,
    getVersions,
    parseArguments,
} from '../src/shared';
import fs from 'fs';
import path from 'path';

const MANIFEST_ADDR =
    'https://raw.githubusercontent.com/MarkusJx/prebuilt-boost/main/versions-manifest.json';

const coreMock: Core = {
    debug() {},
    info() {},
};

const checkRecord = (versions: VersionsRecord) => {
    expect(versions).to.be.an('array');

    for (const el of versions) {
        expect(el).to.be.an('object');
        expect(el.version).to.be.a('string').to.have.a.lengthOf.above(4);
        expect(el.files).to.be.an('array');

        for (const file of el.files) {
            expect(file).to.be.an('object');
            expect(file.download_url)
                .to.be.a('string')
                .to.have.a.lengthOf.above(20);
            expect(file.filename)
                .to.be.a('string')
                .to.have.a.lengthOf.above(10);
            expect(file.platform_version)
                .to.be.a('string')
                .to.have.a.lengthOf.gte(2);
        }
    }
};

describe('shared test', () => {
    it('download manifest', async () => {
        const versions = await getVersions(MANIFEST_ADDR, false);
        checkRecord(versions);
    });

    describe('parse arguments', () => {
        const versions: VersionsRecord = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, 'versions-manifest.json'),
                'utf-8'
            )
        );

        it('check record', () => {
            checkRecord(versions);
        });

        it('find boost version 1.74 msvc', () => {
            const version = parseArguments(
                versions,
                '1.74.0',
                null,
                '2019',
                null,
                null,
                coreMock
            );

            expect(version).to.be.an('object');
            expect(version.filename).to.equal(
                'boost-1.74.0-windows-2019.tar.gz'
            );

            const v2 = parseArguments(
                [
                    {
                        version: '1.74.0',
                        files: [
                            {
                                filename: 'boost-1.74.0-windows-2019.tar.gz',
                                platform: 'windows',
                                platform_version: '2019',
                                download_url:
                                    'https://github.com/MarkusJx/prebuilt-boost/releases/download/1.74.0/boost-1.74.0-windows-2019.tar.gz',
                            },
                            {
                                filename:
                                    'boost-1.74.0-windows-2019-mingw-static-x86.tar.gz',
                                platform: 'windows',
                                platform_version: '2019',
                                toolset: 'mingw',
                                link: 'static',
                                arch: 'x86',
                                download_url:
                                    'https://github.com/MarkusJx/prebuilt-boost/releases/download/1.74.0/boost-1.74.0-windows-2019-mingw-static-x86.tar.gz',
                            },
                        ],
                    },
                ],
                '1.74.0',
                null,
                '2019',
                null,
                null,
                coreMock
            );

            expect(v2).to.be.an('object');
            expect(v2.filename).to.equal('boost-1.74.0-windows-2019.tar.gz');
        });

        it('find boost version 1.74 mingw', () => {
            const version = parseArguments(
                versions,
                '1.74.0',
                'mingw',
                '2019',
                null,
                null,
                coreMock
            );

            expect(version).to.be.an('object');
            expect(version.filename).to.equal(
                'boost-1.74.0-windows-2019-mingw-static-x86.tar.gz'
            );
        });
    });
});
