# Install Boost in GitHub Actions

This action installs Boost using prebuilt binaries from GitHub. You can easily install specific Boost versions and customize the installation for your platform.

## Inputs

### `boost_version` (Required)
The version of Boost to install, e.g. `1.73.0`.  
A list of supported versions can be found [here](https://github.com/MarkusJx/prebuilt-boost/blob/main/versions-manifest.json).  
If the version you need is not listed, open an issue [here](https://github.com/MarkusJx/prebuilt-boost/issues) to request it.

### `platform_version` (Optional)
The platform version that Boost was compiled on, e.g. `18.04` for `ubuntu-18.04`, `2016` for `windows-2016`, or `10.15` for `macos-10.15`.  
Supported values include:
- Windows: `2016`, `2019`, `2022`
- Ubuntu: `18.04`, `20.04`
- macOS: `10.15`, `11`

*Note*: If unset, a platform version will be selected at random, which may cause issues. See more [here](https://github.com/MarkusJx/install-boost/issues/7).

### `boost_install_dir` (Optional)
The directory where Boost will be installed.  
If specified, Boost will be installed into `$boost_install_dir/boost/boost/`.  
Defaults to `${{ github.workspace }}`.

### `version` (Optional)
The version of the `install-boost` action to use.  
Valid values:
- `default` (default): Downloads binaries from [MarkusJx/prebuilt-boost](https://github.com/MarkusJx/prebuilt-boost).
- `legacy`: Downloads binaries from [actions/boost-versions](https://github.com/actions/boost-versions).

For supported toolsets and versions, see:
- [MarkusJx/prebuilt-boost versions](https://github.com/MarkusJx/prebuilt-boost/blob/main/versions-manifest.json)
- [actions/boost-versions versions](https://github.com/actions/boost-versions/blob/main/versions-manifest.json)

### `toolset` (Optional)
The toolset used to compile Boost, e.g. `msvc`.  
Supported values:
- `msvc` (Windows)
- `mingw` (Windows)
- `gcc` (Linux)
- `clang` (macOS)

*Note*: You may want to specify this toolset on Windows when using Boost version `>= 1.78.0` to avoid random selection between `mingw` and `msvc`, which could cause build failures.

### `link` (Optional)
The type of Boost libraries to be provided: static or shared.  
Supported values:
- `static`
- `shared`
- `static+shared` (both static and shared)

This option is only effective on Windows, as Unix builds include both static and shared libraries by default.

*Note*: If not set, static libraries are preferred.

### `arch` (Optional)
The architecture the binaries were built for:
- `x86` (default, for x86/amd64)
- `aarch64` (for ARM64 systems)

This option only works on Linux (`20.04` or higher). If not set, `x86` is used.

### `cache` (Optional)
Whether to use `actions/cache` to reduce build times.  
Defaults to `true`. Set to `false` if you want to disable caching.

## Outputs

### `BOOST_ROOT`
The root directory of the installed Boost library.  
This value can be passed to other tools like CMake to locate Boost:

```yaml
- name: Configure CMake
  run: cmake . -DCMAKE_BUILD_TYPE=$BUILD_TYPE -B build
  env:
    BOOST_ROOT: ${{ steps.install-boost.outputs.BOOST_ROOT }}
```

### `BOOST_VER`
The version of Boost installed, e.g., `boost-1.73.0-linux-16.04`.

## Example Usage

### Windows Example

```yaml
- name: Install Boost
  uses: MarkusJx/install-boost@v2
  id: install-boost
  with:
    # REQUIRED: Specify the required Boost version
    boost_version: 1.73.0
    # OPTIONAL: Specify a custom install location
    boost_install_dir: C:\some_directory
    # OPTIONAL: Specify a platform version
    platform_version: 2019
    # OPTIONAL: Specify a toolset
    toolset: msvc
```

### Ubuntu Example

```yaml
- name: Install Boost
  uses: MarkusJx/install-boost@v2
  id: install-boost
  with:
    # REQUIRED: Specify the required Boost version
    boost_version: 1.73.0
    # OPTIONAL: Specify a platform version
    platform_version: 18.04
    # OPTIONAL: Specify a custom install location
    boost_install_dir: /home/runner/some_directory
    # OPTIONAL: Specify a toolset
    toolset: gcc
    # OPTIONAL: Specify architecture
    arch: x86
```

### macOS Example

```yaml
- name: Install Boost
  uses: MarkusJx/install-boost@v2
  id: install-boost
  with:
    # REQUIRED: Specify the required Boost version
    boost_version: 1.73.0
    # OPTIONAL: Specify a platform version
    platform_version: 10.15
    # OPTIONAL: Specify a custom install location
    boost_install_dir: /home/runner/some_directory
    # OPTIONAL: Specify a toolset
    toolset: clang
```

### Legacy Usage

#### Windows Example (Legacy)

```yaml
- name: Install Boost
  uses: MarkusJx/install-boost@v2
  id: install-boost
  with:
    # REQUIRED: Specify the required Boost version
    boost_version: 1.73.0
    # OPTIONAL: Specify a toolset on Windows
    toolset: msvc14.2
    # OPTIONAL: Specify a custom install location
    boost_install_dir: C:\some_directory
```

or

```yaml
- name: Install Boost
  uses: MarkusJx/install-boost@v2
  id: install-boost
  with:
    # REQUIRED: Specify the required Boost version
    boost_version: 1.73.0
    # Use the legacy version of this action
    version: legacy
    # OPTIONAL: Specify a toolset on Windows
    toolset: msvc14.2
    # OPTIONAL: Specify a custom install location
    boost_install_dir: C:\some_directory
```

#### Ubuntu Example (Legacy)

```yaml
- name: Install Boost
  uses: MarkusJx/install-boost@v2
  id: install-boost
  with:
    # REQUIRED: Specify the required Boost version
    boost_version: 1.73.0
    # OPTIONAL: Specify a platform version on Ubuntu
    platform_version: 18.04
    # OPTIONAL: Specify a custom install location
    boost_install_dir: /home/runner/some_directory
```

## Caching

As of version `2.4.0`, this action supports caching using `actions/cache` to speed up builds.  
Caching is enabled by default. To disable it, set `cache` to `false`.

## Boost.Python Support

Starting from Boost version `1.80.0`, the prebuilt binaries include support for `boost.python` for the following Python versions:
- `3.7`
- `3.8`
- `3.9`
- `3.10`
- `3.11`

Some binaries do not support Python due to memory limitations on the build runners. Here’s the support matrix:

| Platform     | Link          | Compiler | Arch    | Python Supported |
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
