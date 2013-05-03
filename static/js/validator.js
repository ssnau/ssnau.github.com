/**
 * Created with JetBrains WebStorm.
 * User: Liu Xijin
 * Date: 5/2/13
 * Time: 11:13 PM
 */
(function(){

var browser =  [
    'clearInterval', 'clearTimeout', 'document', 'event', 'FormData',
    'frames', 'history', 'Image', 'localStorage', 'location', 'name',
    'navigator', 'Option', 'parent', 'screen', 'sessionStorage', 'self',
    'setInterval', 'setTimeout', 'Storage', 'window', 'XMLHttpRequest'
],  node = [
    'Buffer', 'clearInterval', 'clearTimeout', 'console', 'exports',
    'global', 'module', 'process', 'querystring', 'require',
    'setInterval', 'setTimeout', '__dirname', '__filename'
],  rhino = [
    'defineClass', 'deserialize', 'gc', 'help', 'load', 'loadClass',
    'print', 'quit', 'readFile', 'readUrl', 'runCommand', 'seal',
    'serialize', 'spawn', 'sync', 'toint32', 'version'
],  standard = [
    'Array', 'Boolean', 'Date', 'decodeURI', 'decodeURIComponent',
    'encodeURI', 'encodeURIComponent', 'Error', 'eval', 'EvalError',
    'Function', 'isFinite', 'isNaN', 'JSON', 'Math', 'Number',
    'Object', 'parseInt', 'parseFloat', 'RangeError', 'ReferenceError',
    'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError', 'undefined',
    'null', 'Infinity', 'escape', 'unescape'
],  windows = [
    'ActiveXObject', 'CScript', 'Debug', 'Enumerator', 'System',
    'VBArray', 'WScript', 'WSH'
],  mstr = ['mstr', 'mstrmojo', 'microstrategy', 'mstrConfig' , 'mstrApp'];

angular.module("app", [])

.directive("jsValidate", function(){
    return {
        link: function(scope, element, attr) {
            var timer = null;
            editor.getSession().on('change', function(){
                timer && clearTimeout(timer);
                timer = setTimeout(validate, 200);
            });

            element.click(validate);
            setTimeout(validate, 1);//make the function call out of the context, so that scope.apply can be ok.

            function validate(){
                var source = editor.getSession().getValue();
                var res = null, errors = [], warnings = [], scopeManager;
                try {
                    res = esprima.parse(source, { tolerant: true, loc: true, allowTrailingComma: false });
                    errors = res.errors || [];
                } catch(e) {
                    errors = [e];
                }

                if (!errors.length) { //只有当错误数量为0时，才执行scope检查
                    scopeManager = escope.analyze(res, {
                        globals: [].concat(browser, node, rhino, standard, windows, mstr)
                    });
                    console.log(scopeManager.scopes);
                    scopeManager.scopes.forEach(function(scope){
                        if (!scope.references) return;
                        scope.references.forEach(function(ref){
                            if (ref.resolved) return;//如果有resolved属性，则表明已经被声明好了，否则执行下面
                            warnings.push({
                                description: "\"" + ref.identifier.name + "\" is used before defined",
                                lineNumber: ref.identifier.loc.start.line,
                                column: ref.identifier.loc.start.column,
                                endLineNumber: ref.identifier.loc.end.line,
                                endColumn: ref.identifier.loc.end.column
                            })
                        });
                    });
                }

                scope.$apply(function(){
                    scope.errors = errors;
                    scope.warnings = warnings;
                    scope.success = !errors.length && !warnings.length;
                });
            }
        }

    }
})

.controller("ace", function($scope){
    $scope.jump = function(line, col) {
        editor.getSession().getSelection().selectionLead.setPosition(line - 1, col);
        editor.getSession().getSelection().clearSelection();
    };
    $scope.jumpWarn = function(warn) {
        editor.getSession().getSelection().clearSelection();
        editor.getSession().getSelection().selectionLead.setPosition(warn.lineNumber - 1, warn.column);
        editor.getSession().getSelection().selectTo(warn.endLineNumber - 1, warn.endColumn);
    }
});

//END!
})();
