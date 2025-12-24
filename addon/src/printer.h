#pragma once

#include <string>
#include <vector>
#include <napi.h>

struct PrintJob {
  std::string printerName;
  std::string data; // Raw bytes
};

struct PrinterStatus {
  std::string name;
  std::string status; // "IDLE", "PRINTING", "STOPPED", "UNKNOWN"
};

// OS-specific implementations
void PrintRaw(const PrintJob& job);
std::vector<std::string> GetPrinters();
