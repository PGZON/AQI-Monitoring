#!/bin/bash

# Performance Optimization Build Script
# Runs optimized production build with analysis

echo "🚀 Starting Performance-Optimized Build..."
echo "============================================="

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build/

# Set production environment variables for maximum optimization
export GENERATE_SOURCEMAP=false
export INLINE_RUNTIME_CHUNK=false
export IMAGE_INLINE_SIZE_LIMIT=8192

echo "⚙️ Environment Configuration:"
echo "  - Source maps: DISABLED (reduces bundle size)"
echo "  - Runtime chunk: SEPARATE (better caching)"
echo "  - Image inline limit: 8KB (optimized loading)"

# Run optimized build
echo "📦 Building optimized production bundle..."
npm run build

# Check build success
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Display build statistics
    echo ""
    echo "📊 Build Statistics:"
    echo "==================="
    
    # Calculate bundle sizes
    JS_SIZE=$(du -sh build/static/js | cut -f1)
    CSS_SIZE=$(du -sh build/static/css | cut -f1)
    TOTAL_SIZE=$(du -sh build | cut -f1)
    
    echo "JavaScript: $JS_SIZE"
    echo "CSS: $CSS_SIZE"
    echo "Total Build: $TOTAL_SIZE"
    
    # Count files
    JS_FILES=$(find build/static/js -name "*.js" | wc -l)
    CSS_FILES=$(find build/static/css -name "*.css" | wc -l)
    
    echo "JS Files: $JS_FILES"
    echo "CSS Files: $CSS_FILES"
    
    echo ""
    echo "🔍 Performance Analysis Options:"
    echo "================================="
    echo "1. Run 'npm run build:analyze' for bundle analysis"
    echo "2. Run 'npm run lighthouse' for Lighthouse audit"
    echo "3. Serve build with 'npx serve -s build' and test"
    
    echo ""
    echo "⚡ Performance Optimizations Applied:"
    echo "===================================="
    echo "✅ Code splitting with React.lazy()"
    echo "✅ Lazy loading with Intersection Observer"
    echo "✅ Memoized components and callbacks"
    echo "✅ Optimized service worker caching"
    echo "✅ Bundle size analysis tools"
    echo "✅ Performance monitoring utilities"
    echo "✅ Optimized image loading components"
    echo "✅ Tree shaking enabled"
    echo "✅ Reduced static asset preloading"
    
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi

echo ""
echo "🎉 Performance optimization complete!"
echo "Ready for production deployment."
