# Download and install Boost
Install Boost in actions using prebuilt versions from [actions/boost-versions](https://github.com/actions/boost-versions).

## Inputs

### `boost_version`
**Required** The boost version to install, e.g. ``1.73.0``.
A list of supported versions can be found [here](https://github.com/actions/boost-versions/blob/main/versions-manifest.json).

### `toolset`
**Optional** A toolset used to compile boost, e.g. ``msvc14.2``. May only be used on windows, as the value on ubuntu is always ``gcc``.

### `platform_version`
**Optional** The platform version of the system boost was compiled on, e.g. ``18.04``. May be only used on ubuntu, as the value is undefined on windows,
thus, when specifying a value, this build step will fail.

### `boost_install_dir`
**Optional** The directory to install boost into. If specified, boost will be installed into 
``$boost_install_dir/boost/$BOOST_VERSION_STRING/``. The default value is ``${{env.GITHUB_WORKSPACE}}``.

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
The version of boost installed, e.g. ``boost-1.73.0-linux-16.04-gcc-x64``.

## Example usage
### Windows
```yml
- name: Install boost
  uses: MarkusJx/install-boost@v1.0
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

### Ubuntu
```yml
- name: Install boost
  uses: MarkusJx/install-boost@v1.0
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
