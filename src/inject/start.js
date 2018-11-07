var appConsole = {};

appConsole.log=console.log;

var s = document.createElement('script');
s.src = chrome.extension.getURL('src/inject/inject.js');

var jq = document.createElement('script');
jq.src = chrome.extension.getURL('js/jquery/jquery.js');

var css = document.createElement('link');
css.type = "text/css";
css.rel = "stylesheet";
css.href = chrome.extension.getURL('src/inject/checkbox.css');


jq.src = chrome.extension.getURL('js/jquery/jquery.js');

var doc = (document.head || document.documentElement);

doc.insertBefore(css, doc.firstChild);
doc.insertBefore(jq, doc.firstChild);
doc.insertBefore(s, doc.firstChild);