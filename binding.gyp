{
  "targets": [
    {
      "target_name": "addon",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.15"
      },
      "sources": [
        "addon/src/addon.cc"
        
      ],
      "conditions": [
        ['OS=="mac"', {
          "sources": [ "addon/src/printer_mac.cc" ]
        }],
        ['OS=="win"', {
          "sources": [ "addon/src/printer_win.cc" ]
        }]
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": [ "NAPI_CPP_EXCEPTIONS" ]
    }
  ]
}
