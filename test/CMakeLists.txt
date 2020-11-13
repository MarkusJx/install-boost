project(test CXX)
CMAKE_MINIMUM_REQUIRED(VERSION 3.14)

set(CMAKE_CXX_STANDARD 17)

find_package(Boost 1.72 REQUIRED)

message(STATUS "Boost version: ${Boost_VERSION_STRING}")
message(STATUS "Boost library directory: ${Boost_LIBRARY_DIRS}")
message(STATUS "Boost include directory: ${Boost_INCLUDE_DIRS}")

include_directories(${Boost_INCLUDE_DIRS})

add_executable(${PROJECT_NAME} test.cpp)

if (NOT WIN32)
    target_link_libraries(${PROJECT_NAME} PRIVATE dl)
endif ()
