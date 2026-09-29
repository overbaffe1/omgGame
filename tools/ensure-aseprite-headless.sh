#!/usr/bin/env bash
# Recreates headless build assets in /tmp (survives sandbox /tmp rollbacks).
# - /tmp/x11fake/include : X11 headers assembled from GitHub mirrors
# - /tmp/fakex/lib       : stub X libs for linking
# - /tmp/aseprite-src patches reapplied
set -e
export PATH=$HOME/.local/bin:$PATH

mkdir -p /tmp/x11fake/include/X11/extensions /tmp/x11fake/include/X11/Xcursor /tmp/fakex/lib
L=/tmp/x11fake/include/X11

[ -f $L/Xlib.h ] || {
  cd /tmp
  rm -rf xsrc; mkdir xsrc; cd xsrc
  git clone -q --depth 1 --branch libX11-1.6.2 --filter=blob:none --sparse https://github.com/mirror/libX11 && (cd libX11 && git sparse-checkout set include -q)
  git clone -q --depth 1 https://github.com/lagggal/X11-headers x11hdr
  git clone -q --depth 1 --filter=blob:none --sparse https://github.com/wep21/libxrandr && (cd libxrandr && git sparse-checkout set include -q)
  git clone -q --depth 1 --filter=blob:none --sparse https://github.com/wep21/libxcursor && (cd libxcursor && git sparse-checkout set include -q)

  cp libX11/include/X11/*.h $L/ 2>/dev/null || true
  cp x11hdr/*.h $L/ 2>/dev/null || true
  cp x11hdr/extensions/*.h $L/extensions/ 2>/dev/null || true
  cp libxrandr/include/X11/extensions/Xrandr.h $L/extensions/ 2>/dev/null || true
  cp libxcursor/include/X11/Xcursor/Xcursor.h $L/Xcursor/ 2>/dev/null || true

  cat > $L/Xfuncproto.h <<'XEOF'
#ifndef _XFUNCPROTO_H_
#define _XFUNCPROTO_H_ 1
#ifndef _Xconst
#define _Xconst const
#endif
#ifndef NeedFunctionPrototypes
#define NeedFunctionPrototypes 1
#endif
#ifndef NeedWidePrototypes
#define NeedWidePrototypes 1
#endif
#ifdef __cplusplus
#define _XFUNCPROTOBEGIN extern "C" {
#define _XFUNCPROTOEND }
#else
#define _XFUNCPROTOBEGIN
#define _XFUNCPROTOEND
#endif
#ifndef _X_RESTRICT_KYWD
#define _X_RESTRICT_KYWD
#endif
#ifndef _X_INLINE
#define _X_INLINE inline
#endif
#define _X_DEPRECATED __attribute__((deprecated))
#define _X_SENTINEL(x) __attribute__((sentinel(x)))
#define _X_ATTRIBUTE_FORMAT(a,b,c) __attribute__((format(a,b,c)))
#define _X_NORETURN __attribute__((noreturn))
#ifndef _X_EXPORT
#define _X_EXPORT __attribute__((visibility("default")))
#endif
#ifndef _X_HIDDEN
#define _X_HIDDEN __attribute__((visibility("hidden")))
#endif
#ifndef _X_INTERNAL
#define _X_INTERNAL __attribute__((visibility("internal")))
#endif
#ifndef _X_COLD
#define _X_COLD
#endif
#endif
XEOF
  cat > $L/Xosdefs.h <<'XEOF'
#ifndef _XOSDEFS_H_
#define _XOSDEFS_H_ 1
#endif
XEOF
  # RandR 1.5 additions to old randr.h
  python3 - <<'PYEOF'
p='/tmp/x11fake/include/X11/extensions/randr.h'
s=open(p).read()
marker='/* --- RandR 1.3/1.5 additions (appended for headless build) --- */'
if marker in s:
    s=s[:s.index(marker)]
s+='''
/* --- RandR 1.3/1.5 additions (appended for headless build) --- */
#ifndef _RANDR_H_15_ADDITIONS
#define _RANDR_H_15_ADDITIONS
typedef unsigned long RROutput;
typedef unsigned long RRCrtc;
typedef unsigned long RRProvider;
typedef unsigned long RRLease;
typedef struct {
    unsigned long name;
    int primary;
    int automatic;
    int noutput;
    int x;
    int y;
    int width;
    int height;
    int mwidth;
    int mheight;
    unsigned long outputs;
} XRRMonitorInfo;
#endif
'''
open(p,'w').write(s)
PYEOF
  sed -i '1i #include <X11/Xlib.h>' $L/extensions/Xrandr.h
  cd /tmp/xsrc
}

for n in X11 Xcursor Xrandr Xi; do
  [ -f /tmp/fakex/lib/lib$n.so ] || { echo '/* stub */' > /tmp/fakex/lib/$n.c && gcc -shared -fPIC -o /tmp/fakex/lib/lib$n.so /tmp/fakex/lib/$n.c; }
done

# Aseprite source + patches
[ -d /tmp/aseprite-src/.git ] || {
  cd /tmp && git clone -q --depth 1 --shallow-submodules --recurse-submodules -j8 --branch v1.3.18.6 https://github.com/aseprite/aseprite.git aseprite-src
}
python3 - <<'PYEOF'
import os
p='/tmp/aseprite-src/laf/os/CMakeLists.txt'
s=open(p).read()
if 'ASEPRITE_FAKE_X11' not in s:
    s=s.replace("""  find_package(Threads REQUIRED)
  list(APPEND LAF_OS_PLATFORM_LIBS ${CMAKE_THREAD_LIBS_INIT})

  find_package(X11 REQUIRED)
  target_include_directories(laf-os PRIVATE ${X11_INCLUDE_DIR})
  list(APPEND LAF_OS_PLATFORM_LIBS ${X11_LIBRARIES})
  if(NOT X11_Xcursor_FOUND)
    message(FATAL_ERROR "Xcursor library not found")
  endif()
  if(NOT X11_Xinput_FOUND)
    message(FATAL_ERROR "Xinput library not found")
  endif()
  if(NOT X11_Xrandr_FOUND)
    message(FATAL_ERROR "Xrandr library not found")
  endif()
  list(APPEND LAF_OS_PLATFORM_LIBS ${X11_Xcursor_LIB} ${X11_Xrandr_LIB})""",
"""  find_package(Threads REQUIRED)
  list(APPEND LAF_OS_PLATFORM_LIBS ${CMAKE_THREAD_LIBS_INIT})

  if(ASEPRITE_FAKE_X11)
    # Headless build: fake X11 headers + stub libs (CLI-only, no display)
    target_include_directories(laf-os SYSTEM PRIVATE ${ASEPRITE_FAKE_X11_INCLUDE_DIR})
    list(APPEND LAF_OS_PLATFORM_LIBS
      ${ASEPRITE_FAKE_X11_LIB_DIR}/libX11.so
      ${ASEPRITE_FAKE_X11_LIB_DIR}/libXcursor.so
      ${ASEPRITE_FAKE_X11_LIB_DIR}/libXrandr.so
      ${ASEPRITE_FAKE_X11_LIB_DIR}/libXi.so)
  else()
  find_package(X11 REQUIRED)
  target_include_directories(laf-os PRIVATE ${X11_INCLUDE_DIR})
  list(APPEND LAF_OS_PLATFORM_LIBS ${X11_LIBRARIES})
  if(NOT X11_Xcursor_FOUND)
    message(FATAL_ERROR "Xcursor library not found")
  endif()
  if(NOT X11_Xinput_FOUND)
    message(FATAL_ERROR "Xinput library not found")
  endif()
  if(NOT X11_Xrandr_FOUND)
    message(FATAL_ERROR "Xrandr library not found")
  endif()
  list(APPEND LAF_OS_PLATFORM_LIBS ${X11_Xcursor_LIB} ${X11_Xrandr_LIB})
  endif()""")
    s=s.replace('if(LAF_WITH_CLIP)','if(LAF_WITH_CLIP OR ASEPRITE_FAKE_X11)')
    open(p,'w').write(s)

p='/tmp/aseprite-src/laf/dlgs/CMakeLists.txt'
s=open(p).read()
if 'ASEPRITE_FAKE_X11' not in s:
    s=s.replace("""else()
  target_sources(laf-dlgs PRIVATE file_dialog_x11.cpp)
endif()""",
"""else()
  target_sources(laf-dlgs PRIVATE file_dialog_x11.cpp)
  if(ASEPRITE_FAKE_X11)
    target_include_directories(laf-dlgs SYSTEM PRIVATE ${ASEPRITE_FAKE_X11_INCLUDE_DIR})
  endif()
endif()""")
    open(p,'w').write(s)

p='/tmp/aseprite-src/laf/CMakeLists.txt'
s=open(p).read()
if 'if(LAF_WITH_CLIP OR ASEPRITE_FAKE_X11)' not in s:
    s=s.replace('if(LAF_WITH_CLIP)','if(LAF_WITH_CLIP OR ASEPRITE_FAKE_X11)')
    open(p,'w').write(s)

p='/tmp/aseprite-src/laf/clip/CMakeLists.txt'
s=open(p).read()
if 'AND NOT ASEPRITE_FAKE_X11' not in s:
    s=s.replace('elseif(UNIX AND NOT EMSCRIPTEN)','elseif(UNIX AND NOT EMSCRIPTEN AND NOT ASEPRITE_FAKE_X11)')
    open(p,'w').write(s)

p='/tmp/aseprite-src/src/ui/drag_event.h'
s=open(p).read()
if '#if CLIP_ENABLE_IMAGE' not in s:
    s=s.replace("  os::SurfaceRef getImage() const { return m_ev.dataProvider()->getImage(); }",
"""#if CLIP_ENABLE_IMAGE
  os::SurfaceRef getImage() const { return m_ev.dataProvider()->getImage(); }
#endif""")
    open(p,'w').write(s)

p='/tmp/aseprite-src/src/app/commands/cmd_new_file.cpp'
s=open(p).read()
if '#if CLIP_ENABLE_IMAGE' not in s:
    s=s.replace("""    clipboardImage = (params().fromClipboard() ? ctx->clipboard()->getImage(&clipboardPalette) :
                                                 ctx->draggedData()->getImage());""",
"""#if CLIP_ENABLE_IMAGE
    clipboardImage = (params().fromClipboard() ? ctx->clipboard()->getImage(&clipboardPalette) :
                                                 ctx->draggedData()->getImage());
#endif""")
    open(p,'w').write(s)
print("patches ok")
PYEOF
echo "ASSETS OK"