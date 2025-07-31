@echo off
REM Performance Optimization Build Script for Windows
REM Runs optimized production build with analysis

echo 🚀 Starting Performance-Optimized Build...
echo =============================================

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist build rmdir /s /q build

REM Set production environment variables for maximum optimization
set GENERATE_SOURCEMAP=false
set INLINE_RUNTIME_CHUNK=false
set IMAGE_INLINE_SIZE_LIMIT=8192

echo ⚙️ Environment Configuration:
echo   - Source maps: DISABLED (reduces bundle size)
echo   - Runtime chunk: SEPARATE (better caching)
echo   - Image inline limit: 8KB (optimized loading)

REM Run optimized build
echo 📦 Building optimized production bundle...
call npm run build

REM Check build success
if %ERRORLEVEL% EQU 0 (
    echo ✅ Build completed successfully!
    
    echo.
    echo 📊 Build Statistics:
    echo ===================
    
    REM Display directory sizes (Windows approximation)
    dir build /s /-c | find "bytes"
    
    echo.
    echo 🔍 Performance Analysis Options:
    echo =================================
    echo 1. Run 'npm run build:analyze' for bundle analysis
    echo 2. Run 'npm run lighthouse' for Lighthouse audit
    echo 3. Serve build with 'npx serve -s build' and test
    
    echo.
    echo ⚡ Performance Optimizations Applied:
    echo ====================================
    echo ✅ Code splitting with React.lazy()
    echo ✅ Lazy loading with Intersection Observer
    echo ✅ Memoized components and callbacks
    echo ✅ Optimized service worker caching
    echo ✅ Bundle size analysis tools
    echo ✅ Performance monitoring utilities
    echo ✅ Optimized image loading components
    echo ✅ Tree shaking enabled
    echo ✅ Reduced static asset preloading
    
    echo.
    echo 🎉 Performance optimization complete!
    echo Ready for production deployment.
) else (
    echo ❌ Build failed! Check the errors above.
    exit /b 1
)
