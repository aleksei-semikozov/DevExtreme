(function () {
  var theme = new URLSearchParams(window.location.search).get('theme') || 'fluent.blue.light';
  var base = document.currentScript.src.replace(/theme\.js.*$/, '');
  document.write('<link rel="stylesheet" type="text/css" href="' + base + 'node_modules/devextreme-dist/css/dx.' + theme + '.css" />');
}());
