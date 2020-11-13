#ifndef _WIN32
#   define _GNU_SOURCE
#endif // NOT WIN32

#include <boost/stacktrace.hpp>
#include <iostream>

int main() {
    std::cout << boost::stacktrace::stacktrace() << std::endl;

    return 0;
}