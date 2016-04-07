var pkg = require('./package.json')

// node modules
, path = require('path')
, fs = require('fs')

// npm modules
, del = require('del')
, through = require('through2')

// gulp plugins
, gulp = require('gulp')
, rjs = require('gulp-requirejs-optimize')
, concat = require('gulp-concat')
, autoprefixer = require('gulp-autoprefixer')
, minifyCSS = require('gulp-minify-css')
, minifyHTML = require('gulp-htmlmin')
, uglify = require('gulp-uglify')
, replace = require('gulp-replace-task')
, rename = require('gulp-rename')
, scriptCSS = require('gulp-scriptcss')
, imagemin = require('gulp-imagemin')

// 构建版本号
, version = pkg.version + '_' + (+new Date())
// 文件夹路径前缀
, staticsPathPrefix = 'dist/app'
// 文件夹路径
, staticsPath = staticsPathPrefix + '/views'
// 文件夹名称
, staticsDirName = 'app_' + version

// === 如果需要修改plugins文件夹的中内容, 修改完毕后
// 请更新package.json中的versionVendor版本号

// 第三方库版本号
, versionVendor = pkg.versionVendor
// 第三方库文件夹路径前缀
, vendorPathPrefix = 'dist/app/plugins'
// 第三方库文件夹路径
, vendorPath = vendorPathPrefix
// 文件夹名称
, vendorDirName = 'vendor_' + versionVendor

// 组件库
, componentsPath = 'dist/app/components'

// cdn URL
, staticsUrl = process.env.STATICS
// cdn vendor URL
, vendorUrl
// replace options
, replaceOption;

if(!staticsUrl){
    staticsUrl = pkg.staticsUrl || '//localhost';
}

vendorUrl = staticsUrl + '/' + vendorDirName;
staticsUrl = staticsUrl + '/' + staticsDirName;

replaceOption = {
    patterns: [{
        match: 'staticsUrl',
        replacement: staticsUrl
    }, {
        match: 'vendorUrl',
        replacement: vendorUrl
    }, {
        match: /\/statics\/dishes\/images\//g,
        replacement: staticsUrl + '/images/'
    }]
};

// -----------------------------------------------------------------------
// ! gulp taks                                                           |
// -----------------------------------------------------------------------

// clean dist dir last build
gulp.task('clean', function(done){
    del([
        'dist/*/'
    ], done);
});

// 压缩第三方js文件
gulp.task('plugins:js', ['clean'], function(){
    return gulp.src([
            'src/bower_components/angular/angular.min.js',
            'src/bower_components/angular-animate/angular-animate.min.js',
            'src/bower_components/angular-loader/angular-loader.min.js',
            'src/bower_components/angular-mocks/angular-mocks.min.js',
            'src/bower_components/angular-route/angular-route.min.js',
            'src/bower_components/html5-boilerplate/dist/js/vendor/modernizr-2.8.3.min.js'
        ])
        .pipe(concat('plugins.min.js', {
            newLine: ';\n'
        }))
        .pipe(gulp.dest(vendorPath));
});

// 压缩第三方css文件
gulp.task('plugins:css', ['clean'], function(){
    return gulp.src([
            'src/bower_components/html5-boilerplate/dist/css/normalize.css',
            'src/bower_components/html5-boilerplate/dist/css/main.css',
            'src/app.css'
        ])
        .pipe(concat('plugins.min.css'))
        .pipe(gulp.dest(vendorPath));
});

// 处理html文件, 压缩, 替换路径
gulp.task('app:html', ['clean'], function(){
    return gulp.src([
            'src/views/**/*.html'
        ])
        .pipe(minifyHTML({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(replace(replaceOption))
        .pipe(gulp.dest(staticsPath));
});

// 压缩componets中的js文件
gulp.task('components:js', ['clean'], function(){
    return gulp.src([
            'src/components/**/*.js',
            '!src/components/**/*_test.js'
        ])
        .pipe(concat('components.min.js', {
            newLine: ';\n'
        }))
        .pipe(gulp.dest(componentsPath));
});

// 处理js文件
// 1. 添加module id
// 2. 替换路径
// 3. 压缩
// 4. 添加行内css
gulp.task('app:js', ['clean'], function(){/*, 'app.css'*/
    return gulp.src([
            'src/views/**/*.js',
            '!src/views/**/*_test.js'
        ])
        .pipe(rjs(function(file){
            return {
                name: file.relative.replace(/\.js$/, ''),
                optimize: 'none',
                // only main.js include app.js' content
               /* exclude: ('main.js' == path.basename(file.relative)) ? null : ['app'],*/
                paths: {
                    imagesloaded: 'empty:',
                    swiper: 'empty:',
                    config: 'empty:'
                }
            };
        }))
        .pipe(replace(replaceOption))
        .pipe(uglify({
            mangle: {
                except: ['define', 'require', 'angular']
            },
            compress: {
                global_defs: {
                    DEBUG: false
                }
            },
            output: {
                ascii_only: true
            }
        }))
       /* .pipe(scriptCSS({
            main: 'main.js',
            specials: {
                'main.js': [
                    staticsPath + '/css/rootCtrl.css'
                ]
            },
            cssdir: [
                staticsPath + '/css',
                staticsPath + '/directives'
            ]
        }))*/
        .pipe(rename(function(file){
            if(file.basename == 'main'){
                file.basename = 'app'
            }
        }))
        .pipe(gulp.dest(staticsPath));
});

// 更新服务器端模板文件
/*gulp.task('wecook.server', function(){
    return gulp.src('Application/Mobile/View/Dishes/index.orig.html')
        .pipe(replace(replaceOption))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('Application/Mobile/View/Dishes'));
});*/

gulp.task('default', [
    'clean'
    , 'plugins:js'
    , 'plugins:css'
    , 'components:js'
    , 'app:html'
    , 'app:js'
]);