#include "printer.h"
#include <iostream>

void PrintRaw(const PrintJob& job) {
    // Windows implementation stub
    std::cout << "[Windows Stub] Printing to " << job.printerName << std::endl;
}

std::vector<std::string> GetPrinters() {
    // Windows implementation stub
    return {"Windows_Printer_Stub"};
}
