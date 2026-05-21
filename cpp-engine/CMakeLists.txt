cmake_minimum_required(VERSION 3.15)
project(neurox_engine VERSION 2.1.0 LANGUAGES CXX)

# ── C++17 required for std::optional, structured bindings, etc.
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# ── Output directory
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# ── Compiler flags
if(MSVC)
    add_compile_options(/W4 /O2)
else()
    add_compile_options(-Wall -Wextra -O2 -fvisibility=hidden)
endif()

# ── Shared library: libmonitor (loaded by Python via ctypes)
add_library(monitor SHARED
    packet_sniffer.cpp
    performance_monitor.cpp
    monitor_bridge.cpp
)

target_include_directories(monitor PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# ── Platform-specific linking
if(WIN32)
    target_link_libraries(monitor PRIVATE ws2_32)
elseif(APPLE)
    target_link_libraries(monitor PRIVATE "-framework CoreFoundation")
else()
    # Linux: link pthreads
    find_package(Threads REQUIRED)
    target_link_libraries(monitor PRIVATE Threads::Threads)
endif()

# ── Optional: standalone test executable
add_executable(neurox_test
    test/main_test.cpp
)
target_include_directories(neurox_test PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)
target_link_libraries(neurox_test PRIVATE monitor)

# ── Install rules
install(TARGETS monitor
    LIBRARY DESTINATION lib
    RUNTIME DESTINATION bin
)
install(FILES include/monitor.h DESTINATION include)

# ── Print summary
message(STATUS "NEURO-X C++ Engine v${PROJECT_VERSION}")
message(STATUS "  Build type : ${CMAKE_BUILD_TYPE}")
message(STATUS "  Output lib : ${CMAKE_LIBRARY_OUTPUT_DIRECTORY}")
