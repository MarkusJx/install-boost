#ifndef _WIN32
#   define _GNU_SOURCE
#endif // NOT WIN32

#include <boost/stacktrace.hpp>
#include <boost/thread.hpp>
#include <boost/chrono.hpp>
#include <iostream>

void thread_work() {
    boost::this_thread::sleep_for(boost::chrono::seconds{2});
}

int main() {
    boost::thread t{thread_work};
    t.join();
    
    std::cout << boost::stacktrace::stacktrace() << std::endl;

    return 0;
}
