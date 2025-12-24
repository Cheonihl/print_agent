#include <napi.h>
#include "printer.h"

// Wrapper for PrintRaw
void PrintRawWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 2) {
    Napi::TypeError::New(env, "Expected 2 arguments: printerName, data").ThrowAsJavaScriptException();
    return;
  }

  if (!info[0].IsString() || !info[1].IsString()) { // Using String for data (raw bytes as string)
      // Note: Ideally we should use Buffer for binary data, but for simplicity starting with String
      // If we use Buffer: info[1].As<Napi::Buffer<char>>()
     Napi::TypeError::New(env, "Expected string arguments").ThrowAsJavaScriptException();
     return;
  }

  PrintJob job;
  job.printerName = info[0].As<Napi::String>().Utf8Value();
  
  // Handling Buffer
  if (info[1].IsBuffer()) {
      Napi::Buffer<char> buffer = info[1].As<Napi::Buffer<char>>();
      job.data = std::string(buffer.Data(), buffer.Length());
  } else {
      job.data = info[1].As<Napi::String>().Utf8Value();
  }

  try {
    PrintRaw(job);
  } catch (const std::exception& e) {
    Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
  }
}

// Wrapper for GetPrinters
Napi::Value GetPrintersWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::vector<std::string> printers = GetPrinters();

  Napi::Array result = Napi::Array::New(env, printers.size());
  for (size_t i = 0; i < printers.size(); i++) {
    result[i] = Napi::String::New(env, printers[i]);
  }

  return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "printRaw"), Napi::Function::New(env, PrintRawWrapped));
  exports.Set(Napi::String::New(env, "getPrinters"), Napi::Function::New(env, GetPrintersWrapped));
  return exports;
}

NODE_API_MODULE(addon, Init)
