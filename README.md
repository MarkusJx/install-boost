# Download and install Boost
Install Boost in GitHub actions using prebuilt binaries.

## Inputs

### `boost_version`
**Required** The boost version to install, e.g. ``1.73.0``.
A list of supported versions can be found [here](https://github.com/MarkusJx/prebuilt-boost/blob/main/versions-manifest.json).

### `platform_version`
**Optional** The platform version of the system boost was compiled on, e.g. ``18.04`` for ``ubuntu-18.04``, ``2016`` for ``windows-2016`` or ``10.15`` for ``macos-10.15``.

### `boost_install_dir`
**Optional** The directory to install boost into. If specified, boost will be installed into 
``$boost_install_dir/boost/boost/``. The default value is ``${{env.GITHUB_WORKSPACE}}``.

### `version`
**Optional** The version of the ``install-boost`` script to use. Must be either ``default`` or ``legacy``. Defaults to ``default``.
If the ``default`` version is used, the binaries are downloaded from [MarkusJx/prebuilt-boost](https://github.com/MarkusJx/prebuilt-boost).
The list of supported toolsets and versions can be found [here](https://github.com/MarkusJx/prebuilt-boost/blob/main/versions-manifest.json).
If the ``legacy`` version is used, the binaries are downloaded from [actions/boost-versions](https://github.com/actions/boost-versions).
The list of supported toolsets and versions can be found [here](https://github.com/actions/boost-versions/blob/main/versions-manifest.json).

### `toolset`
**DEPRECATED Optional** A toolset used to compile boost, e.g. ``msvc14.2``. May only be used on windows, as the value on ubuntu is always ``gcc``.
Can only be specified when the ``legacy`` version is used.

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
  uses: MarkusJx/install-boost@v2.0.0
  id: install-boost
  with:
    # REQUIRED: Specify the required boost version
    # A list of supported versions can be found here: 
    # https://github.com/actions/boost-versions/blob/main/versions-manifest.json
    boost_version: 1.73.0
    # OPTIONAL: Specify a custon install location
    boost_install_dir: C:\some_directory
    # OPTIONAL: Specify a platform version
    platform_version: 2016
    
    # NOTE: If a boost version matching all requirements cannot be found,
    # this build step will fail
```

### Ubuntu
```yml
- name: Install boost
  uses: MarkusJx/install-boost@v2.0.0
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
    
    # NOTE: If a boost version matching all requirements cannot be found,
    # this build step will fail
```

### MacOs
```yml
- name: Install boost
  uses: MarkusJx/install-boost@v2.0.0
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
    
    # NOTE: If a boost version matching all requirements cannot be found,
    # this build step will fail
```
