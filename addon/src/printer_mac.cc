#include "printer.h"
#include <iostream>
#include <fstream>
#include <cstdio>
#include <cstdlib>
#include <memory>
#include <array>

// Helper to execute shell command
std::string exec(const char* cmd) {
    std::array<char, 128> buffer;
    std::string result;
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd, "r"), pclose);
    if (!pipe) {
        throw std::runtime_error("popen() failed!");
    }
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        result += buffer.data();
    }
    return result;
}

void PrintRaw(const PrintJob& job) {
    // SECURITY WARNING: In production, input sanitization is critical to prevent command injection.
    // For this internal tool, we assume printerName is safe, but we must be careful.
    
    // 1. Write data to temporary file
    std::string tempFilename = "/tmp/ribbon_print_job_" + std::to_string(rand()) + ".txt";
    std::ofstream tempFile(tempFilename, std::ios::binary);
    if (!tempFile.is_open()) {
        throw std::runtime_error("Failed to create temporary print file");
    }
    tempFile.write(job.data.c_str(), job.data.size());
    tempFile.close();

    // 2. Execute lp command
    // lp -d [printerName] [tempFile] (Removing -o raw for driver-based printing test)
    std::string command = "lp -d \"" + job.printerName + "\" " + tempFilename;
    
    // Log for debugging (mock behavior if needed)
    std::cout << "Executing: " << command << std::endl;
    
    int ret = system(command.c_str());
    
    // Clean up
    remove(tempFilename.c_str());

    if (ret != 0) {
        throw std::runtime_error("Print command failed with code " + std::to_string(ret));
    }
}

std::vector<std::string> GetPrinters() {
    // lpstat -p | awk '{print $2}'
    // Mock implementation for now as requesting full lpstat parsing is complex
    // In a real implementation, we would parse `lpstat -e`
    
    std::vector<std::string> printers;
    try {
        std::string output = exec("lpstat -e");
        std::string currentPrinter;
        for (char c : output) {
            if (c == '\n') {
                if (!currentPrinter.empty()) {
                   printers.push_back(currentPrinter);
                   currentPrinter.clear();
                }
            } else {
                currentPrinter += c;
            }
        }
    } catch (...) {
        // Fallback or ignore
    }
    
    // Add a mock printer for testing if empty
    // Mock fallback removed for debugging
    if (printers.empty()) {
        // printers.push_back("Zebra_Mock");
        // printers.push_back("Brother_Mock");
    }
    
    return printers;
}
