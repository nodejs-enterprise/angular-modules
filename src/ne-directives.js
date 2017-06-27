
/**
 *                                                  NE DIRECTIVES
 * ***************************************************************************************************************************
 */

angular.module('neDirectives',['neObject'])
.directive('neInitData', [ function() {
    return {
        priority: 1000,
        restrict: 'AE',
        compile: function(){
            return {
                pre: function(scope, element, attrs){
                    if(attrs.neInitData) {
                        scope.$eval((attrs.neInitAs ? attrs.neInitAs+'=' : '')+attrs.neInitData);
                    }
                    else if(element.html()){
                        scope.$eval((attrs.neInitAs ? attrs.neInitAs+'=' : '')+element.html());
                    }
                    
                    if(attrs.neInitDone) {
                        scope.$eval(attrs.neInitDone);
                    }
                }
            };
        }
    };
}])
.service('neKeyPressHandler', [function(){
    return function(attrName, keyCode, preventDefault){
        return function(scope, element, attrs) {
            var target;

            if(element[0].nodeName === 'INPUT') target = element;
            else target = angular.element(document);

            target.bind('keydown keypress', keyPressed);
            function keyPressed(event) {
                if(event.which === keyCode) {
                    scope.$apply(function (){
                        scope.$eval(attrs[ attrName ]);
                    });
                    if(preventDefault) event.preventDefault();
                }
            }

            scope.$on('$destroy', function(){
                target.unbind('keydown keypress', keyPressed);
            });
        };
    };
}])
.directive('neKeypressEnter', [ 'neKeyPressHandler', function(keyPressHandler) {
    return keyPressHandler('neKeypressEnter', 13, true);
}])
.directive('neKeypressEscape', [ 'neKeyPressHandler', function(keyPressHandler) {
    return keyPressHandler('neKeypressEscape', 27, true);
}])
.directive('neKeypressRight', [ 'neKeyPressHandler', function(keyPressHandler) {
    return keyPressHandler('neKeypressRight', 39);
}])
.directive('neKeypressLeft', [ 'neKeyPressHandler', function(keyPressHandler) {
    return keyPressHandler('neKeypressLeft', 37);
}])
.directive('neKeypressUp', [ 'neKeyPressHandler', function(keyPressHandler) {
    return keyPressHandler('neKeypressUp', 38);
}])
.directive('neKeypressDown', [ 'neKeyPressHandler', function(keyPressHandler) {
    return keyPressHandler('neKeypressDown', 40);
}])
.directive('neKeypressBackspace', [ 'neKeyPressHandler', function(keyPressHandler) {
    return keyPressHandler('neKeypressBackspace', 8);
}])
.directive('neLoadingStart', ['$timeout', function($timeout){
    return function(scope, element, attrs) {
        if(element[0].nodeName !== 'IMG') return;

        attrs.$observe('src', function(){
            $timeout(function (){
                scope.$eval(attrs.neLoadingStart);
            });
        });
    };
}])
.directive('neLoadingEnd', ['$timeout', function($timeout){
    return function(scope, element, attrs) {
        if(element[0].nodeName !== 'IMG') return;

        element.bind('load', onLoad);
        function onLoad(event) {
            $timeout(function (){
                scope.$eval(attrs.neLoadingEnd);
            },5);
            event.preventDefault();
        }

        scope.$on('$destroy', function(){
            element.unbind('load', onLoad);
        });
    };
}])
.directive('neStatusIcon', [function() {
    return {
        restrict: 'A',
        compile: function(element, attrs){
            // create template
            var template =  '<div class="right-inner-addon">' +
                                (attrs.neStatusIcon!=='reverse' ? '<i class="fa fa-check text-success" ng-show="' +element.attr('ng-model')+ '"></i>' : '') +
                                (attrs.neStatusIcon==='reverse' ? '<i class="fa fa-times text-danger" ng-show="!' +element.attr('ng-model')+ '"></i>' : '') +
                            '</div>';
            
            // wrap element
            element.wrap(template);
            // prevent infinite wrapping
            element.removeAttr('status-icon');
        }
    };
}])
.directive('neMatchHrefPath', [ '$window','$location', function($window, $location) {
    return {
        priority:-100,
        link: function (scope, element, attrs) {
            var className = scope.$eval(attrs.neMatchHrefPath) || attrs.neMatchHrefPath;
            if(!className) return;
            
            var href;
            if(attrs.href) {
                try { href = scope.$eval(attrs.href); }
                catch(err){ href = attrs.href; }
            }
            else {
                var link = element.find('a')[0];
                href = link ? link.getAttribute('href') : null;
                if(link && href) {
                    try { href = scope.$eval(href.replace('{{','').replace('}}','')); }
                    catch(err){ href = href; }
                }
            }
            
            if(href && href.indexOf('#')===-1) {
                href = href.replace(/^http:/g,'').replace(/^https:/g,'').replace($window.location.hostname,'').replace(/\/+/g,'/');
                if(($window.location.pathname+'/').match(new RegExp('^' +href+ '[\/\#\?].*'))) {
                    element.addClass(className);
                }
                else element.removeClass(className);
            }
            else if(href) {
                href = href.match(/^([^\#]*)\#([^\#\?]*).*$/); // /catalog#/muzi
                href = href ? href[href.length-1] : null;
                if(href) scope.$on('$locationChangeSuccess', checkMatch);
                checkMatch();
            }
            
            function checkMatch(){
                if(($location.path()+'/').match(new RegExp('^' +href+ '[\/\#\?].*'))) {
                    element.addClass(className);
                }
                else element.removeClass(className);
            }
        }
    };
}])
.directive('neFile', [function() {
    return {
        restrict: 'E',
        template: '<input type="file" />',
        replace: true,
        require: 'ngModel',
        link: function(scope, element, attr, ctrl) {
            var listener = function() {
                scope.$apply(function() {
                    if(attr.multiple || attr.multiple===''){
                        var files = [];
                        for(var i=0;i<element[0].files.length;i++) files.push(element[0].files[i]);
                        ctrl.$setViewValue(files);
                    }
                    else {
                        ctrl.$setViewValue(element[0].files[0]);
                    }
                });
            };
            element.attr('accept', attr.accept);
            element.bind('change', listener);
        }
    };
}])
.service('neFileDropArea', ['$q', function($q){
    'use strict';
    
	this.bind = function(elm, afterDrop, readAs, onError) { // readAsDataURL, readAsText, readAsArrayBuffer
        var dropbox = elm[0];
        var dragover = false;
        
        // Setup drag and drop handlers.
        dropbox.addEventListener('dragenter', addDragClass, false);
        dropbox.addEventListener('dragover', addDragClass, false);
        dropbox.addEventListener('dragleave', removeDragClass, false);
        dropbox.addEventListener('drop', onDrop, false);
          
        function stopDefault(e) {
            e.stopPropagation();
            e.preventDefault();
        }
        
        function addDragClass(e){
            stopDefault(e);
            if(!dragover) {
                elm.addClass('ne-dragover');
                dragover = true;
            }
        }
        
        function removeDragClass(e){
            stopDefault(e);
            elm.removeClass('ne-dragover');
            dragover = false;
        }

		function getFilePromise(entry) {
			return $q(function(resolve, reject){
				entry.file(resolve, reject);
			});
		}
		
		function readEntriesPromise(directoryReader) {
			return $q(function(resolve, reject){
				directoryReader.readEntries(resolve, reject);
			});
		}

		function getFilesRecursively(entry){
			if (entry.isFile) {	
				return getFilePromise(entry);
			} else if (entry.isDirectory) {
				return readEntriesPromise(entry.createReader()).then(function(entries){
					
					var promises = [];
					for (var i=0; i<entries.length; i++){
						promises.push(getFilesRecursively(entries[i]));
					}

					return $q.all(promises).then(function(arrays){
						return [].concat.apply([], arrays);
					})
				})
			}
		}

		function getFilesPromise(e) {
			var items = e.dataTransfer.items;

			if (!items) return $q.resolve(e.dataTransfer.files);
			if (!items[0].webkitGetAsEntry) return $q.resolve(e.dataTransfer.files);

			var files = [];
			var promises = [];
			for (var i=0; i<items.length; i++) {
				promises.push(getFilesRecursively(items[i].webkitGetAsEntry()));
			}

			return $q.all(promises).then(function(arrays){
				files = [].concat.apply([], arrays);
				return $q.resolve(files);
			})
		}
          
        function onDrop(e) {
            removeDragClass(e);

			getFilesPromise(e).then(function(files){
				var readFileSize = 0;
				var file = files[0];
				if(!file) return;
				readFileSize += file.fileSize;
            
				// Only process image files.
				// var imageType = /image.*/;
				// if (!file.type.match(imageType)) return;
            
				if(readAs){
					var reader = new FileReader();
					reader.onerror = function(e) {
						alert('Cannot read file: ' + e.target.error);
					};
                
					// Create a closure to capture the file information.
					reader.onload = (function(aFile) {
						return function(evt) {
							afterDrop(evt.target.result);
						};
					})(file);
                
					// Read in the image file as a data url.
					reader[readAs](file);
					// readAsDataURL, readAsText, readAsArrayBuffer
				}
				else afterDrop(files);
			})
			.catch(onError);
        }
        
        return {
            unbind:function(){
                dragover = null;
                
                // Remove drag and drop handlers.
                dropbox.removeEventListener('dragenter', addDragClass, false);
                dropbox.removeEventListener('dragover', addDragClass, false);
                dropbox.removeEventListener('dragleave', removeDragClass, false);
                dropbox.removeEventListener('drop', onDrop, false);
            }
        };
    };
    
    return this;
}])
.directive('neFileDropArea',['neFileDropArea', function(fileDropArea) {
    return {
        restrict: 'A',
		scope: {
			'onError': '&neFileDropOnError',
			'onDrop': '&neFileDrop'
		},
        link: function(scope, element, attrs, ctrl) {
            var typeRegexp = attrs.dmsFileDropArea ? new RegExp(attrs.dmsFileDropArea) : null;
            
            element.on('load', function(){
                scope.setNaturalHeight(this.naturalHeight);
                scope.setNaturalWidth(this.naturalWidth);
            });

			var onError = function(error){
				scope.onError({error: error});
			}

            var area = fileDropArea.bind(element, function(files){
                var filesArray = [];
                for(var i=0;i<files.length;i++) {
                    if(!typeRegexp || files[i].type.match(typeRegexp)) filesArray.push(files[i]);
                }
                
                if(filesArray.length && scope.onDrop) scope.onDrop({files: filesArray});
            }, null, onError);
            scope.$on('$destroy', area.unbind);
        }
    };
}])
.directive('neCopy',[function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs, ctrl) {
            var original = scope.$eval(attrs.neCopy);
            var propName = scope.alias || attrs.neCopyAlias || '$copy';
            
            function rollback(){ 
                scope[ propName ] = angular.copy(original); 
            }
            
            function commit(){
                var copy = scope[ propName ];
                
                // replace all original properties by copy
                for(var key in copy) {
                    if(copy.hasOwnProperty(key) && !(key[0]==='$' && key[1]==='$')){ // dont copy $$ prefixed props
                        original[key] = copy[key];
                    }
                }
            }
            
            scope.$rollback = rollback;
            scope.$commit = commit;
            original.$commit = commit;
            original.$rollback = rollback;
            scope.$rollback();
        }
    };
}])
.directive('neFormChange',[function() {
    return {
        restrict: 'A',
        require:'^form',
        link: function(scope, element, attrs, formCtrl) {
            scope.$watch(function(){
                return formCtrl.$valid;
            }, function(isValid){
                scope.$valid = scope.$isValid = isValid;
                scope.$eval(attrs.neFormChange);
            });
        }
    };
}])
.directive('neBindHtml',['$sce', function($sce) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            attrs.$observe('neBindHtml', function(htmlText){
                element.html(htmlText);
            });
        }
    };
}])
.filter('html', ['$sce', function ($sce) { 
    return function (text) {
        return $sce.trustAsHtml(text);
    };    
}])
.filter('trusted', ['$sce', function ($sce) { // alias for html
    return function (text) {
        return $sce.trustAsHtml(text);
    };    
}]);