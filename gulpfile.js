const { series, watch, src, dest, parallel } = require("gulp");
const pump = require("pump");

// ЗАМІНЕНО: livereload на browser-sync
const browserSync = require("browser-sync").create();
const postcss = require("gulp-postcss");
const zip = require("gulp-zip");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const beeper = require("beeper");

// postcss plugins
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const easyimport = require("postcss-easy-import");

// Ініціалізація BrowserSync сервера
function serve(done) {
  browserSync.init({
    proxy: "localhost:2400", // Ghost за замовчуванням працює тут
    port: 3000,
  });
  done();
}

const handleError = (done) => {
  return function (err) {
    if (err) {
      beeper();
    }
    return done(err);
  };
};

function hbs(done) {
  pump(
    [src(["*.hbs", "partials/**/*.hbs"]), browserSync.stream()],
    handleError(done)
  );
}

function css(done) {
  pump(
    [
      src("assets/css/screen.css", { sourcemaps: true }),
      postcss([easyimport, autoprefixer(), cssnano()]),
      dest("assets/built/", { sourcemaps: "." }),
      browserSync.stream(),
    ],
    handleError(done)
  );
}

function js(done) {
  pump(
    [
      src(["assets/js/lib/*.js", "assets/js/*.js"], { sourcemaps: true }),
      concat("source.js"),
      uglify(),
      dest("assets/built/", { sourcemaps: "." }),
      browserSync.stream(),
    ],
    handleError(done)
  );
}

function zipper(done) {
  const filename = require("./package.json").name + ".zip";

  pump(
    [
      src([
        "**",
        "!node_modules",
        "!node_modules/**",
        "!dist",
        "!dist/**",
        "!yarn-error.log",
        "!yarn.lock",
        "!gulpfile.js",
      ]),
      zip(filename),
      dest("dist/"),
    ],
    handleError(done)
  );
}

const cssWatcher = () => watch("assets/css/**", css);
const jsWatcher = () => watch("assets/js/**", js);
const hbsWatcher = () => watch(["*.hbs", "partials/**/*.hbs"], hbs);
const watcher = parallel(cssWatcher, jsWatcher, hbsWatcher);
const build = series(css, js);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = series(build, serve, watcher);
