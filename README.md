# Download and install Boost

Install Boost in GitHub actions using prebuilt binaries.

## Inputs

### `boost_version`

**Required** The boost version to install, e.g. `1.73.0`.
A list of supported versions can be found [here](https://github.com/MarkusJx/prebuilt-boost/blob/main/versions-manifest.json). If you need a specific (unlisted) version, open a new issue
[here](https://github.com/MarkusJx/prebuilt-boost), requesting the required version.

### `platform_version`

**Optional** The platform version of the system boost was compiled on, e.g. `18.04` for `ubuntu-18.04`, `2016` for `windows-2016` or `10.15` for `macos-10.15`.
Supported values are `2016` (windows, until boost v1.78.0), `2019` (windows), `2022` (windows), `18.04` (ubuntu),
`20.04` (ubuntu), `10.15` (macOs), `11` (macOs). **You maybe want to set this as a version will**
**be selected at random if unset and [may cause issues](https://github.com/MarkusJx/install-boost/issues/7).**

### `boost_install_dir`

**Optional** The directory to install boost into. If specified, boost will be installed into
`$boost_install_dir/boost/boost/`. The default value is `${{github.workspace}}`.

### `version`

**Optional** The version of the `install-boost` action to use. Must be either `default` or `legacy`. Defaults to `default`.
If the `default` version is used, the binaries are downloaded from [MarkusJx/prebuilt-boost](https://github.com/MarkusJx/prebuilt-boost).
The list of supported toolsets and versions can be found [here](https://github.com/MarkusJx/prebuilt-boost/blob/main/versions-manifest.json).
If the `legacy` version is used, the binaries are downloaded from [actions/boost-versions](https://github.com/actions/boost-versions).
The list of supported toolsets and versions can be found [here](https://github.com/actions/boost-versions/blob/main/versions-manifest.json).

### `toolset`

**Optional** A toolset used to compile boost, e.g. `msvc`.
May be one of `msvc` (windows), `mingw` (windows), `gcc` (linux) or `clang` (macOs).
**You maybe want to set this on windows (when boost version is >= `1.78.0`) as either `mingw` or `msvc` will be selected at random**
**which may cause your build to fail.**
Selecting this is only supported for boost versions `1.78.0` and higher with the new version of
this action or any version with the legacy versions. Please refer to the provided version manifests
for further information.

### `link`

**Optional** Whether the boost libraries will be supplied through static or shared libraries.
May be one of `static`, `shared` or `static+shared` for both static and shared
libraries to be supplied. Is only effective on windows, as unix builds contain by
default both static and shared libraries. On windows, only `static` or `shared`
may be specified, as these binares can only contain either static or shared libraries.
If nothing is specified, static libraries will be preferred.

### `arch`

**Optional** The architecture the binares were built for. Must be either `x86` for
default x86/amd64 or `aarch64` for arm64 systems. The `x86` can be used for
the default github runners, the `aarch64` images may be used for cross-compiling
binaries for arm systems. If not set, `x86` images will be used. Only works on
`linux` images with version `20.04` (or just specify no os version).

### `cache`

**Optional** Whether to use `actions/cache` to further decrease build times.
Defaults to `true`, you'll only ever need to set this if you want to disable the cache.

## Outputs

### `BOOST_ROOT`

The boost root directory path, to be passed to another tool, e.g. CMake to find Boost:

```yml
- name: Configure CMake
  run: cmake . -DCMAKE_BUILD_TYPE=$BUILD_TYPE -B build
  env:
    BOOST_ROOT: ${{ steps.install-boost.outputs.BOOST_ROOT }}
```

**Notes**: Sometimes you'll have to pass the path to the include and library directories to cmake:

```yml
- name: Configure CMake
  run: |
    cmake . -DCMAKE_BUILD_TYPE=$BUILD_TYPE -B build\
    -DBoost_INCLUDE_DIR=${{steps.install-boost.outputs.BOOST_ROOT}}/include\
    -DBoost_LIBRARY_DIRS=${{steps.install-boost.outputs.BOOST_ROOT}}/lib
  env:
    BOOST_ROOT: ${{ steps.install-boost.outputs.BOOST_ROOT }}
```

### `BOOST_VER`

The version of boost installed, e.g. `boost-1.73.0-linux-16.04`.

## Example usage

### Windows

```yml
- name: Install boost
  uses: MarkusJx/install-boost@v2
  id: install-boost
  with:
    # REQUIRED: Specify the required boost version
    # A list of supported versions can be found here:
    # https://github.com/MarkusJx/prebuilt-boost/blob/main/versions-manifest.json
    boost_version: 1.73.0
    # OPTIONAL: Specify a custon install location
    boost_install_dir: C:\some_directory
    # OPTIONAL: Specify a platform version
    platform_version: 2019
    # OPTIONAL: Specify a toolset
    toolset: msvc

    # NOTE: If a boost version matching all requirements cannot be found,
    # this build step will fail
```

### Ubuntu

```yml
- name: Install boost
  uses: MarkusJx/install-boost@v2
  id: install-boost
  with:
    # REQUIRED: Specify the required boost version
    # A list of supported versions can be found here:
    # https://github.com/MarkusJx/prebuilt-boost/blob/main/versions-manifest.json
    boost_version: 1.73.0
    # OPTIONAL: Specify a platform version
    platform_version: 18.04
    # OPTIONAL: Specify a custom install location
    boost_install_dir: /home/runner/some_directory
    # OPTIONAL: Specify a toolset
    toolset: gcc
    # OPTIONAL: Specify an architecture
    arch: x86

    # NOTE: If a boost version matching all requirements cannot be found,
    # this build step will fail
```

### MacOs

```yml
- name: Install boost
  uses: MarkusJx/install-boost@v2
  id: install-boost
  with:
    # REQUIRED: Specify the required boost version
    # A list of supported versions can be found here:
    # https://github.com/MarkusJx/prebuilt-boost/blob/main/versions-manifest.json
    boost_version: 1.73.0
    # OPTIONAL: Specify a platform version
    platform_version: 10.15
    # OPTIONAL: Specify a custom install location
    boost_install_dir: /home/runner/some_directory
    # OPTIONAL: Specify a toolset
    toolset: clang

    # NOTE: If a boost version matching all requirements cannot be found,
    # this build step will fail
```

### Legacy use

#### Windows

```yml
- name: Install boost
  uses: MarkusJx/install-boost@v1.0.1
  id: install-boost
  with:
    # REQUIRED: Specify the required boost version
    # A list of supported versions can be found here:
    # https://github.com/actions/boost-versions/blob/main/versions-manifest.json
    boost_version: 1.73.0
    # OPTIONAL: Specify a toolset on windows
    toolset: msvc14.2
    # OPTIONAL: Specify a custon install location
    boost_install_dir: C:\some_directory

    # NOTE: If a boost version matching all requirements cannot be found,
    # this build step will fail
```

or

```yml
- name: Install boost
  uses: MarkusJx/install-boost@v2
  id: install-boost
  with:
    # REQUIRED: Specify the required boost version
    # A list of supported versions can be found here:
    # https://github.com/actions/boost-versions/blob/main/versions-manifest.json
    boost_version: 1.73.0
    # Use the legacy version of this action
    version: legacy
    # OPTIONAL: Specify a toolset on windows
    toolset: msvc14.2
    # OPTIONAL: Specify a custon install location
    boost_install_dir: C:\some_directory

    # NOTE: If a boost version matching all requirements cannot be found,
    # this build step will fail
```

#### Ubuntu

```yml
- name: Install boost
  uses: MarkusJx/install-boost@v1.0.1
  id: install-boost
  with:
    # REQUIRED: Specify the required boost version
    # A list of supported versions can be found here:
    # https://github.com/actions/boost-versions/blob/main/versions-manifest.json
    boost_version: 1.73.0
    # OPTIONAL: Specify a platform version on ubuntu
    platform_version: 18.04
    # OPTIONAL: Specify a custom install location
    boost_install_dir: /home/runner/some_directory

    # NOTE: If a boost version matching all requirements cannot be found,
    # this build step will fail
```

## Caching

As of version `2.4.0`, `install-boost` natively supports caching using `actions/cache`
to further improve build times. This is enabled by default. You can disable
this behaviour by setting the `cache` variable to `false`.

## Boost.Python

Starting from boost version `1.80.0`, the pre-built binaries will be built with
`boost.python` for the following python versions:

- `3.7`
- `3.8`
- `3.9`
- `3.10`
- `3.11`

Due to memory restrictions on the build runners, there are some binaries which don't support python:

| Platform     | Link          | Compiler | Arch    | Python supported |
| ------------ | ------------- | -------- | ------- | ---------------- |
| ubuntu-18.04 | static+shared | gcc      | x86     | ✅               |
| ubuntu-20.04 | static+shared | gcc      | aarch64 | ❌               |
| ubuntu-20.04 | static+shared | gcc      | x86     | ✅               |
| ubuntu-22.04 | static+shared | gcc      | x86     | ✅               |
| windows-2019 | static        | msvc     | x86     | ✅               |
| windows-2019 | shared        | msvc     | x86     | ❌               |
| windows-2019 | static        | mingw    | x86     | ❌               |
| windows-2022 | static        | msvc     | x86     | ✅               |
| windows-2022 | shared        | msvc     | x86     | ❌               |
| windows-2022 | static        | mingw    | x86     | ❌               |
| windows-2022 | shared        | mingw    | x86     | ❌               |
| macos-10.15  | static+shared | clang    | x86     | ✅               |
| macos-11     | static+shared | clang    | x86     | ✅               |
| macos-12     | static+shared | clang    | x86     | ✅               |
