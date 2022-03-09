# Download and install Boost
Install Boost in GitHub actions using prebuilt binaries.

## Inputs

### `boost_version`
**Required** The boost version to install, e.g. ``1.73.0``.
A list of supported versions can be found [here](https://github.com/MarkusJx/prebuilt-boost/blob/main/versions-manifest.json). If you need a specific (unlisted) version, open a new issue
[here](https://github.com/MarkusJx/prebuilt-boost), requesting the required version.

### `platform_version`
**Optional** The platform version of the system boost was compiled on, e.g. ``18.04`` for ``ubuntu-18.04``, ``2016`` for ``windows-2016`` or ``10.15`` for ``macos-10.15``.
Supported values are ``2016`` (windows, until boost v1.78.0), ``2019`` (windows), ``18.04`` (ubuntu),
``20.04`` (ubuntu), ``10.15`` (macOs), ``11`` (macOs). **You maybe want to set this as a version will**
**be selected at random if unset and [may cause issues](https://github.com/MarkusJx/install-boost/issues/7).**

### `boost_install_dir`
**Optional** The directory to install boost into. If specified, boost will be installed into 
``$boost_install_dir/boost/boost/``. The default value is ``${{env.GITHUB_WORKSPACE}}``.

### `version`
**Optional** The version of the ``install-boost`` action to use. Must be either ``default`` or ``legacy``. Defaults to ``default``.
If the ``default`` version is used, the binaries are downloaded from [MarkusJx/prebuilt-boost](https://github.com/MarkusJx/prebuilt-boost).
The list of supported toolsets and versions can be found [here](https://github.com/MarkusJx/prebuilt-boost/blob/main/versions-manifest.json).
If the ``legacy`` version is used, the binaries are downloaded from [actions/boost-versions](https://github.com/actions/boost-versions).
The list of supported toolsets and versions can be found [here](https://github.com/actions/boost-versions/blob/main/versions-manifest.json).

### `toolset`
**Optional** A toolset used to compile boost, e.g. ``msvc``.
May be one of ``msvc`` (windows), ``mingw`` (windows), ``gcc`` (linux) or ``clang`` (macOs).
**You maybe want to set this on windows as either ``mingw`` or ``msvc`` will be selected at random**
**which may cause your build to fail.**
Selecting this is only supported for boost versions ``1.78.0`` and higher with the new version of 
this action or any version with the legacy versions. Please refer to the provided version manifests
for further information.

### `link`
**Optional** Whether the boost libraries will be supplied through static or shared libraries.
May be one of ``static``, ``shared`` or ``static+shared`` for both static and shared
libraries to be supplied. Is only effective on windows, as unix builds contain by
default both static and shared libraries. On windows, only ``static`` or ``shared``
may be specified, as these binares can only contain either static or shared libraries.
If nothing is specified, static libraries will be preferred.

## Outputs
### `BOOST_ROOT`
The boost root directory path, to be passed to another tool, e.g. CMake to find Boost:
```yml
- name: Configure CMake
  run: cmake . -DCMAKE_BUILD_TYPE=$BUILD_TYPE -B build
  env:
    BOOST_ROOT: ${{ steps.install-boost.outputs.BOOST_ROOT }}
```

### `BOOST_VER`
The version of boost installed, e.g. ``boost-1.73.0-linux-16.04``.

## Example usage
### Windows
```yml
- name: Install boost
  uses: MarkusJx/install-boost@v2.1.0
  id: install-boost
  with:
    # REQUIRED: Specify the required boost version
    # A list of supported versions can be found here: 
    # https://github.com/actions/boost-versions/blob/main/versions-manifest.json
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
  uses: MarkusJx/install-boost@v2.1.0
  id: install-boost
  with:
    # REQUIRED: Specify the required boost version
    # A list of supported versions can be found here: 
    # https://github.com/actions/boost-versions/blob/main/versions-manifest.json
    boost_version: 1.73.0
    # OPTIONAL: Specify a platform version
    platform_version: 18.04
    # OPTIONAL: Specify a custom install location
    boost_install_dir: /home/runner/some_directory
    # OPTIONAL: Specify a toolset
    toolset: gcc
    
    # NOTE: If a boost version matching all requirements cannot be found,
    # this build step will fail
```

### MacOs
```yml
- name: Install boost
  uses: MarkusJx/install-boost@v2.1.0
  id: install-boost
  with:
    # REQUIRED: Specify the required boost version
    # A list of supported versions can be found here: 
    # https://github.com/actions/boost-versions/blob/main/versions-manifest.json
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
  uses: MarkusJx/install-boost@v2.1.0
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
If you want to cache the boost versions to further accelerate your builds, you could use
``actions/cache`` to do that ([as seen here](https://github.com/MarkusJx/install-boost/issues/6)):
```yml
# Retrieve the cache, uses cache@v2
- name: Cache boost
  uses: actions/cache@v2
  id: cache-boost
  with:
    # Set the default path as the path to cache
    path: ${{env.GITHUB_WORKSPACE}}/boost/boost
    # Use the version as the key to only cache the correct version
    key: boost-${{BOOST_VERSION}}

# Actual install step (only runs if the cache is empty)
- name: Install boost
  if: steps.cache-boost.outputs.cache-hit != 'true'
  uses: MarkusJx/install-boost@v2.1.0
  with:
    # Set the boost version (required)
    boost_version: ${{BOOST_VERSION}}
```

or if you want to use custom paths for boost:
```yml
jobs:
  build:
    runs-on: windows-2019
    env:
      # Set your boost version
      BOOST_VERSION: 1.78.0
      # Set you boost path to the default one (I don't know if you can use variables here)
      BOOST_PATH: ${{env.GITHUB_WORKSPACE}}/boost/boost

    steps:
    - uses: actions/checkout@v2
    
    # Additional steps...

    # Retrieve the cache, uses cache@v2
    - name: Cache boost
      uses: actions/cache@v2
      id: cache-boost
      with:
        # Set the path to cache
        path: ${{env.BOOST_PATH}}
        # Use the version as the key to only cache the correct version
        key: boost-${{env.BOOST_VERSION}}

    # Actual install step (only runs if the cache is empty)
    - name: Install boost
      if: steps.cache-boost.outputs.cache-hit != 'true'
      uses: MarkusJx/install-boost@v2.1.0
      with:
        # Set the boost version (required)
        boost_version: ${{env.BOOST_VERSION}}
        # Set the install directory
        boost_install_dir: ${{env.BOOST_PATH}}
        # Set your platform version
        platform_version: 2019
        # Set the toolset
        toolset: msvc
```