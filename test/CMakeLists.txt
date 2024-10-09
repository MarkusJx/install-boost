cmake_minimum_required(VERSION 3.14)
project(test CXX)

set(CMAKE_CXX_STANDARD 17)

if (BUILD_ARM_BINARIES)
    message(STATUS "Compiling for ARM64")
    set(CMAKE_SYSTEM_PROCESSOR arm)
    set(CROSS aarch64-linux-gnu-)
    set(CMAKE_C_COMPILER ${CROSS}gcc)
    set(CMAKE_CXX_COMPILER ${CROSS}g++)
    set(AS_EXECUTABLE ${CROSS}as)
    set(CMAKE_C_FLAGS_INIT "-march=armv8-a")
    set(CMAKE_CXX_FLAGS_INIT "-march=armv8-a")
    set(AOM_AS_FLAGS "-march=armv8-a")
    set(CMAKE_SYSTEM_PROCESSOR "arm64")
endif()

find_package(Boost 1.70 COMPONENTS thread chrono REQUIRED)

message(STATUS "Boost version: ${Boost_VERSION_STRING}")
message(STATUS "Boost library directory: ${Boost_LIBRARY_DIRS}")
message(STATUS "Boost include directory: ${Boost_INCLUDE_DIRS}")

include_directories(${Boost_INCLUDE_DIRS})

add_executable(${PROJECT_NAME} test.cpp)

target_link_directories(${PROJECT_NAME} PUBLIC ${Boost_LIBRARY_DIRS})

if (NOT WIN32)
    message(STATUS "Building on linux/macOS")
    target_link_libraries(${PROJECT_NAME} PRIVATE dl pthread ${Boost_LIBRARIES})
elseif (MSYS OR MINGW)
    message(STATUS "Building on msys/mingw")
    target_link_libraries(${PROJECT_NAME} PRIVATE pthread ${Boost_LIBRARIES})
else()
    message(STATUS "Building on windows")
endif()
